import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TutorInsightsAnalyticsCard from './TutorInsightsAnalyticsCard';

describe('TutorInsightsAnalyticsCard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'admin-token');
  });

  it('renders loading state initially and then displays KPIs and lists', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          total_questions: 42,
          total_likes: 38,
          total_dislikes: 4,
          satisfaction_rate: 90.5,
          top_questioned_lessons: [
            {
              lesson_id: 10,
              lesson_title: 'O Sol em Trânsito',
              course_title: 'Bússola Astrológica',
              questions_count: 15,
              dislikes_count: 2
            }
          ],
          recent_negative_feedbacks: [
            {
              message_id: 99,
              student_name: 'Ana Aluna',
              course_title: 'Bússola Astrológica',
              lesson_title: 'O Sol em Trânsito',
              answer_preview: 'O trânsito solar...',
              feedback_text: 'A minutagem indicada não bateu com o vídeo.',
              feedback_at: '2026-11-06T10:00:00Z'
            }
          ]
        })
    });

    render(<TutorInsightsAnalyticsCard />);

    expect(screen.getByTestId('tutor-insights-analytics-card')).toBeInTheDocument();
    expect(await screen.findByText('Painel de Dúvidas & Feedback Pedagógico')).toBeInTheDocument();

    // Valida KPIs
    expect(await screen.findByText('42')).toBeInTheDocument();
    expect(screen.getByText('90.5%')).toBeInTheDocument();
    expect(screen.getByText('38')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    // Valida ranking de aulas
    expect(screen.getByText('O Sol em Trânsito')).toBeInTheDocument();
    expect(screen.getByText('15 dúvidas')).toBeInTheDocument();
    expect(screen.getByText('2 dislikes')).toBeInTheDocument();

    // Valida feedback negativo
    expect(screen.getByText(/Ana Aluna/i)).toBeInTheDocument();
    expect(screen.getByText(/A minutagem indicada não bateu com o vídeo/i)).toBeInTheDocument();
  });

  it('renders empty states when there are no questions or feedbacks', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          total_questions: 0,
          total_likes: 0,
          total_dislikes: 0,
          satisfaction_rate: 100.0,
          top_questioned_lessons: [],
          recent_negative_feedbacks: []
        })
    });

    render(<TutorInsightsAnalyticsCard />);

    expect(
      await screen.findByText(/Ainda não há dúvidas registradas pelos alunos nas aulas/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Nenhuma avaliação negativa registrada! Seus alunos estão satisfeitos/i)
    ).toBeInTheDocument();
  });

  it('refreshes insights when clicking refresh button', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          total_questions: 5,
          total_likes: 5,
          total_dislikes: 0,
          satisfaction_rate: 100.0,
          top_questioned_lessons: [],
          recent_negative_feedbacks: []
        })
    });

    render(<TutorInsightsAnalyticsCard />);
    await screen.findByText('Painel de Dúvidas & Feedback Pedagógico');

    const refreshBtn = screen.getByTestId('btn-refresh-tutor-insights');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
