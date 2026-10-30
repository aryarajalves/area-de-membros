import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TimelineLessonItem from './TimelineLessonItem';

describe('TimelineLessonItem', () => {
  const mockLesson = {
    id: 101,
    title: 'Aula de Teste Drip',
    video_url: 'https://cdn.exemplo.com/video.mp4',
    duration: 10,
    attachments: [{ id: 1 }],
    quizzes: []
  };

  it('renderiza o título da aula numerado com índice', () => {
    render(
      <TimelineLessonItem
        lesson={mockLesson}
        idx={0}
        isActive={false}
        isCompleted={false}
        isManager={false}
        textColor="#ffffff"
        subTextColor="#94a3b8"
        onSelectLesson={vi.fn()}
      />
    );

    expect(screen.getByText('1. Aula de Teste Drip')).toBeInTheDocument();
    expect(screen.getByText('10 min')).toBeInTheDocument();
  });

  it('dispara onSelectLesson ao clicar no card da aula', () => {
    const onSelectLesson = vi.fn();
    render(
      <TimelineLessonItem
        lesson={mockLesson}
        idx={1}
        isActive={true}
        isCompleted={false}
        isManager={false}
        textColor="#ffffff"
        subTextColor="#94a3b8"
        onSelectLesson={onSelectLesson}
      />
    );

    fireEvent.click(screen.getByTestId('lesson-item-101'));
    expect(onSelectLesson).toHaveBeenCalledWith(mockLesson);
  });

  it('renderiza botões de gestão para gestor', () => {
    const onOpenEditLesson = vi.fn();
    const onPromptDeleteLesson = vi.fn();

    render(
      <TimelineLessonItem
        lesson={mockLesson}
        idx={0}
        isActive={false}
        isCompleted={false}
        isManager={true}
        textColor="#ffffff"
        subTextColor="#94a3b8"
        onSelectLesson={vi.fn()}
        onOpenEditLesson={onOpenEditLesson}
        onPromptDeleteLesson={onPromptDeleteLesson}
      />
    );

    fireEvent.click(screen.getByTestId('edit-lesson-btn-101'));
    expect(onOpenEditLesson).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('delete-lesson-btn-101'));
    expect(onPromptDeleteLesson).toHaveBeenCalled();
  });
});
