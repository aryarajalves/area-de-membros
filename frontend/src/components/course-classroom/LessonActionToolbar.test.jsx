import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonActionToolbar from './LessonActionToolbar';
import { ToastProvider } from '../../context/ToastContext';

describe('LessonActionToolbar Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
  });

  const defaultProps = {
    courseId: 1,
    lessonId: 101,
    isCompleted: false,
    onToggleComplete: vi.fn(),
    currentUser: { id: 1, role: 'aluno', name: 'Aluno Teste' }
  };

  it('renders correctly with initial uncompleted state and ratings', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/rating')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user_rating: 0,
            average_rating: 4.8,
            total_ratings: 12
          })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <LessonActionToolbar {...defaultProps} />
      </ToastProvider>
    );

    expect(screen.getByText('Marcar como Assistida')).toBeInTheDocument();
    expect(screen.getByText('Relatar Problema')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/4\.8/)).toBeInTheDocument();
      expect(screen.getByText(/12 avaliações/)).toBeInTheDocument();
    });
  });

  it('toggles complete status and invokes onToggleComplete callback', async () => {
    const onToggleMock = vi.fn();
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/progress') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            lesson_id: 101,
            is_completed: true,
            completed_at: '2026-09-30T10:00:00Z'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ user_rating: 0, average_rating: 0, total_ratings: 0 })
      });
    });

    render(
      <ToastProvider>
        <LessonActionToolbar {...defaultProps} onToggleComplete={onToggleMock} />
      </ToastProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-lesson-complete-btn');
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/lessons/101/progress',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ is_completed: true })
        })
      );
      expect(onToggleMock).toHaveBeenCalledWith(101, true);
    });
  });

  it('renders completed state when isCompleted is true and can unmark', async () => {
    const onToggleMock = vi.fn();
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/progress') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            lesson_id: 101,
            is_completed: false,
            completed_at: null
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ user_rating: 0, average_rating: 0, total_ratings: 0 })
      });
    });

    render(
      <ToastProvider>
        <LessonActionToolbar {...defaultProps} isCompleted={true} onToggleComplete={onToggleMock} />
      </ToastProvider>
    );

    expect(screen.getByText('Aula Concluída')).toBeInTheDocument();

    const toggleBtn = screen.getByTestId('toggle-lesson-complete-btn');
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/lessons/101/progress',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ is_completed: false })
        })
      );
      expect(onToggleMock).toHaveBeenCalledWith(101, false);
    });
  });

  it('submits rating when student clicks on a star', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/rating') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            user_rating: 5,
            average_rating: 5.0,
            total_ratings: 1
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ user_rating: 0, average_rating: 0, total_ratings: 0 })
      });
    });

    render(
      <ToastProvider>
        <LessonActionToolbar {...defaultProps} />
      </ToastProvider>
    );

    const star5 = screen.getByTestId('star-btn-5');
    fireEvent.click(star5);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/lessons/101/rating',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ rating: 5 })
        })
      );
    });
  });

  it('opens report modal, fills issue type and description, and submits report', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/reports') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 1,
            lesson_id: 101,
            issue_type: 'audio',
            description: 'Áudio está cortando no minuto 3',
            status: 'pending'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ user_rating: 0, average_rating: 0, total_ratings: 0 })
      });
    });

    render(
      <ToastProvider>
        <LessonActionToolbar {...defaultProps} />
      </ToastProvider>
    );

    // Abre o modal
    const openReportBtn = screen.getByTestId('open-report-issue-btn');
    fireEvent.click(openReportBtn);

    // Modal deve estar visível
    expect(screen.getByText('Relatar Problema na Aula')).toBeInTheDocument();

    // Seleciona tipo de problema
    const selectIssue = screen.getByTestId('report-issue-type-select');
    fireEvent.change(selectIssue, { target: { value: 'audio' } });

    // Preenche descrição
    const textarea = screen.getByTestId('report-description-input');
    fireEvent.change(textarea, { target: { value: 'Áudio está cortando no minuto 3' } });

    // Envia o relato
    const submitBtn = screen.getByTestId('submit-report-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/lessons/101/reports',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            issue_type: 'audio',
            description: 'Áudio está cortando no minuto 3'
          })
        })
      );
      // Modal fecha após envio
      expect(screen.queryByText('Relatar Problema na Aula')).not.toBeInTheDocument();
    });
  });
});
