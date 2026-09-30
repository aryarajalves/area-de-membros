import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentAccessHistoryModal from './StudentAccessHistoryModal';
import { ToastProvider } from '../../context/ToastContext';

const mockStudent = {
  id: 1,
  name: 'Fernandes Aluno',
  email: 'fernandes@exemplo.com',
};

const mockCourse = {
  course_id: 101,
  course_title: 'Bússola Astrológica',
};

const mockHistory = [
  {
    lesson_id: 201,
    lesson_title: 'Aula 1 - Introdução aos Signos',
    module_title: 'Módulo 1 - Fundamentos',
    is_completed: true,
    completed_at: '2026-09-30T14:30:00Z',
    updated_at: '2026-09-30T14:30:00Z',
  },
  {
    lesson_id: 202,
    lesson_title: 'Aula 2 - Casas Astrológicas',
    module_title: 'Módulo 1 - Fundamentos',
    is_completed: true,
    completed_at: '2026-09-30T16:45:00Z',
    updated_at: '2026-09-30T16:45:00Z',
  },
];

describe('StudentAccessHistoryModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr.includes('/api/v1/students/1/courses/101/history')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockHistory,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });
  });

  it('renders modal with student name, course title and lesson history', async () => {
    const handleClose = vi.fn();
    render(
      <ToastProvider>
        <StudentAccessHistoryModal
          isOpen={true}
          onClose={handleClose}
          student={mockStudent}
          course={mockCourse}
          isLightBg={false}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Histórico de Acesso ao Curso')).toBeInTheDocument();
    expect(screen.getByText('Fernandes Aluno')).toBeInTheDocument();
    expect(screen.getByText('Bússola Astrológica')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Aula 1 - Introdução aos Signos')).toBeInTheDocument();
      expect(screen.getByText('Aula 2 - Casas Astrológicas')).toBeInTheDocument();
      expect(screen.getAllByText(/Assistiu a aula completa em/i).length).toBe(2);
    });

    // Clica no botão fechar
    const closeBtn = screen.getByTestId('close-history-modal-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders empty notice when student has no completed lessons', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(
      <ToastProvider>
        <StudentAccessHistoryModal
          isOpen={true}
          onClose={() => {}}
          student={mockStudent}
          course={mockCourse}
          isLightBg={false}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('empty-history-notice')).toBeInTheDocument();
      expect(screen.getByText(/O aluno ainda não possui aulas concluídas/i)).toBeInTheDocument();
    });
  });
});
