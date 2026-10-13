import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VideoPlayerOverlays from './VideoPlayerOverlays';

describe('VideoPlayerOverlays Component', () => {
  it('renders loading spinner and transition poster when isLoading is true', () => {
    render(
      <VideoPlayerOverlays
        isLoading={true}
        isBuffering={false}
        poster="https://b2.com/poster.jpg"
        hasError={false}
        isPlaying={false}
        togglePlay={vi.fn()}
        handleRetry={vi.fn()}
      />
    );

    expect(screen.getByTestId('video-loading-spinner')).toBeInTheDocument();
    expect(screen.getByTestId('video-poster-transition')).toBeInTheDocument();
    expect(screen.getByText('Carregando aula...')).toBeInTheDocument();
  });

  it('renders buffering message when isBuffering is true', () => {
    render(
      <VideoPlayerOverlays
        isLoading={false}
        isBuffering={true}
        poster={null}
        hasError={false}
        isPlaying={true}
        togglePlay={vi.fn()}
        handleRetry={vi.fn()}
      />
    );

    expect(screen.getByTestId('video-loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Carregando vídeo...')).toBeInTheDocument();
    expect(screen.getByText('Baixando dados de transmissão, aguarde...')).toBeInTheDocument();
  });

  it('renders big play button when paused and ready, triggering togglePlay on click', () => {
    const togglePlay = vi.fn();
    render(
      <VideoPlayerOverlays
        isLoading={false}
        isBuffering={false}
        poster="https://b2.com/poster.jpg"
        hasError={false}
        isPlaying={false}
        togglePlay={togglePlay}
        handleRetry={vi.fn()}
      />
    );

    const playBtn = screen.getByTestId('video-big-play-btn');
    expect(playBtn).toBeInTheDocument();
    fireEvent.click(playBtn);
    expect(togglePlay).toHaveBeenCalledTimes(1);
  });

  it('renders error overlay when hasError is true and calls handleRetry on click', () => {
    const handleRetry = vi.fn();
    render(
      <VideoPlayerOverlays
        isLoading={false}
        isBuffering={false}
        poster={null}
        hasError={true}
        isPlaying={false}
        togglePlay={vi.fn()}
        handleRetry={handleRetry}
      />
    );

    expect(screen.getByTestId('video-error-screen')).toBeInTheDocument();
    expect(screen.getByText('Falha ao carregar o vídeo')).toBeInTheDocument();
    const retryBtn = screen.getByText('Tentar Novamente');
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
