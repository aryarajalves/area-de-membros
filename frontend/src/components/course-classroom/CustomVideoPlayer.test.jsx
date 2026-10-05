import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomVideoPlayer from './CustomVideoPlayer';

describe('CustomVideoPlayer Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    // Mock métodos HTMLMediaElement que jsdom não implementa
    window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue();
    window.HTMLMediaElement.prototype.pause = vi.fn();
  });

  it('renders video element, controls, and initial time with fallback duration', () => {
    render(
      <CustomVideoPlayer
        src="https://b2.com/video.mp4"
        poster="https://b2.com/thumb.jpg"
        title="Aula 01"
        lessonDuration="20 min"
      />
    );

    const video = screen.getByTestId('lesson-html5-video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://b2.com/video.mp4');
    expect(video).toHaveAttribute('poster', 'https://b2.com/thumb.jpg');

    // Controles devem estar presentes
    expect(screen.getByTestId('video-play-pause-btn')).toBeInTheDocument();
    expect(screen.getByTestId('skip-backward-10-btn')).toBeInTheDocument();
    expect(screen.getByTestId('skip-forward-10-btn')).toBeInTheDocument();
    expect(screen.getByTestId('video-progress-bar-container')).toBeInTheDocument();

    // Exibe tempo e tempo restante ("Faltam 20:00")
    const timeDisplay = screen.getByTestId('video-time-display');
    expect(timeDisplay).toHaveTextContent('00:00');
    expect(timeDisplay).toHaveTextContent('20:00');
    expect(screen.getByTestId('video-remaining-time')).toHaveTextContent('Faltam 20:00');
  });

  it('toggles play and pause on button click or video click', () => {
    render(
      <CustomVideoPlayer
        src="https://b2.com/video.mp4"
        title="Aula 01"
        lessonDuration="10 min"
      />
    );

    const playPauseBtn = screen.getByTestId('video-play-pause-btn');
    fireEvent.click(playPauseBtn);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();

    // Clica no vídeo diretamente
    const video = screen.getByTestId('lesson-html5-video');
    fireEvent.click(video);
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
  });

  it('skips forward and backward by 10 seconds', () => {
    render(
      <CustomVideoPlayer
        src="https://b2.com/video.mp4"
        title="Aula 01"
        lessonDuration="10:00"
      />
    );

    const video = screen.getByTestId('lesson-html5-video');
    video.currentTime = 30;

    // Avança 10s (+10s)
    const forwardBtn = screen.getByTestId('skip-forward-10-btn');
    fireEvent.click(forwardBtn);
    expect(video.currentTime).toBe(40);

    // Retrocede 10s (-10s)
    const backwardBtn = screen.getByTestId('skip-backward-10-btn');
    fireEvent.click(backwardBtn);
    expect(video.currentTime).toBe(30);

    // Retrocede além do zero deve travar em 0
    video.currentTime = 5;
    fireEvent.click(backwardBtn);
    expect(video.currentTime).toBe(0);
  });

  it('allows seeking through progress bar click (scrubbing)', () => {
    render(
      <CustomVideoPlayer
        src="https://b2.com/video.mp4"
        title="Aula 01"
        lessonDuration="10:00"
      />
    );

    const video = screen.getByTestId('lesson-html5-video');
    const progressBar = screen.getByTestId('video-progress-bar-container');

    // Mock do getBoundingClientRect da barra de progresso (largura 500px, início no x=100)
    vi.spyOn(progressBar, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      width: 500,
      top: 0,
      bottom: 14,
      right: 600,
      height: 14,
      x: 100,
      y: 0,
      toJSON: () => {}
    });

    // Clica no meio da barra (x=350 -> (350-100)/500 = 50% de 600s = 300s)
    fireEvent.mouseDown(progressBar, { clientX: 350 });
    expect(video.currentTime).toBe(300);
  });

  it('toggles mute and changes volume', () => {
    render(
      <CustomVideoPlayer
        src="https://b2.com/video.mp4"
        title="Aula 01"
        lessonDuration="10 min"
      />
    );

    const video = screen.getByTestId('lesson-html5-video');
    const muteBtn = screen.getByTestId('video-mute-btn');
    const volumeSlider = screen.getByTestId('video-volume-slider');

    // Clica em mutar
    fireEvent.click(muteBtn);
    expect(video.muted).toBe(true);

    // Clica novamente para desmutar
    fireEvent.click(muteBtn);
    expect(video.muted).toBe(false);

    // Ajusta volume via slider
    fireEvent.change(volumeSlider, { target: { value: '0.5' } });
    expect(video.volume).toBe(0.5);
  });

  it('requests fullscreen on fullscreen button click', () => {
    const requestFullscreenMock = vi.fn().mockResolvedValue();
    const container = render(
      <CustomVideoPlayer
        src="https://b2.com/video.mp4"
        title="Aula 01"
        lessonDuration="10 min"
      />
    );

    const containerEl = screen.getByTestId('custom-video-player-container');
    containerEl.requestFullscreen = requestFullscreenMock;

    const fullscreenBtn = screen.getByTestId('video-fullscreen-btn');
    fireEvent.click(fullscreenBtn);
    expect(requestFullscreenMock).toHaveBeenCalled();
  });

  it('renders loading spinner and poster transition initially and hides on canPlay', () => {
    render(
      <CustomVideoPlayer
        src="https://b2.com/video.mp4"
        poster="https://b2.com/thumb.jpg"
        title="Aula 01"
        lessonDuration="10 min"
      />
    );

    // Inicialmente deve mostrar o spinner de carregamento inicial e poster de transição
    expect(screen.getByTestId('video-loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/Carregando aula/i)).toBeInTheDocument();
    expect(screen.getByTestId('video-poster-transition')).toBeInTheDocument();
    expect(screen.getByTestId('video-buffered-bar')).toBeInTheDocument();

    const video = screen.getByTestId('lesson-html5-video');

    // Ao disparar canPlay, o spinner some e surge o botão grande de play
    fireEvent.canPlay(video);
    expect(screen.queryByTestId('video-loading-spinner')).not.toBeInTheDocument();
    expect(screen.getByTestId('video-big-play-btn')).toBeInTheDocument();

    // Clica no botão grande de play
    fireEvent.click(screen.getByTestId('video-big-play-btn'));
    expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('displays buffering overlay when video stalls or waits for network data', () => {
    render(
      <CustomVideoPlayer
        src="https://b2.com/video.mp4"
        title="Aula 01"
        lessonDuration="10 min"
      />
    );

    const video = screen.getByTestId('lesson-html5-video');
    fireEvent.canPlay(video);
    expect(screen.queryByTestId('video-loading-spinner')).not.toBeInTheDocument();

    // Simula evento de espera por dados da rede (waiting / buffer)
    fireEvent.waiting(video);
    expect(screen.getByTestId('video-loading-spinner')).toBeInTheDocument();
    expect(screen.getByText(/Carregando vídeo/i)).toBeInTheDocument();
    expect(screen.getByText(/Baixando dados de transmissão/i)).toBeInTheDocument();

    // Simula retomada da reprodução após bufferizar
    fireEvent.playing(video);
    expect(screen.queryByTestId('video-loading-spinner')).not.toBeInTheDocument();
  });
});
