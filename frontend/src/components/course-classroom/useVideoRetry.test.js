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
});
