import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentManagement from './StudentManagement';
import { ToastProvider } from '../../context/ToastContext';

const mockStudentsData = {
  items: [
    {
      id: 1,
      name: 'Fernandes Aluno',
      email: 'fernandes@exemplo.com',
      is_active: true,
      created_at: '2026-09-30T10:00:00Z',
      total_courses: 2,
      overall_progress_percent: 60,
      courses: [
        {
          course_id: 101,
          course_title: 'Bússola Astrológica',
          thumbnail_url: 'https://b2.com/thumb.jpg',
          access_duration: 'lifetime',
          expires_at: null,
          is_expired: false,
          total_lessons: 10,
          completed_lessons: 8,
          progress_percent: 80,
          last_lesson_title: 'Aula 8 - Trânsitos Planetários',
          last_activity_at: '2026-09-30T12:00:00Z',
        },
        {
          course_id: 102,
          course_title: 'Mapa Astral Avançado',
          thumbnail_url: null,
          access_duration: '1_year',
          expires_at: '2027-09-30T10:00:00Z',
          is_expired: false,
          total_lessons: 5,
          completed_lessons: 2,
          progress_percent: 40,
          last_lesson_title: 'Aula 2 - Casas Astrológicas',
          last_activity_at: '2026-09-29T15:00:00Z',
        },
      ],
    },
    {
      id: 2,
      name: 'Beatriz Silva',
      email: 'beatriz@exemplo.com',
      is_active: false,
      created_at: '2026-09-28T14:00:00Z',
      total_courses: 0,
      overall_progress_percent: 0,
      courses: [],
    },
  ],
  total: 2,
  page: 1,
  limit: 20,
  pages: 1,
};

describe('StudentManagement Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_admin_token');
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/v1/students')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockStudentsData,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it('renders student management header, metric cards and list of students', async () => {
    render(
      <ToastProvider>
        <StudentManagement />
      </ToastProvider>
    );

    expect(await screen.findByText('Alunos e Progresso')).toBeInTheDocument();
    expect(screen.getByText('Total de Alunos')).toBeInTheDocument();
    expect(screen.getByText('Alunos Ativos')).toBeInTheDocument();
    expect(screen.getByText('Progresso Médio')).toBeInTheDocument();

    // Dados do aluno Fernandes
    expect(await screen.findByText('Fernandes Aluno')).toBeInTheDocument();
    expect(screen.getByText('fernandes@exemplo.com')).toBeInTheDocument();
    expect(screen.getByText('Aluno Ativo')).toBeInTheDocument();
    expect(screen.getByTestId('student-created-at-1')).toBeInTheDocument();
    expect(screen.getAllByText(/Aluno desde:/i).length).toBe(2);
    expect(screen.getByText('60%')).toBeInTheDocument();

    // Cursos vinculados ao Fernandes
    expect(screen.getByText('Bússola Astrológica')).toBeInTheDocument();
    expect(screen.getByText('Aula 8 - Trânsitos Planetários')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();

    expect(screen.getByText('Mapa Astral Avançado')).toBeInTheDocument();
    expect(screen.getByText('Aula 2 - Casas Astrológicas')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();

    // Linha do tempo de expiração no curso não-vitalício
    expect(screen.getByTestId('expiration-timeline-102')).toBeInTheDocument();
    expect(screen.getByText(/Validade do Curso:/i)).toBeInTheDocument();

    // Botões de histórico de acesso
    expect(screen.getByTestId('view-course-history-btn-101')).toBeInTheDocument();
    expect(screen.getByTestId('view-course-history-btn-102')).toBeInTheDocument();

    // Dados da aluna Beatriz
    expect(screen.getByText('Beatriz Silva')).toBeInTheDocument();
    expect(screen.getByText('Inativo')).toBeInTheDocument();
    expect(screen.getByText('Nenhum curso liberado para este aluno ainda.')).toBeInTheDocument();
  });

  it('filters students by search term and can clear search', async () => {
    render(
      <ToastProvider>
        <StudentManagement />
      </ToastProvider>
    );

    expect(await screen.findByText('Fernandes Aluno')).toBeInTheDocument();

    const searchInput = screen.getByTestId('student-search-input');
    fireEvent.change(searchInput, { target: { value: 'Fernandes' } });
    expect(searchInput.value).toBe('Fernandes');

    fireEvent.click(screen.getByTestId('submit-student-search-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=Fernandes'),
        expect.any(Object)
      );
    });

    // Limpa a busca
    const clearBtn = screen.getByTestId('clear-student-search-btn');
    fireEvent.click(clearBtn);
    expect(searchInput.value).toBe('');
  });

  it('collapses and expands student courses list when clicking courses button', async () => {
    render(
      <ToastProvider>
        <StudentManagement />
      </ToastProvider>
    );

    expect(await screen.findByText('Fernandes Aluno')).toBeInTheDocument();
    expect(screen.getByText('Bússola Astrológica')).toBeInTheDocument();

    const toggleBtn = screen.getByTestId('toggle-courses-btn-1');
    fireEvent.click(toggleBtn);

    // Esconde a lista de cursos
    expect(screen.queryByText('Bússola Astrológica')).not.toBeInTheDocument();

    // Clica novamente para expandir
    fireEvent.click(toggleBtn);
    expect(screen.getByText('Bússola Astrológica')).toBeInTheDocument();
  });

  it('displays empty state when no students match the filter', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        pages: 1,
      }),
    });

    render(
      <ToastProvider>
        <StudentManagement />
      </ToastProvider>
    );

    expect(await screen.findByText('Nenhum aluno encontrado')).toBeInTheDocument();
  });

  it('changes limit per page using dropdown (20, 50, 100, 200) and triggers fetch', async () => {
    render(
      <ToastProvider>
        <StudentManagement />
      </ToastProvider>
    );

    expect(await screen.findByText('Fernandes Aluno')).toBeInTheDocument();

    const select = screen.getByTestId('students-per-page-select');
    expect(select.value).toBe('20');

    // Troca para 50 alunos por página
    fireEvent.change(select, { target: { value: '50' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=50'),
        expect.any(Object)
      );
    });
    expect(select.value).toBe('50');
  });

  it('opens export dropdown and triggers export CSV and XLSX download', async () => {
    // Mock URL.createObjectURL e click
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-export-url');
    window.URL.revokeObjectURL = vi.fn();

    render(
      <ToastProvider>
        <StudentManagement />
      </ToastProvider>
    );

    expect(await screen.findByText('Alunos e Progresso')).toBeInTheDocument();

    const exportDropdownBtn = screen.getByTestId('export-students-dropdown-btn');
    fireEvent.click(exportDropdownBtn);

    const exportCsvBtn = screen.getByTestId('export-csv-option');
    const exportXlsxBtn = screen.getByTestId('export-xlsx-option');
    expect(exportCsvBtn).toBeInTheDocument();
    expect(exportXlsxBtn).toBeInTheDocument();

    // Exportar CSV
    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(['dummy csv'], { type: 'text/csv' }),
    });

    fireEvent.click(exportCsvBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/students/export?format=csv'),
        expect.any(Object)
      );
    });

    // Reabrir dropdown e Exportar XLSX
    fireEvent.click(exportDropdownBtn);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      blob: async () => new Blob(['dummy xlsx'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    });

    fireEvent.click(screen.getByTestId('export-xlsx-option'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/students/export?format=xlsx'),
        expect.any(Object)
      );
    });
  });

  it('opens import modal, allows downloading templates and imports student spreadsheet', async () => {
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-template-url');
    window.URL.revokeObjectURL = vi.fn();

    // Mock cursos para o modal
    global.fetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/v1/courses')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 101, title: 'Curso Astrologia' }],
        });
      }
      if (typeof url === 'string' && url.includes('/api/v1/students/import/template')) {
        return Promise.resolve({
          ok: true,
          blob: async () => new Blob(['csv template'], { type: 'text/csv' }),
        });
      }
      if (typeof url === 'string' && url.includes('/api/v1/students/import')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            total_processed: 1,
            created_count: 1,
            updated_count: 0,
            errors_count: 0,
            errors: [],
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockStudentsData,
      });
    });

    render(
      <ToastProvider>
        <StudentManagement />
      </ToastProvider>
    );

    expect(await screen.findByText('Alunos e Progresso')).toBeInTheDocument();

    // Clica para abrir modal de importação
    fireEvent.click(screen.getByTestId('open-import-modal-btn'));
    expect(screen.getByTestId('student-import-modal-content')).toBeInTheDocument();

    // Testa download do modelo CSV
    fireEvent.click(screen.getByTestId('download-template-csv-btn'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/students/import/template?format=csv'),
        expect.any(Object)
      );
    });

    // Seleciona um arquivo CSV
    const fileInput = screen.getByTestId('student-file-input');
    const dummyFile = new File(['Nome;Email\nJoao;joao@teste.com'], 'alunos.csv', { type: 'text/csv' });
    fireEvent.change(fileInput, { target: { files: [dummyFile] } });

    expect(screen.getByText('alunos.csv')).toBeInTheDocument();

    // Seleciona tempo de acesso padrão
    const durationSelect = screen.getByTestId('default-duration-select');
    fireEvent.change(durationSelect, { target: { value: '1_year' } });

    // Clica em Iniciar Importação
    fireEvent.click(screen.getByTestId('submit-import-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('import-result-summary')).toBeInTheDocument();
      expect(screen.getByText('Resultado do Processamento:')).toBeInTheDocument();
    });

    // Fecha o modal
    fireEvent.click(screen.getByTestId('close-import-modal-btn'));
    expect(screen.queryByTestId('student-import-modal-content')).not.toBeInTheDocument();
  });

  it('opens student lesson access history modal and closes it', async () => {
    render(
      <ToastProvider>
        <StudentManagement />
      </ToastProvider>
    );

    const historyBtn = await screen.findByTestId('view-course-history-btn-101');
    fireEvent.click(historyBtn);

    expect(await screen.findByText('Histórico de Acesso ao Curso')).toBeInTheDocument();
    expect(screen.getByTestId('student-history-modal-content')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('close-history-modal-btn');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('student-history-modal-content')).not.toBeInTheDocument();
    });
  });
});


