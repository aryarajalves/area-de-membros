import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../../context/ToastContext';
import StudentCard from './StudentCard';

const renderWithToast = (ui) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('StudentCard Component', () => {
  const mockStudent = {
    id: 42,
    name: 'Mariana Conquistas',
    email: 'mariana.conquistas@test.com',
    phone: '558588146141',
    is_active: true,
    created_at: '2026-10-01T21:37:00Z',
    overall_progress_percent: 14,
    total_courses: 1,
    total_points: 120,
    courses: [
      {
        course_id: 1,
        course_title: 'Bussola Astrologica',
        access_duration: 'lifetime',
        progress_percent: 14,
        completed_lessons: 1,
        total_lessons: 7,
        last_lesson_title: 'Aula 01'
      }
    ]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders student card with name, email, points badge and "Pontos & Conquistas" button', () => {
    renderWithToast(<StudentCard student={mockStudent} isLightBg={false} />);

    expect(screen.getByText('Mariana Conquistas')).toBeInTheDocument();
    expect(screen.getByText('mariana.conquistas@test.com')).toBeInTheDocument();
    expect(screen.getAllByText('14%').length).toBeGreaterThan(0);
    expect(screen.getByText('120 pts')).toBeInTheDocument();
    expect(screen.getByText('Pontos & Conquistas')).toBeInTheDocument();
  });

  it('opens StudentGamificationHistoryModal when clicking "Pontos & Conquistas" button', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        student_id: 42,
        student_name: 'Mariana Conquistas',
        total_points: 120,
        current_rank: 1,
        badge: '🥇 Mestre da Comunidade',
        history: []
      })
    });

    renderWithToast(<StudentCard student={mockStudent} isLightBg={false} />);

    const openBtn = screen.getByTestId('open-gamification-history-btn-42');
    fireEvent.click(openBtn);

    expect(screen.getByText('Histórico de Pontos e Conquistas')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('modal-total-points')).toHaveTextContent('120 pts');
    });
  });

  it('opens StudentGamificationHistoryModal when clicking the points badge', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        student_id: 42,
        student_name: 'Mariana Conquistas',
        total_points: 120,
        current_rank: 1,
        badge: '🥇 Mestre da Comunidade',
        history: []
      })
    });

    renderWithToast(<StudentCard student={mockStudent} isLightBg={false} />);

    const pointsBadgeBtn = screen.getByTestId('student-gamification-points-btn-42');
    fireEvent.click(pointsBadgeBtn);

    expect(screen.getByText('Histórico de Pontos e Conquistas')).toBeInTheDocument();
  });

  it('renders student tags and opens assign tags modal', () => {
    const studentWithTags = {
      ...mockStudent,
      tags: [{ id: 99, name: 'VIP Mentoria', color: '#f59e0b' }],
    };

    renderWithToast(<StudentCard student={studentWithTags} isLightBg={false} />);

    expect(screen.getByText('VIP Mentoria')).toBeInTheDocument();
    expect(screen.getByTestId('edit-student-tags-btn-42')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-student-tags-btn-42'));
    expect(screen.getByText('Etiquetas do Aluno')).toBeInTheDocument();
  });
});
