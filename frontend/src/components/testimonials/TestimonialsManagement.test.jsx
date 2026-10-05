import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../../context/ToastContext';
import TestimonialsManagement from './TestimonialsManagement';

describe('TestimonialsManagement Component', () => {
  const mockCourses = [
    { id: 1, title: 'Curso de React Avançado', has_access: true },
    { id: 2, title: 'Curso de Python Pro', has_access: true }
  ];

  const mockTestimonials = [
    {
      id: 10,
      user_id: 100,
      course_id: 1,
      rating: 5,
      title: 'Excelente treinamento!',
      content: 'Aprendi muito e recomendo para todos os iniciantes.',
      status: 'approved',
      is_featured: true,
      created_at: '2026-10-01T12:00:00Z',
      user: { id: 100, name: 'Lucas Aluno', avatar_url: null },
      course: { id: 1, title: 'Curso de React Avançado' },
      can_edit: false,
      can_delete: false,
      can_moderate: false
    }
  ];

  const mockStats = {
    total: 1,
    pending: 0,
    approved: 1,
    rejected: 0,
    average_rating: 5.0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test_token');

    global.fetch = vi.fn().mockImplementation((url, options = {}) => {
      const urlStr = String(url);
      const method = options.method || 'GET';

      if (urlStr.includes('/api/v1/courses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCourses)
        });
      }

      if (urlStr.includes('/api/v1/testimonials/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStats)
        });
      }

      if (urlStr.includes('/api/v1/testimonials') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTestimonials)
        });
      }

      if (urlStr.includes('/api/v1/testimonials') && (method === 'POST' || method === 'PATCH')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 99, success: true })
        });
      }

      if (urlStr.includes('/api/v1/testimonials') && method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null)
        });
      }

      return Promise.reject(new Error('Unknown url: ' + urlStr));
    });
  });

  it('renders header, stats metrics and testimonial cards correctly for aluno', async () => {
    const userAluno = { id: 200, name: 'Aluno Teste', role: 'aluno' };

    render(
      <ToastProvider>
        <TestimonialsManagement user={userAluno} />
      </ToastProvider>
    );

    // Header
    expect(screen.getByText('Depoimentos dos Cursos')).toBeInTheDocument();

    // Aguarda carregar depoimentos
    await waitFor(() => {
      expect(screen.getByText('"Excelente treinamento!"')).toBeInTheDocument();
    });

    expect(screen.getByText('Lucas Aluno')).toBeInTheDocument();
    expect(screen.getByText('📚 Curso de React Avançado')).toBeInTheDocument();
    expect(screen.getByTestId('metric-total')).toHaveTextContent('1');
    expect(screen.getByTestId('metric-approved')).toHaveTextContent('1');
    expect(screen.getByTestId('metric-avg-rating')).toHaveTextContent('⭐ 5.0 / 5.0');
    expect(screen.getByTestId('testimonial-featured-badge')).toBeInTheDocument();
  });

  it('opens testimonial modal and submits a new review', async () => {
    const userAluno = { id: 100, name: 'Lucas Aluno', role: 'aluno' };

    render(
      <ToastProvider>
        <TestimonialsManagement user={userAluno} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('open-create-testimonial-btn')).toBeInTheDocument();
    });

    // Clicar para abrir modal
    fireEvent.click(screen.getByTestId('open-create-testimonial-btn'));

    expect(screen.getByTestId('testimonial-form-modal')).toBeInTheDocument();

    // Preencher título e conteúdo
    fireEvent.change(screen.getByTestId('testimonial-title-input'), {
      target: { value: 'Incrível!' }
    });
    fireEvent.change(screen.getByTestId('testimonial-content-textarea'), {
      target: { value: 'Gostei muito da metodologia prática.' }
    });

    // Selecionar 4 estrelas
    fireEvent.click(screen.getByTestId('star-btn-4'));
    expect(screen.getByText('4 de 5 estrelas')).toBeInTheDocument();

    // Enviar formulário
    fireEvent.click(screen.getByTestId('submit-testimonial-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/testimonials',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            course_id: 2,
            rating: 4,
            title: 'Incrível!',
            content: 'Gostei muito da metodologia prática.'
          })
        })
      );
    });
  });


  it('allows manager to approve and toggle featured testimonial', async () => {
    const adminUser = { id: 1, name: 'Admin', role: 'admin' };

    // Mock com depoimento pendente para o admin moderar
    const pendingTestimonial = {
      ...mockTestimonials[0],
      id: 25,
      status: 'pending',
      is_featured: false
    };

    global.fetch = vi.fn().mockImplementation((url, options = {}) => {
      const urlStr = String(url);
      const method = options.method || 'GET';

      if (urlStr.includes('/api/v1/courses')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCourses) });
      }
      if (urlStr.includes('/api/v1/testimonials/stats')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStats) });
      }
      if (urlStr.includes('/api/v1/testimonials') && method === 'GET') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([pendingTestimonial]) });
      }
      if (urlStr.includes('/api/v1/testimonials/25') && method === 'PATCH') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 25, success: true }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <TestimonialsManagement user={adminUser} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('approve-btn-25')).toBeInTheDocument();
    });

    // Clicar em Aprovar
    fireEvent.click(screen.getByTestId('approve-btn-25'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/testimonials/25',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' })
        })
      );
    });

    // Clicar em Destacar
    fireEvent.click(screen.getByTestId('feature-btn-25'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/testimonials/25',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ is_featured: true })
        })
      );
    });
  });

  it('opens confirmation modal and deletes testimonial', async () => {
    const adminUser = { id: 1, name: 'Admin', role: 'admin' };

    render(
      <ToastProvider>
        <TestimonialsManagement user={adminUser} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('delete-testimonial-btn-10')).toBeInTheDocument();
    });

    // Clicar em Excluir
    fireEvent.click(screen.getByTestId('delete-testimonial-btn-10'));

    // Modal de confirmação
    expect(screen.getByTestId('testimonial-delete-modal')).toBeInTheDocument();
    expect(screen.getByText('Excluir Depoimento?')).toBeInTheDocument();

    // Confirmar exclusão
    fireEvent.click(screen.getByTestId('confirm-delete-testimonial-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/testimonials/10',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('displays all-courses-reviewed-alert when user has already submitted testimonials for all their courses', async () => {
    const userAluno = { id: 100, name: 'Lucas Aluno', role: 'aluno' };

    // Dois depoimentos, um para o curso 1 e outro para o curso 2 pelo mesmo usuário 100
    const allReviewed = [
      mockTestimonials[0],
      {
        ...mockTestimonials[0],
        id: 11,
        course_id: 2,
        title: 'Depoimento do curso 2'
      }
    ];

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/v1/courses')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCourses) });
      }
      if (urlStr.includes('/api/v1/testimonials/stats')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockStats) });
      }
      if (urlStr.includes('/api/v1/testimonials')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(allReviewed) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <TestimonialsManagement user={userAluno} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('open-create-testimonial-btn')).toBeInTheDocument();
    });

    // Clicar para abrir modal
    fireEvent.click(screen.getByTestId('open-create-testimonial-btn'));

    // Deve exibir o aviso informando que todos os cursos já foram avaliados
    expect(screen.getByTestId('all-courses-reviewed-alert')).toBeInTheDocument();
    expect(screen.getByText('Você já avaliou todos os seus cursos!')).toBeInTheDocument();
  });
});

