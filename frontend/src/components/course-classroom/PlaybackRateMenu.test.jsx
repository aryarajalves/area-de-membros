import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PlaybackRateMenu, { SPEED_OPTIONS } from './PlaybackRateMenu';

describe('PlaybackRateMenu', () => {
  it('exibe a velocidade atual no botão', () => {
    render(<PlaybackRateMenu playbackRate={1.5} onPlaybackRateChange={vi.fn()} />);

    expect(screen.getByTestId('video-speed-btn')).toBeInTheDocument();
    expect(screen.getByTestId('video-speed-label')).toHaveTextContent('1.5x');
  });

  it('abre o menu ao clicar no botão e lista todas as velocidades', () => {
    render(<PlaybackRateMenu playbackRate={1} onPlaybackRateChange={vi.fn()} />);

    expect(screen.queryByTestId('video-speed-menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('video-speed-btn'));

    expect(screen.getByTestId('video-speed-menu')).toBeInTheDocument();
    SPEED_OPTIONS.forEach((speed) => {
      expect(screen.getByTestId(`video-speed-option-${speed}`)).toBeInTheDocument();
    });
  });

  it('chama onPlaybackRateChange e fecha o menu ao selecionar uma velocidade', () => {
    const onPlaybackRateChange = vi.fn();
    render(<PlaybackRateMenu playbackRate={1} onPlaybackRateChange={onPlaybackRateChange} />);

    fireEvent.click(screen.getByTestId('video-speed-btn'));
    fireEvent.click(screen.getByTestId('video-speed-option-2'));

    expect(onPlaybackRateChange).toHaveBeenCalledWith(2);
    expect(screen.queryByTestId('video-speed-menu')).not.toBeInTheDocument();
  });
});
