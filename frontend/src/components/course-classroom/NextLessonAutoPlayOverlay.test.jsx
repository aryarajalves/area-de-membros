import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import NextLessonAutoPlayOverlay from './NextLessonAutoPlayOverlay';
import CustomVideoPlayer from './CustomVideoPlayer';

describe('Item 7 - NextLessonAutoPlayOverlay & Auto-Play estilo Netflix', () => {
  const sampleNextLesson = {
    id: 99,
    title: 'Aula 02: Desvendando o Algoritmo na Prática',
    thumbnail_url: 'https://cdn.example.com/thumb2.jpg'
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza os dados da próxima aula com contagem regressiva e botões', () => {
    const onPlayNext = vi.fn();
    const onCancel = vi.fn();

    render(
      <NextLessonAutoPlayOverlay
        nextLesson={sampleNextLesson}
        onPlayNext={onPlayNext}
        onCancel={onCancel}
        countdownSeconds={5}
      />
    );

    expect(screen.getByTestId('next-lesson-autoplay-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('autoplay-countdown-label')).toHaveTextContent('Próxima aula em 5s...');
    expect(screen.getByTestId('autoplay-next-lesson-title')).toHaveTextContent('Aula 02: Desvendando o Algoritmo na Prática');
    expect(screen.getByTestId('autoplay-play-now-btn')).toBeInTheDocument();
    expect(screen.getByTestId('autoplay-cancel-btn')).toBeInTheDocument();
  });

  it('dispara onPlayNext automaticamente quando o cronômetro zera', () => {
    const onPlayNext = vi.fn();
    const onCancel = vi.fn();

    render(
      <NextLessonAutoPlayOverlay
        nextLesson={sampleNextLesson}
        onPlayNext={onPlayNext}
        onCancel={onCancel}
        countdownSeconds={3}
      />
    );

    expect(screen.getByTestId('autoplay-countdown-label')).toHaveTextContent('Próxima aula em 3s...');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('autoplay-countdown-label')).toHaveTextContent('Próxima aula em 2s...');

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(onPlayNext).toHaveBeenCalledTimes(1);
  });

  it('permite cancelar a contagem regressiva pelo botão Cancelar ou X', () => {
    const onPlayNext = vi.fn();
    const onCancel = vi.fn();

    render(
      <NextLessonAutoPlayOverlay
        nextLesson={sampleNextLesson}
        onPlayNext={onPlayNext}
        onCancel={onCancel}
        countdownSeconds={5}
      />
    );

    fireEvent.click(screen.getByTestId('autoplay-cancel-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('autoplay-cancel-x-btn'));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('no CustomVideoPlayer, ao terminar o vídeo (onEnded) abre o overlay de autoplay se houver nextLesson', () => {
    const onPlayNextLesson = vi.fn();

    render(
      <CustomVideoPlayer
        src="https://example.com/video.mp4"
        title="Aula 01"
        nextLesson={sampleNextLesson}
        onPlayNextLesson={onPlayNextLesson}
      />
    );

    expect(screen.queryByTestId('next-lesson-autoplay-overlay')).not.toBeInTheDocument();

    const videoEl = screen.getByTestId('lesson-html5-video');
    fireEvent.ended(videoEl);

    expect(screen.getByTestId('next-lesson-autoplay-overlay')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('autoplay-play-now-btn'));
    expect(onPlayNextLesson).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('next-lesson-autoplay-overlay')).not.toBeInTheDocument();
  });
});
