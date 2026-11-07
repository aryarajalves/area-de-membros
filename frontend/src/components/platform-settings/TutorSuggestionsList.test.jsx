import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TutorSuggestionsList from './TutorSuggestionsList';
import { ToastProvider } from '../../context/ToastContext';

describe('TutorSuggestionsList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza título, filtros e lista de sugestões carregada da API', async () => {
    const mockSuggestions = [
      {
        id: 1,
        user_id: 10,
        student_name: 'Ana Silva',
        student_email: 'ana@example.com',
        course_title: 'Bússola Astrológica',
        lesson_title: 'Sol na Casa 7',
        suggestion_text: 'Poderiam disponibilizar um PDF com resumo dos trânsitos!',
        category: 'platform_improvement',
        status: 'new',
        created_at: '2026-11-06T15:00:00Z'
      }
    ];

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuggestions
    });

    render(
      <ToastProvider>
        <TutorSuggestionsList />
      </ToastProvider>
    );

    expect(screen.getByTestId('tutor-suggestions-list')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Ana Silva')).toBeInTheDocument();
      expect(
        screen.getByText('"Poderiam disponibilizar um PDF com resumo dos trânsitos!"')
      ).toBeInTheDocument();
      expect(screen.getByText('Bússola Astrológica')).toBeInTheDocument();
    });
  });

  it('permite filtrar por status ao clicar nos botões de filtro', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(
      <ToastProvider>
        <TutorSuggestionsList />
      </ToastProvider>
    );

    const btnAnalyzing = screen.getByTestId('filter-status-analyzing');
    fireEvent.click(btnAnalyzing);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status_filter=analyzing'),
        expect.anything()
      );
    });
  });
});
