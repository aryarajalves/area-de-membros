import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVideoRetry } from './useVideoRetry';

describe('useVideoRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setupHook(overrides = {}) {
    const loadMock = vi.fn();
    const playMock = vi.fn().mockResolvedValue(undefined);
    const videoRef = {
      current: {
        currentTime: 42.5,
        load: loadMock,
        play: playMock,
      },
    };
    const setIsLoading = vi.fn();
    const setIsBuffering = vi.fn();
    const setHasError = vi.fn();
    const setIsPlaying = vi.fn();

    const hook = renderHook((props) => useVideoRetry(props), {
      initialProps: {
        src: 'https://cdn.example.com/video.mp4',
        videoRef,
        currentTime: 42.5,
        isPlaying: true,
        setIsLoading,
        setIsBuffering,
        setHasError,
        setIsPlaying,
        ...overrides,
      },
    });

    return {
      ...hook,
      videoRef,
      loadMock,
      playMock,
      setIsLoading,
      setIsBuffering,
      setHasError,
      setIsPlaying,
    };
  }

  it('realiza retry automático até 3 vezes antes de exibir erro e preserva a posição', async () => {
    const { result, videoRef, loadMock, playMock, setHasError, setIsBuffering } = setupHook();

    // 1ª falha: agenda retry em 800ms sem mostrar erro
    act(() => {
      result.current.handleVideoError();
    });
    expect(setHasError).not.toHaveBeenCalledWith(true);
    expect(setIsBuffering).toHaveBeenCalledWith(true);

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(loadMock).toHaveBeenCalledTimes(1);

    // Simula que o navegador zerou currentTime no load() e restaura ao carregar metadados
    videoRef.current.currentTime = 0;
    await act(async () => {
      result.current.restorePositionIfPending(false);
    });
    expect(videoRef.current.currentTime).toBe(42.5);
    expect(playMock).toHaveBeenCalledTimes(1);

    // 2ª e 3ª falhas consecutivas ainda tentam automaticamente
    act(() => {
      result.current.handleVideoError();
      vi.advanceTimersByTime(1600);
      result.current.handleVideoError();
      vi.advanceTimersByTime(2400);
    });
    expect(loadMock).toHaveBeenCalledTimes(3);
    expect(setHasError).not.toHaveBeenCalledWith(true);

    // 4ª falha: esgotou MAX_AUTO_RETRIES -> exibe erro
    act(() => {
      result.current.handleVideoError();
    });
    expect(setHasError).toHaveBeenCalledWith(true);
  });

  it('reseta contador ao voltar a tocar (markPlaybackHealthy)', () => {
    const { result, loadMock, setHasError } = setupHook();

    act(() => {
      result.current.handleVideoError();
      vi.advanceTimersByTime(800);
      result.current.handleVideoError();
      vi.advanceTimersByTime(1600);
      result.current.markPlaybackHealthy();
      result.current.handleVideoError();
      vi.advanceTimersByTime(800);
    });

    expect(loadMock).toHaveBeenCalledTimes(3);
    expect(setHasError).not.toHaveBeenCalledWith(true);
  });

  it('handleRetry manual limpa erro e recarrega preservando posição', async () => {
    const { result, videoRef, loadMock, setHasError, setIsLoading } = setupHook();

    act(() => {
      result.current.handleRetry();
    });

    expect(setHasError).toHaveBeenCalledWith(false);
    expect(setIsLoading).toHaveBeenCalledWith(true);
    expect(loadMock).toHaveBeenCalledTimes(1);

    videoRef.current.currentTime = 0;
    await act(async () => {
      result.current.restorePositionIfPending(false);
    });
    expect(videoRef.current.currentTime).toBe(42.5);
  });

  it('ativa isStalledTooLong e reconecta automaticamente após 8 segundos preso em buffering', async () => {
    const { result, rerender, loadMock, playMock } = setupHook({
      isPlaying: false,
      isBuffering: true,
      currentTime: 0,
    });

    expect(result.current.isStalledTooLong).toBe(false);

    // Antes de 8s ainda não disparou watchdog
    act(() => {
      vi.advanceTimersByTime(7900);
    });
    expect(result.current.isStalledTooLong).toBe(false);
    expect(loadMock).not.toHaveBeenCalled();

    // Ao completar 8000ms em buffering, ativa botão de reconexão e tenta recarregar o vídeo
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.isStalledTooLong).toBe(true);
    expect(loadMock).toHaveBeenCalledTimes(1);

    // Quando metadata recarrega, retoma play automaticamente mesmo que isPlaying ainda fosse false
    await act(async () => {
      result.current.restorePositionIfPending(false);
    });
    expect(playMock).toHaveBeenCalledTimes(1);

    // Quando buffering encerra, isStalledTooLong volta para false
    rerender({
      src: 'https://cdn.example.com/video.mp4',
      videoRef: { current: { currentTime: 0, load: loadMock, play: playMock } },
      currentTime: 0,
      isPlaying: true,
      isBuffering: false,
      setIsLoading: vi.fn(),
      setIsBuffering: vi.fn(),
      setHasError: vi.fn(),
      setIsPlaying: vi.fn(),
    });
    expect(result.current.isStalledTooLong).toBe(false);
  });

  it('envia telemetria diagnóstica para /api/v1/logs/video-telemetry em travamento ou erro', () => {
    localStorage.setItem('auth_token', 'fake-jwt-token');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    const { result, videoRef } = setupHook({
      title: 'Aula Diagnóstico',
      isBuffering: true,
      isPlaying: false,
    });
    videoRef.current.readyState = 1;
    videoRef.current.networkState = 2;
    videoRef.current.error = { code: 2, message: 'Network error' };

    act(() => {
      vi.advanceTimersByTime(8000);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/logs/video-telemetry',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer fake-jwt-token',
        }),
      })
    );
    const bodyStall = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(bodyStall.event_type).toBe('BUFFERING_STALL_8S');
    expect(bodyStall.lesson_title).toBe('Aula Diagnóstico');
    expect(bodyStall.ready_state).toBe(1);
    expect(bodyStall.network_state).toBe(2);

    act(() => {
      result.current.handleVideoError();
    });
    const bodyError = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(bodyError.event_type).toBe('VIDEO_STREAM_ERROR');
    expect(bodyError.error_code).toBe(2);
    localStorage.clear();
  });

  it('diagnostica bloqueio corporativo e aciona fallback automático de proxy quando sonda confirma acesso no servidor', async () => {
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (String(url).includes('/api/v1/courses/video-stream-probe')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ reachable_from_server: true, storage: 'b2' }),
        });
      }
      return Promise.resolve({ ok: true });
    });
    global.fetch = fetchMock;

    const externalSrc = 'https://s3.us-west-004.backblazeb2.com/bucket/AreaDeMembros/videos/vid_corp.mp4';
    const { result, setHasError, loadMock } = setupHook({ src: externalSrc });

    // Esgota as 3 tentativas iniciais e dispara erro na 4ª
    act(() => {
      result.current.handleVideoError();
      vi.advanceTimersByTime(800);
      result.current.handleVideoError();
      vi.advanceTimersByTime(1600);
      result.current.handleVideoError();
      vi.advanceTimersByTime(2400);
    });

    await act(async () => {
      result.current.handleVideoError();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.networkDiagnosis).toBe('corporate_block');
    expect(result.current.isUsingProxyFallback).toBe(true);
    expect(result.current.activeSrc).toBe(
      `/api/v1/courses/video-proxy?video_url=${encodeURIComponent(externalSrc)}`
    );
    expect(setHasError).toHaveBeenCalledWith(false);

    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(loadMock).toHaveBeenCalledTimes(4);
  });

  it('permite acionar manualmente switchToProxyFallback e preserva a posição atual', () => {
    const externalSrc = 'https://cdn.example.com/AreaDeMembros/videos/vid_manual.mp4';
    const { result, setHasError, setIsLoading, loadMock } = setupHook({ src: externalSrc });

    act(() => {
      result.current.switchToProxyFallback();
    });

    expect(result.current.isUsingProxyFallback).toBe(true);
    expect(result.current.activeSrc).toContain('/api/v1/courses/video-proxy?video_url=');
    expect(setHasError).toHaveBeenCalledWith(false);
    expect(setIsLoading).toHaveBeenCalledWith(true);

    act(() => {
      vi.advanceTimersByTime(60);
    });
    expect(loadMock).toHaveBeenCalledTimes(1);
  });
});
