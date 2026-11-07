import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TutorConversationsTab from './TutorConversationsTab';

describe('TutorConversationsTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-admin-token');
  });

  it('renders tab header, financial cards and list of conversations', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/courses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 1, title: 'Bússola Astrológica' }
          ])
        });
      }
      if (url.includes('/api/v1/tutor-ia/admin/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            financial_summary: {
              total_spent_brl: 2.50,
              total_spent_this_month_brl: 1.20,
              total_questions: 35,
              avg_cost_per_question: 0.0071,
              top_spenders: []
            },
            items: [
              {
                id: 10,
                student_id: 1,
                student_name: 'Arya Stark',
                student_email: 'arya@exemplo.com',
                course_title: 'Bússola Astrológica',
                lesson_title: 'Sol na Casa 7',
                role: 'user',
                content: 'Como interpretar o Sol na Casa 7?',
                cost_brl: 0.005,
                feedback_rating: 'like',
                created_at: new Date().toISOString()
              }
            ],
            pagination: { total_items: 1, total_pages: 1, current_page: 1, limit: 15 }
          })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<TutorConversationsTab />);

    expect(await screen.findByText('Histórico de Conversas com Alunos')).toBeInTheDocument();
    expect(await screen.findByText('Como interpretar o Sol na Casa 7?')).toBeInTheDocument();
    expect(screen.getByText('Arya Stark')).toBeInTheDocument();
    expect(screen.getByText('Bússola Astrológica • Aula: Sol na Casa 7')).toBeInTheDocument();
    expect(screen.getByText('Útil')).toBeInTheDocument();
  });

  it('allows searching and filtering conversations', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/courses')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          financial_summary: { total_spent_brl: 0, total_spent_this_month_brl: 0, total_questions: 0, avg_cost_per_question: 0, top_spenders: [] },
          items: [],
          pagination: { total_items: 0, total_pages: 1, current_page: 1 }
        })
      });
    });

    render(<TutorConversationsTab />);

    const searchInput = await screen.findByTestId('input-search-conversations');
    fireEvent.change(searchInput, { target: { value: 'Saturno' } });

    const submitBtn = screen.getByTestId('btn-submit-search');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Saturno'),
        expect.anything()
      );
    });
  });
});
