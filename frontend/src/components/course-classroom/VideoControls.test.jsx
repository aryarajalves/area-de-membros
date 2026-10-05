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
});
