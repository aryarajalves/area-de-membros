import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VideoWatermark from './VideoWatermark';

describe('VideoWatermark Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders nothing when no student identifier is available', () => {
    const { container } = render(<VideoWatermark />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders student email passed via prop', () => {
    render(<VideoWatermark studentIdentifier="aluno@teste.com" />);

    const watermark = screen.getByTestId('video-watermark-overlay');
    expect(watermark).toBeInTheDocument();
    expect(watermark).toHaveTextContent('aluno@teste.com');
    expect(watermark).toHaveStyle({ pointerEvents: 'none', userSelect: 'none' });
  });

  it('reads student email from localStorage when prop is not provided', () => {
    localStorage.setItem(
      'auth_user',
      JSON.stringify({ id: 1, name: 'Rodrigo Aluno', email: 'rodrigo@plataforma.com' })
    );

    render(<VideoWatermark />);

    const watermark = screen.getByTestId('video-watermark-overlay');
    expect(watermark).toBeInTheDocument();
    expect(watermark).toHaveTextContent('rodrigo@plataforma.com');
  });

  it('moves position dynamically over time', () => {
    vi.useFakeTimers();

    render(<VideoWatermark studentIdentifier="anti_pirata@teste.com" />);

    const watermark = screen.getByTestId('video-watermark-overlay');
    expect(watermark).toBeInTheDocument();

    // Avança 20 segundos
    act(() => {
      vi.advanceTimersByTime(20000);
    });

    expect(watermark).toBeInTheDocument();

    vi.useRealTimers();
  });
});
