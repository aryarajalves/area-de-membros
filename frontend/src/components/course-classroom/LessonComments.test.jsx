import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonComments, { formatToBrasilia } from './LessonComments';
import { ToastProvider } from '../../context/ToastContext';

describe('LessonComments Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
  });

  const mockComments = [
    {
      id: 1,
      lesson_id: 101,
      user_id: 1,
      content: 'Excelente aula! Ficou muito claro como criar os públicos.',
      created_at: '2026-09-29T14:30:00Z',
      updated_at: '2026-09-29T14:30:00Z',
      user: {
        id: 1,
        name: 'Administrador Chefe',
        email: 'admin@teste.com',
        role: 'superadmin'
      }
    },
    {
      id: 2,
      lesson_id: 101,
      user_id: 5,
      content: 'Tive uma dúvida no minuto 05:20, alguém pode me ajudar?',
      created_at: '2026-09-29T15:00:00Z',
      updated_at: '2026-09-29T15:00:00Z',
      user: {
        id: 5,
        name: 'Aluno Estudioso',
        email: 'aluno@teste.com',
        role: 'aluno'
      }
    }
  ];

  it('renders comments list with authors, badges and formatted date', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockComments,
    });

    render(
      <ToastProvider>
        <LessonComments
          courseId={1}
          moduleId={10}
          lessonId={101}
          currentUser={{ id: 5, role: 'aluno' }}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Administrador Chefe')).toBeInTheDocument();
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('Excelente aula! Ficou muito claro como criar os públicos.')).toBeInTheDocument();

      expect(screen.getByText('Aluno Estudioso')).toBeInTheDocument();
      expect(screen.getByText('Aluno')).toBeInTheDocument();
      expect(screen.getByText('Tive uma dúvida no minuto 05:20, alguém pode me ajudar?')).toBeInTheDocument();
    });
  });

  it('allows an aluno to submit a new comment', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 3,
            lesson_id: 101,
            user_id: 5,
            content: 'Consegui resolver, obrigado!',
            created_at: '2026-09-29T15:10:00Z',
            updated_at: '2026-09-29T15:10:00Z',
            user: { id: 5, name: 'Aluno Estudioso', role: 'aluno' }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockComments,
      });
    });

    render(
      <ToastProvider>
        <LessonComments
          courseId={1}
          moduleId={10}
          lessonId={101}
          currentUser={{ id: 5, role: 'aluno' }}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('comment-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('comment-input'), { target: { value: 'Consegui resolver, obrigado!' } });
    fireEvent.click(screen.getByTestId('submit-comment-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/modules/10/lessons/101/comments',
        expect.objectContaining({ method: 'POST' })
      );
      expect(screen.getByText('Consegui resolver, obrigado!')).toBeInTheDocument();
    });
  });

  it('allows user to delete their own comment with confirmation modal', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Comentário excluído com sucesso.' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockComments,
      });
    });

    // Usuário ID 5 (Aluno) só pode ver botão de excluir no seu comentário (ID 2)
    render(
      <ToastProvider>
        <LessonComments
          courseId={1}
          moduleId={10}
          lessonId={101}
          currentUser={{ id: 5, role: 'aluno' }}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('delete-comment-btn-2')).toBeInTheDocument();
      expect(screen.queryByTestId('delete-comment-btn-1')).not.toBeInTheDocument();
    });

    // Clica para excluir comentário 2
    fireEvent.click(screen.getByTestId('delete-comment-btn-2'));

    // Modal de confirmação deve abrir
    expect(screen.getByText('Excluir Comentário?')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-btn')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-delete-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/modules/10/lessons/101/comments/2',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(screen.queryByText('Tive uma dúvida no minuto 05:20, alguém pode me ajudar?')).not.toBeInTheDocument();
    });
  });

  it('allows superadmin to delete any comment as moderator', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockComments,
    });

    // Usuário ID 99 com role superadmin
    render(
      <ToastProvider>
        <LessonComments
          courseId={1}
          moduleId={10}
          lessonId={101}
          currentUser={{ id: 99, role: 'superadmin' }}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      // Superadmin vê o botão de deletar em ambos os comentários
      expect(screen.getByTestId('delete-comment-btn-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-comment-btn-2')).toBeInTheDocument();
    });
  });

  it('formats dates correctly to Brasília timezone (UTC-3)', () => {
    // 2026-09-30 01:52:00 UTC -> 29/09/2026, 22:52 no fuso de Brasília (America/Sao_Paulo)
    const formattedWithZ = formatToBrasilia('2026-09-30T01:52:00Z');
    expect(formattedWithZ).toBe('29/09/2026, 22:52');

    // String ISO sem Z vinda do backend também é tratada como UTC
    const formattedNaive = formatToBrasilia('2026-09-30T01:52:00');
    expect(formattedNaive).toBe('29/09/2026, 22:52');

    // Retorna vazio para entradas nulas ou vazias
    expect(formatToBrasilia('')).toBe('');
    expect(formatToBrasilia(null)).toBe('');
  });

  it('paginates comments to show only the first 20 initially and navigates between pages', async () => {
    // Gerar 25 comentários mock
    const manyComments = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      lesson_id: 101,
      user_id: i + 1,
      content: `Comentário número ${i + 1}`,
      created_at: '2026-09-29T14:30:00Z',
      updated_at: '2026-09-29T14:30:00Z',
      user: {
        id: i + 1,
        name: `Aluno ${i + 1}`,
        email: `aluno${i + 1}@teste.com`,
        role: 'aluno'
      }
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => manyComments,
    });

    render(
      <ToastProvider>
        <LessonComments
          courseId={1}
          moduleId={10}
          lessonId={101}
          currentUser={{ id: 1, role: 'superadmin' }}
        />
      </ToastProvider>
    );

    // Página 1 deve conter apenas os 20 primeiros comentários
    await waitFor(() => {
      expect(screen.getByText('Comentário número 1')).toBeInTheDocument();
      expect(screen.getByText('Comentário número 20')).toBeInTheDocument();
      expect(screen.queryByText('Comentário número 21')).not.toBeInTheDocument();
      expect(screen.getByText('Exibindo 1–20 de 25 comentários')).toBeInTheDocument();
      expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    });

    const prevBtn = screen.getByTestId('prev-comments-page-btn');
    const nextBtn = screen.getByTestId('next-comments-page-btn');

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Avançar para a próxima página
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.queryByText('Comentário número 1')).not.toBeInTheDocument();
      expect(screen.getByText('Comentário número 21')).toBeInTheDocument();
      expect(screen.getByText('Comentário número 25')).toBeInTheDocument();
      expect(screen.getByText('Exibindo 21–25 de 25 comentários')).toBeInTheDocument();
      expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
    });

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).toBeDisabled();

    // Voltar para a página anterior
    fireEvent.click(prevBtn);

    await waitFor(() => {
      expect(screen.getByText('Comentário número 1')).toBeInTheDocument();
      expect(screen.queryByText('Comentário número 21')).not.toBeInTheDocument();
      expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    });
  });

  it('allows user to reply to an existing comment creating a thread', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        const body = JSON.parse(options.body);
        if (body.parent_id) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 99,
              lesson_id: 101,
              user_id: 1,
              parent_id: body.parent_id,
              content: body.content,
              created_at: '2026-09-30T10:30:00Z',
              user: { id: 1, name: 'Administrador Chefe', role: 'superadmin' }
            })
          });
        }
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockComments,
      });
    });

    render(
      <ToastProvider>
        <LessonComments
          courseId={1}
          moduleId={10}
          lessonId={101}
          currentUser={{ id: 1, role: 'superadmin' }}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('reply-btn-1')).toBeInTheDocument();
    });

    // Abrir formulário de resposta no comentário 1
    fireEvent.click(screen.getByTestId('reply-btn-1'));
    expect(screen.getByTestId('reply-form-1')).toBeInTheDocument();

    // Digitar a resposta
    fireEvent.change(screen.getByTestId('reply-input-1'), {
      target: { value: 'Com certeza! Vamos agendar uma mentoria.' }
    });

    // Enviar resposta
    fireEvent.click(screen.getByTestId('submit-reply-btn-1'));

    // Resposta adicionada e visível na thread
    await waitFor(() => {
      expect(screen.getByText('Com certeza! Vamos agendar uma mentoria.')).toBeInTheDocument();
      expect(screen.getByText('Ocultar respostas (1)')).toBeInTheDocument();
    });
  });
});

