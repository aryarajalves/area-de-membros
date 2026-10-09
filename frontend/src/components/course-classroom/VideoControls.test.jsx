import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VideoControls from './VideoControls';

describe('VideoControls Component', () => {
  const defaultProps = {
    showControls: true,
    isPlaying: false,
    isScrubbing: false,
    currentTime: 15,
    effectiveDuration: 120,
    progressPercentage: 12.5,
    remainingSeconds: 105,
    volume: 0.8,
    isMuted: false,
    isFullscreen: false,
    progressBarRef: { current: null },
    togglePlay: vi.fn(),
    handleSkipBackward10: vi.fn(),
    handleSkipForward10: vi.fn(),
    handleProgressBarMouseDown: vi.fn(),
    toggleMute: vi.fn(),
    handleVolumeChange: vi.fn(),
    toggleFullscreen: vi.fn()
  };

  it('renders all playback controls and time displays correctly', () => {
    render(<VideoControls {...defaultProps} />);

    expect(screen.getByTestId('custom-video-controls')).toBeInTheDocument();
    expect(screen.getByTestId('video-play-pause-btn')).toBeInTheDocument();
    expect(screen.getByTestId('skip-backward-10-btn')).toBeInTheDocument();
    expect(screen.getByTestId('skip-forward-10-btn')).toBeInTheDocument();
    expect(screen.getByTestId('video-progress-bar-container')).toBeInTheDocument();
    expect(screen.getByTestId('video-time-display')).toHaveTextContent('00:15');
    expect(screen.getByTestId('video-time-display')).toHaveTextContent('02:00');
    expect(screen.getByTestId('video-remaining-time')).toHaveTextContent('Faltam 01:45');
    expect(screen.getByTestId('video-mute-btn')).toBeInTheDocument();
    expect(screen.getByTestId('video-volume-slider')).toBeInTheDocument();
    expect(screen.getByTestId('video-fullscreen-btn')).toBeInTheDocument();
    expect(screen.getByTestId('video-buffered-bar')).toBeInTheDocument();
  });

  it('renders buffered bar with correct percentage width', () => {
    render(<VideoControls {...defaultProps} bufferedPercentage={45} />);
    const bufferedBar = screen.getByTestId('video-buffered-bar');
    expect(bufferedBar).toBeInTheDocument();
    expect(bufferedBar).toHaveStyle({ width: '45%' });
  });

  it('triggers playback and volume actions on button clicks', () => {
    render(<VideoControls {...defaultProps} />);

    fireEvent.click(screen.getByTestId('video-play-pause-btn'));
    expect(defaultProps.togglePlay).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('skip-backward-10-btn'));
    expect(defaultProps.handleSkipBackward10).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('skip-forward-10-btn'));
    expect(defaultProps.handleSkipForward10).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('video-mute-btn'));
    expect(defaultProps.toggleMute).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('video-fullscreen-btn'));
    expect(defaultProps.toggleFullscreen).toHaveBeenCalled();
  });

  it('renders chapters progress track, active chapter badge and triggers drawer toggle', () => {
    const onToggleChaptersDrawer = vi.fn();
    const onSeekToSeconds = vi.fn();
    const sampleChapters = [
      { time: '00:00', seconds: 0, title: 'Introdução' },
      { time: '01:00', seconds: 60, title: 'Conteúdo' }
    ];

    render(
      <VideoControls
        {...defaultProps}
        currentTime={10}
        chapters={sampleChapters}
        onToggleChaptersDrawer={onToggleChaptersDrawer}
        onSeekToSeconds={onSeekToSeconds}
        isChaptersDrawerOpen={false}
      />
    );

    // Segmentos da barra de progresso estilo YouTube
    expect(screen.getByTestId('video-chapters-track')).toBeInTheDocument();
    expect(screen.getByTestId('video-chapter-segment-0')).toBeInTheDocument();
    expect(screen.getByTestId('video-chapter-segment-1')).toBeInTheDocument();

    // Badge do capítulo ativo
    const activeBadge = screen.getByTestId('active-chapter-indicator');
    expect(activeBadge).toBeInTheDocument();
    expect(activeBadge).toHaveTextContent('Introdução');

    // Botão de abrir/fechar drawer de capítulos
    const toggleBtn = screen.getByTestId('btn-toggle-video-chapters');
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(onToggleChaptersDrawer).toHaveBeenCalledTimes(1);
  });

  it('renders playback speed button, opens speed options menu and selects new speed', () => {
    const handlePlaybackRateChange = vi.fn();
    render(
      <VideoControls
        {...defaultProps}
        playbackRate={1}
        onPlaybackRateChange={handlePlaybackRateChange}
      />
    );

    // Botão de velocidade visível exibindo 1x
    const speedBtn = screen.getByTestId('video-speed-btn');
    expect(speedBtn).toBeInTheDocument();
    expect(screen.getByTestId('video-speed-label')).toHaveTextContent('1x');

    // Menu inicialmente fechado
    expect(screen.queryByTestId('video-speed-menu')).not.toBeInTheDocument();

    // Clica no botão de velocidade para abrir o popover
    fireEvent.click(speedBtn);
    expect(screen.getByTestId('video-speed-menu')).toBeInTheDocument();

    // Opções de velocidade disponíveis (0.5x até 2x)
    expect(screen.getByTestId('video-speed-option-1.5')).toBeInTheDocument();
    expect(screen.getByTestId('video-speed-option-2')).toBeInTheDocument();

    // Seleciona 1.5x
    fireEvent.click(screen.getByTestId('video-speed-option-1.5'));
    expect(handlePlaybackRateChange).toHaveBeenCalledWith(1.5);

    // Menu fecha após a seleção
    expect(screen.queryByTestId('video-speed-menu')).not.toBeInTheDocument();
  });
});

