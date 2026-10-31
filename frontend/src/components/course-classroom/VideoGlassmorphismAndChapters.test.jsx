import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import VideoPlayerOverlays from './VideoPlayerOverlays';
import VideoChaptersTrack from './VideoChaptersTrack';

describe('Item 8 - Botão Central Glassmorphism e Trilha de Capítulos IA', () => {
  it('renderiza o botão central de play com efeito Glassmorphism quando pausado e pronto', () => {
    const togglePlay = vi.fn();

    render(
      <VideoPlayerOverlays
        isLoading={false}
        isBuffering={false}
        poster={null}
        hasError={false}
        isPlaying={false}
        togglePlay={togglePlay}
        handleRetry={vi.fn()}
      />
    );

    const playBtn = screen.getByTestId('video-big-play-btn');
    expect(playBtn).toBeInTheDocument();
    expect(playBtn).toHaveStyle({
      position: 'absolute',
      width: '68px',
      height: '68px',
      borderRadius: '50%'
    });

    fireEvent.click(playBtn);
    expect(togglePlay).toHaveBeenCalledTimes(1);

    // Efeito hover
    fireEvent.mouseEnter(playBtn);
    expect(playBtn.style.transform).toBe('scale(1.1)');

    fireEvent.mouseLeave(playBtn);
    expect(playBtn.style.transform).toBe('scale(1)');
  });

  it('renderiza a trilha segmentada de capítulos com preenchimento dourado/amarelo neon e tooltip de hover', () => {
    const chapters = [
      { time: '00:00', title: 'Introdução aos Fundamentos', seconds: 0 },
      { time: '02:00', title: 'Configuração Prática', seconds: 120 },
      { time: '05:00', title: 'Conclusão e Próximos Passos', seconds: 300 }
    ];

    const onSeekToSeconds = vi.fn();
    const setHoveredChapter = vi.fn();

    render(
      <VideoChaptersTrack
        chapters={chapters}
        effectiveDuration={600}
        currentTime={150} // No meio do capítulo 2
        onSeekToSeconds={onSeekToSeconds}
        hoveredChapter={null}
        setHoveredChapter={setHoveredChapter}
      />
    );

    expect(screen.getByTestId('video-chapters-track')).toBeInTheDocument();
    expect(screen.getByTestId('video-chapter-segment-0')).toBeInTheDocument();
    expect(screen.getByTestId('video-chapter-segment-1')).toBeInTheDocument();
    expect(screen.getByTestId('video-chapter-segment-2')).toBeInTheDocument();

    // Capítulo 0 (já passou): 100% preenchido
    const fill0 = screen.getByTestId('video-chapter-filled-0');
    expect(fill0).toHaveStyle({ width: '100%' });

    // Clicar no segmento 1 deve buscar para 120s
    fireEvent.click(screen.getByTestId('video-chapter-segment-1'));
    expect(onSeekToSeconds).toHaveBeenCalledWith(120);

    // Passar mouse deve chamar setHoveredChapter com os dados do capítulo
    fireEvent.mouseEnter(screen.getByTestId('video-chapter-segment-1'));
    expect(setHoveredChapter).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Configuração Prática',
        seconds: 120
      })
    );
  });
});
