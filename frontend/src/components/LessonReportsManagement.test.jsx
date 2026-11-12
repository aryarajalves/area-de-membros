import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonReportsManagement from './LessonReportsManagement';
import { ToastProvider } from '../context/ToastContext';

describe('LessonReportsManagement Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
  });

  const mockReports = [
    {
      id: 1,
      lesson_id: 101,
      user_id: 1,
      issue_type: 'video',
      description: 'O vídeo trava no minuto 02:15',
      status: 'open',
      created_at: '2026-09-30T13:36:00Z',
      user_name: 'Carlos Aluno',
      user_email: 'carlos@teste.com',
      user_role: 'aluno',
      lesson_title: 'Aula 01: Introdução ao Tráfego',
      course_id: 1,
      course_title: 'Curso de Especialização'
    },
    {
      id: 2,
      lesson_id: 102,
      user_id: 2,
      issue_type: 'audio',
      description: 'Áudio baixo no início da aula',
      status: 'resolved',
      created_at: '2026-09-30T12:00:00Z',
      user_name: 'Mariana Admin',
      user_email: 'mariana@teste.com',
      user_role: 'admin',
      lesson_title: 'Aula 02: Criando Contas',
      course_id: 1,
      course_title: 'Curso de Especialização'
    }
  ];

  it('renders reports list, user role badges and Brasilia time', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReports
    });

    render(
      <ToastProvider>
        <LessonReportsManagement onUpdateSummary={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Relatos de Problemas nas Aulas')).toBeInTheDocument();
      expect(screen.getByTestId('stat-total-reports')).toHaveTextContent('2');
      expect(screen.getByTestId('stat-pending-reports')).toHaveTextContent('1');
      expect(screen.getByTestId('stat-resolved-reports')).toHaveTextContent('1');
      expect(screen.getByText('O vídeo trava no minuto 02:15')).toBeInTheDocument();
      expect(screen.getByText('Carlos Aluno')).toBeInTheDocument();
      expect(screen.getByTestId('user-role-badge-1')).toHaveTextContent('Aluno');
      expect(screen.getByTestId('user-role-badge-2')).toHaveTextContent('Admin');
      // Converte 13:36 UTC para 10:36 no Horário de Brasília
      expect(screen.getByText(/10:36/)).toBeInTheDocument();
    });
  });

  it('filters reports by search query and issue type', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReports
    });

    render(
      <ToastProvider>
        <LessonReportsManagement onUpdateSummary={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Carlos Aluno')).toBeInTheDocument();
    });

    // Filtra por busca textual
    const searchInput = screen.getByTestId('search-reports-input');
    fireEvent.change(searchInput, { target: { value: 'Mariana' } });

    expect(screen.queryByText('Carlos Aluno')).not.toBeInTheDocument();
    expect(screen.getByText('Mariana Admin')).toBeInTheDocument();

    // Limpa busca e filtra por tipo de problema
    fireEvent.change(searchInput, { target: { value: '' } });
    const typeSelect = screen.getByTestId('filter-issue-type');
    fireEvent.change(typeSelect, { target: { value: 'video' } });

    expect(screen.getByText('Carlos Aluno')).toBeInTheDocument();
    expect(screen.queryByText('Mariana Admin')).not.toBeInTheDocument();
  });

  it('opens confirmation modal before marking an open report as resolved', async () => {
    const onUpdateMock = vi.fn();
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (opts?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockReports[0], status: 'resolved' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockReports
      });
    });

    render(
      <ToastProvider>
        <LessonReportsManagement onUpdateSummary={onUpdateMock} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('toggle-status-btn-1')).toBeInTheDocument();
    });

    // Clica em Marcar como Resolvido
    fireEvent.click(screen.getByTestId('toggle-status-btn-1'));

    // Deve abrir o popup de confirmação
    expect(screen.getByTestId('action-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Marcar como Resolvido?')).toBeInTheDocument();

    // Clica em Cancelar no modal
    fireEvent.click(screen.getByTestId('cancel-action-confirm-btn'));
    expect(screen.queryByTestId('action-confirm-modal')).not.toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalledWith(
      '/api/v1/courses/reports/1',
      expect.anything()
    );

    // Clica novamente e agora confirma
    fireEvent.click(screen.getByTestId('toggle-status-btn-1'));
    fireEvent.click(screen.getByTestId('confirm-action-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/reports/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'resolved' })
        })
      );
      expect(onUpdateMock).toHaveBeenCalled();
    });
  });

  it('opens delete confirmation modal and deletes report', async () => {
    const onUpdateMock = vi.fn();
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (opts?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Relato excluído com sucesso.' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockReports
      });
    });

    render(
      <ToastProvider>
        <LessonReportsManagement onUpdateSummary={onUpdateMock} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('delete-report-btn-1')).toBeInTheDocument();
    });

    // Clica no botão de excluir relato
    fireEvent.click(screen.getByTestId('delete-report-btn-1'));

    // Modal de confirmação
    expect(screen.getByTestId('file-delete-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Excluir Relato?')).toBeInTheDocument();

    // Confirma exclusão
    fireEvent.click(screen.getByTestId('confirm-file-delete-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/reports/1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(onUpdateMock).toHaveBeenCalled();
    });
  });

  it('applies chosen member area background color and dark theme class', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReports
    });

    render(
      <ToastProvider>
        <LessonReportsManagement onUpdateSummary={vi.fn()} bgColor="#121620" />
      </ToastProvider>
    );

    const container = screen.getByTestId('lesson-reports-management');
    expect(container).toHaveStyle({ backgroundColor: '#121620' });
    expect(container).toHaveClass('classroom-dark-theme');
  });

  it('renders reports list in read-only mode for aluno without resolve or delete buttons', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReports
    });

    const alunoUser = { id: 2, name: 'Aluno Teste', role: 'aluno' };

    render(
      <ToastProvider>
        <LessonReportsManagement
          onUpdateSummary={vi.fn()}
          currentUser={alunoUser}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Carlos Aluno')).toBeInTheDocument();
      expect(screen.getByText('Mariana Admin')).toBeInTheDocument();
    });

    // Aluno NÃO deve ver botões de resolver ou excluir relatos
    expect(screen.queryByTestId('toggle-status-btn-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-report-btn-1')).not.toBeInTheDocument();
  });

  it('allows opening direct message (DM) with report creator', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReports
    });

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <ToastProvider>
        <LessonReportsManagement onUpdateSummary={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('dm-contact-btn-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('dm-contact-btn-1'));

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'open_direct_message',
        detail: {
          contact: {
            id: 1,
            name: 'Carlos Aluno',
            email: 'carlos@teste.com',
            role: 'aluno'
          }
        }
      })
    );
  });

  it('allows accessing lesson directly from report card', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockReports
    });

    const onNavigateTabMock = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <ToastProvider>
        <LessonReportsManagement onUpdateSummary={vi.fn()} onNavigateTab={onNavigateTabMock} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('access-lesson-btn-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('access-lesson-btn-1'));

    expect(onNavigateTabMock).toHaveBeenCalledWith('courses');
    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalled();
    });
  });

  it('paginates reports showing 20 per page and navigates correctly', async () => {
    const twentyFiveReports = Array.from({ length: 25 }, (_, idx) => ({
      id: idx + 1,
      lesson_id: 100 + idx,
      user_id: idx + 1,
      issue_type: 'video',
      description: `Problema reportado número ${idx + 1}`,
      status: 'open',
      created_at: '2026-09-30T13:00:00Z',
      user_name: `Aluno ${idx + 1}`,
      user_email: `aluno${idx + 1}@teste.com`,
      user_role: 'aluno',
      lesson_title: `Aula ${idx + 1}`,
      course_id: 1,
      course_title: 'Curso Geral'
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => twentyFiveReports
    });

    render(
      <ToastProvider>
        <LessonReportsManagement onUpdateSummary={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Problema reportado número 1')).toBeInTheDocument();
      expect(screen.getByText('Problema reportado número 20')).toBeInTheDocument();
      // Página 1 só mostra os 20 primeiros
      expect(screen.queryByText('Problema reportado número 21')).not.toBeInTheDocument();
      expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Exibindo 1–20 de 25 relatos');
    });

    // Clica na Próxima Página
    fireEvent.click(screen.getByTestId('pagination-next-btn'));

    await waitFor(() => {
      expect(screen.queryByText('Problema reportado número 1')).not.toBeInTheDocument();
      expect(screen.getByText('Problema reportado número 21')).toBeInTheDocument();
      expect(screen.getByText('Problema reportado número 25')).toBeInTheDocument();
      expect(screen.getByTestId('pagination-summary')).toHaveTextContent('Exibindo 21–25 de 25 relatos');
    });
  });
});

