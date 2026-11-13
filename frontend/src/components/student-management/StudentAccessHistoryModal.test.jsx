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

  it('paginates history list showing 20 per page with navigation controls', async () => {
    const manyHistoryItems = Array.from({ length: 25 }, (_, idx) => ({
      lesson_id: 300 + idx,
      lesson_title: `Aula Extra ${idx + 1}`,
      module_title: 'Módulo Geral',
      is_completed: true,
      completed_at: '2026-10-01T12:00:00Z',
    }));

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => manyHistoryItems,
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
      expect(screen.getByText('Aula Extra 1')).toBeInTheDocument();
      expect(screen.getByText('Aula Extra 20')).toBeInTheDocument();
      expect(screen.queryByText('Aula Extra 21')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('history-pagination-bar')).toBeInTheDocument();
    expect(screen.getByTestId('history-pagination-bar')).toHaveTextContent(/Exibindo 1–20 de 25 aulas concluídas/i);

    const nextBtn = screen.getByTestId('next-history-page-btn');
    fireEvent.click(nextBtn);

    expect(screen.getByText('Aula Extra 21')).toBeInTheDocument();
    expect(screen.getByText('Aula Extra 25')).toBeInTheDocument();
    expect(screen.queryByText('Aula Extra 1')).not.toBeInTheDocument();
    expect(screen.getByTestId('history-pagination-bar')).toHaveTextContent(/Exibindo 21–25 de 25 aulas concluídas/i);
  });

  it('exibe o número ordinal e nome do módulo formatados nas aulas do histórico', async () => {
    const mireilleHistory = [
      {
        lesson_id: 501,
        lesson_title: 'Marte: O Guerreiro Interior e a Energia da Ação',
        module_id: 12,
        module_order: 2,
        module_title: 'Os Personagens Da Aventura',
        is_completed: true,
        completed_at: '2026-11-12T12:25:00Z',
      },
      {
        lesson_id: 502,
        lesson_title: 'Desvendando a Linguagem Astrológica: Arquétipos e Sentidos',
        module_id: 11,
        module_order: 1,
        module_title: 'Introdução a Astrologia',
        is_completed: true,
        completed_at: '2026-11-09T23:40:00Z',
      },
    ];

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mireilleHistory,
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
      expect(screen.getByText('Marte: O Guerreiro Interior e a Energia da Ação')).toBeInTheDocument();
      expect(screen.getByText('Desvendando a Linguagem Astrológica: Arquétipos e Sentidos')).toBeInTheDocument();
    });

    // Valida que o número e nome do módulo são exibidos com clareza
    expect(screen.getByTestId('history-module-label-501')).toHaveTextContent('Módulo 02 - Os Personagens Da Aventura');
    expect(screen.getByTestId('history-module-label-502')).toHaveTextContent('Módulo 01 - Introdução a Astrologia');
  });
});
