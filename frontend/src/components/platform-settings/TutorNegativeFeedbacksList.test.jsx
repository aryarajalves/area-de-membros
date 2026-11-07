import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import TutorNegativeFeedbacksList from './TutorNegativeFeedbacksList';

describe('TutorNegativeFeedbacksList Component', () => {
  it('renders positive empty state when there are no negative feedbacks', () => {
    render(<TutorNegativeFeedbacksList feedbacks={[]} />);
    expect(screen.getByTestId('empty-negative-feedbacks')).toBeInTheDocument();
    expect(screen.getByText(/Nenhuma avaliação negativa registrada! Seus alunos estão satisfeitos/i)).toBeInTheDocument();
  });

  it('renders list of student negative feedbacks with reason and answer preview', () => {
    const mockFeedbacks = [
      {
        message_id: 10,
        student_name: 'Carlos Aluno',
        course_title: 'Curso Geral',
        lesson_title: 'Aula Introdutória',
        answer_preview: 'O conceito de casas astrológicas...',
        feedback_text: 'O minutagem citada estava adiantada em 30 segundos.',
        feedback_at: '2026-11-06T11:00:00Z'
      }
    ];

    render(<TutorNegativeFeedbacksList feedbacks={mockFeedbacks} />);
    expect(screen.getByTestId('recent-negative-feedbacks-list')).toBeInTheDocument();
    expect(screen.getByText('Carlos Aluno')).toBeInTheDocument();
    expect(screen.getByText(/O minutagem citada estava adiantada em 30 segundos/i)).toBeInTheDocument();
    expect(screen.getByText(/O conceito de casas astrológicas/i)).toBeInTheDocument();
  });
});
