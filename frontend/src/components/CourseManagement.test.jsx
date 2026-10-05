import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseManagement from './CourseManagement';
import { ToastProvider } from '../context/ToastContext';

describe('CourseManagement Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
  });

  const mockCourses = [
    {
      id: 1,
      title: 'Tráfego Pago para Afiliados',
      description: 'Aprenda do zero ao avançado no Meta Ads e Google Ads.',
      thumbnail_url: 'https://images.unsplash.com/photo-course.jpg',
      created_at: '2026-09-29T10:00:00Z',
      updated_at: '2026-09-29T10:00:00Z'
    },
    {
      id: 2,
      title: 'Copywriting e Funis de Alta Conversão',
      description: 'Estruturação de ofertas irresistíveis.',
      thumbnail_url: null,
      created_at: '2026-09-28T15:00:00Z',
      updated_at: '2026-09-28T15:00:00Z'
    }
  ];

  it('renders courses list and shows create course button for manager (superadmin)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCourses,
    });

    render(
      <ToastProvider>
        <CourseManagement currentUser={{ role: 'superadmin' }} />
      </ToastProvider>
    );

    expect(screen.getByText('Cursos da Plataforma')).toBeInTheDocument();
    expect(screen.getByTestId('create-course-btn')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Tráfego Pago para Afiliados')).toBeInTheDocument();
      expect(screen.getByText('Copywriting e Funis de Alta Conversão')).toBeInTheDocument();
      expect(screen.getByTestId('access-course-btn-1')).toBeInTheDocument();
    });
  });

  it('does NOT render create course button for aluno role, but renders access course button', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [mockCourses[0]],
    });

    render(
      <ToastProvider>
        <CourseManagement currentUser={{ role: 'aluno' }} />
      </ToastProvider>
    );

    expect(screen.getByText('Cursos da Plataforma')).toBeInTheDocument();
    expect(screen.queryByTestId('create-course-btn')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Tráfego Pago para Afiliados')).toBeInTheDocument();
      expect(screen.getByTestId('access-course-btn-1')).toBeInTheDocument();
    });
  });

  it('paginates courses to show 20 per page and allows navigation', async () => {
    // Cria lista simulada de 25 cursos
    const manyCourses = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      title: `Curso Número ${i + 1}`,
      description: `Descrição do curso ${i + 1}`,
      thumbnail_url: null,
      created_at: '2026-09-29T10:00:00Z',
      updated_at: '2026-09-29T10:00:00Z'
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => manyCourses,
    });

    render(
      <ToastProvider>
        <CourseManagement currentUser={{ role: 'superadmin' }} />
      </ToastProvider>
    );

    await waitFor(() => {
      // Deve exibir curso 1 até 20
      expect(screen.getByText('Curso Número 1')).toBeInTheDocument();
      expect(screen.getByText('Curso Número 20')).toBeInTheDocument();
      expect(screen.queryByText('Curso Número 21')).not.toBeInTheDocument();
      expect(screen.getByTestId('courses-pagination')).toBeInTheDocument();
      expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    });

    // Clica em Próxima página
    fireEvent.click(screen.getByTestId('next-page-btn'));

    await waitFor(() => {
      expect(screen.getByText('Curso Número 21')).toBeInTheDocument();
      expect(screen.getByText('Curso Número 25')).toBeInTheDocument();
      expect(screen.queryByText('Curso Número 1')).not.toBeInTheDocument();
      expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    });
  });

  it('navigates to course classroom when clicking "Acessar Curso"', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/v1/courses/1') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockCourses[0],
            modules: [
              {
                id: 101,
                course_id: 1,
                title: 'Módulo 1: Primeiros Passos',
                lessons: [
                  {
                    id: 1001,
                    module_id: 101,
                    title: 'Aula de Boas-Vindas',
                    video_type: 'url',
                    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                    duration: '10 min'
                  }
                ]
              }
            ]
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockCourses,
      });
    });

    render(
      <ToastProvider>
        <CourseManagement currentUser={{ role: 'superadmin' }} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('access-course-btn-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('access-course-btn-1'));

    await waitFor(() => {
      expect(screen.getByTestId('course-classroom-container')).toBeInTheDocument();
      expect(screen.getByTestId('back-to-courses-btn')).toBeInTheDocument();
      expect(screen.getAllByText('Módulo 1: Primeiros Passos').length).toBeGreaterThanOrEqual(1);
    });

    // Clica no módulo para exibir as aulas na parte de baixo
    fireEvent.click(screen.getByTestId('netflix-module-card-101'));

    await waitFor(() => {
      expect(screen.getAllByText('Aula de Boas-Vindas').length).toBeGreaterThanOrEqual(1);
    });

    // Clica em Voltar aos Cursos
    fireEvent.click(screen.getByTestId('back-to-courses-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('courses-page')).toBeInTheDocument();
    });
  });

  it('opens delete confirmation modal when clicking delete button', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCourses,
    });

    render(
      <ToastProvider>
        <CourseManagement currentUser={{ role: 'superadmin' }} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('delete-course-btn-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-course-btn-1'));

    expect(screen.getByTestId('delete-course-modal')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja excluir o curso/)).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-course-btn')).toBeInTheDocument();
  });

  it('applies member area background color to courses page and notifies onThemeColorChange', async () => {
    const onThemeColorChange = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ ...mockCourses[0], bg_color: '#121620' }],
    });

    render(
      <ToastProvider>
        <CourseManagement
          currentUser={{ role: 'superadmin' }}
          bgColor="#090d16"
          onThemeColorChange={onThemeColorChange}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      const page = screen.getByTestId('courses-page');
      expect(page).toHaveStyle({ backgroundColor: '#121620' });
      expect(onThemeColorChange).toHaveBeenCalledWith('#121620');
    });
  });

  it('renders "Ver Mais Informações" and redirects to sales_page_url for unpurchased course', async () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
    const coursesWithAccessFlag = [
      {
        id: 1,
        title: 'Curso Comprado',
        description: 'Tenho acesso',
        thumbnail_url: null,
        has_access: true
      },
      {
        id: 2,
        title: 'Curso Vitrine Não Comprado',
        description: 'Não tenho acesso',
        thumbnail_url: null,
        sales_page_url: 'https://vendas.com/curso-vitrine',
        has_access: false
      }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => coursesWithAccessFlag,
    });

    render(
      <ToastProvider>
        <CourseManagement currentUser={{ role: 'aluno' }} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Curso Comprado')).toBeInTheDocument();
      expect(screen.getByTestId('access-course-btn-1')).toBeInTheDocument();

      expect(screen.getByText('Curso Vitrine Não Comprado')).toBeInTheDocument();
      expect(screen.getByTestId('course-unpurchased-badge-2')).toBeInTheDocument();
      expect(screen.getByTestId('more-info-course-btn-2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('more-info-course-btn-2'));
    expect(windowOpenSpy).toHaveBeenCalledWith('https://vendas.com/curso-vitrine', '_blank', 'noopener,noreferrer');
  });
});

