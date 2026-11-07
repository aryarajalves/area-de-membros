import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentAiTutorMessagesTab from './StudentAiTutorMessagesTab';

describe('StudentAiTutorMessagesTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-admin-token');
  });

  it('renders student financial summary and list of messages', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/tutor-ia/admin/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            financial_summary: {
              total_spent_brl: 0.125,
              total_spent_this_month_brl: 0.05,
              total_questions: 12
            },
            items: [
              {
                id: 101,
                role: 'user',
                content: 'Qual a diferença entre orbe e aspecto maior?',
                course_title: 'Curso de Trânsitos',
                lesson_title: 'Aspectos Planetários',
                cost_brl: 0.004,
                created_at: new Date().toISOString()
              }
            ],
            pagination: { total_items: 1, total_pages: 1, current_page: 1 }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<StudentAiTutorMessagesTab studentId={5} />);

    expect(await screen.findByText(/0,1250/)).toBeInTheDocument();
    expect(screen.getByText(/0,0500/)).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Qual a diferença entre orbe e aspecto maior?')).toBeInTheDocument();
    expect(screen.getByText('📚 Curso de Trânsitos • Aula: Aspectos Planetários')).toBeInTheDocument();
  });

  it('renders empty state when student has no messages', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        financial_summary: { total_spent_brl: 0, total_spent_this_month_brl: 0, total_questions: 0 },
        items: [],
        pagination: { total_items: 0, total_pages: 1, current_page: 1 }
      })
    });

    render(<StudentAiTutorMessagesTab studentId={99} />);

    expect(await screen.findByTestId('student-messages-empty')).toBeInTheDocument();
    expect(screen.getByText('Este aluno ainda não enviou dúvidas para o Tutor IA.')).toBeInTheDocument();
  });
});
