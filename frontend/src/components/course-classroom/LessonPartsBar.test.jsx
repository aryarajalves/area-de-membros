import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LessonPartsBar from './LessonPartsBar';

describe('LessonPartsBar Component', () => {
  it('does not render if there is 1 or no videos', () => {
    const { container, rerender } = render(
      <LessonPartsBar videos={[{ id: 1, title: 'Único vídeo', video_url: 'https://b2.com/1.mp4' }]} />
    );
    expect(container.firstChild).toBeNull();

    rerender(<LessonPartsBar videos={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all video parts with badges, durations and handles part click', () => {
    const onSelectPart = vi.fn();
    const mockVideos = [
      { id: 101, language_label: 'Parte 1', title: 'Conceito Inicial', duration: '12:30', video_url: 'https://b2.com/1.mp4' },
      { id: 102, language_label: 'Parte 2', title: 'Prática Guiada', duration: '25:10', video_url: 'https://b2.com/2.mp4' },
      { id: 103, language_label: 'Parte 3', title: 'Conclusão', duration: '08:45', video_url: 'https://b2.com/3.mp4' }
    ];

    render(
      <LessonPartsBar
        videos={mockVideos}
        activeIndex={1}
        onSelectPart={onSelectPart}
        isLightBg={false}
      />
    );

    // Deve exibir o cabeçalho com o total de vídeos
    expect(screen.getByTestId('lesson-parts-bar')).toBeInTheDocument();
    expect(screen.getByText('Partes da Aula')).toBeInTheDocument();
    expect(screen.getByText('(3 vídeos)')).toBeInTheDocument();

    // Deve renderizar as 3 partes
    const part1Btn = screen.getByTestId('lesson-part-btn-0');
    const part2Btn = screen.getByTestId('lesson-part-btn-1');
    const part3Btn = screen.getByTestId('lesson-part-btn-2');

    expect(part1Btn).toHaveTextContent('Parte 1');
    expect(part1Btn).toHaveTextContent('12:30');
    expect(part2Btn).toHaveTextContent('Parte 2');
    expect(part2Btn).toHaveTextContent('25:10');
    expect(part3Btn).toHaveTextContent('Parte 3');
    expect(part3Btn).toHaveTextContent('08:45');

    // Clicar na Parte 3
    fireEvent.click(part3Btn);
    expect(onSelectPart).toHaveBeenCalledWith(2, mockVideos[2]);
  });
});
