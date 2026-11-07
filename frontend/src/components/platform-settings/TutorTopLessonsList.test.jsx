import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TutorTopLessonsList from './TutorTopLessonsList';

describe('TutorTopLessonsList Component', () => {
  it('renders empty message when no lessons are passed', () => {
    render(<TutorTopLessonsList topLessons={[]} />);
    expect(screen.getByTestId('empty-top-lessons')).toBeInTheDocument();
    expect(screen.getByText(/Ainda não há dúvidas registradas pelos alunos nas aulas/i)).toBeInTheDocument();
  });

  it('renders ranked lessons with question and dislike counts', () => {
    const mockLessons = [
      {
        lesson_id: 1,
        lesson_title: 'Aula de Trânsitos Planetários',
        course_title: 'Astrologia Avançada',
        questions_count: 25,
        dislikes_count: 3
      },
      {
        lesson_id: 2,
        lesson_title: 'Aspectos e Orbes',
        course_title: 'Astrologia Avançada',
        questions_count: 12,
        dislikes_count: 0
      }
    ];

    render(<TutorTopLessonsList topLessons={mockLessons} />);
    expect(screen.getByTestId('top-questioned-lessons-list')).toBeInTheDocument();
    expect(screen.getByText('Aula de Trânsitos Planetários')).toBeInTheDocument();
    expect(screen.getByText('25 dúvidas')).toBeInTheDocument();
    expect(screen.getByText('3 dislikes')).toBeInTheDocument();
    expect(screen.getByText('Aspectos e Orbes')).toBeInTheDocument();
    expect(screen.getByText('12 dúvidas')).toBeInTheDocument();
  });
});
