import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonNotes, { formatToBrasilia } from './LessonNotes';

const mockAddToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast
  })
}));

describe('LessonNotes Component & Badges', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'test_token');
  });

  describe('formatToBrasilia helper', () => {
    it('formats ISO strings to Brasília timezone', () => {
      // 2026-09-30 14:00 UTC -> 11:00 em Brasília (UTC-3)
      const res = formatToBrasilia('2026-09-30T14:00:00Z');
      expect(res).toContain('30/09/2026');
      expect(res).toContain('11:00');
    });

    it('returns empty string for null or empty input', () => {
      expect(formatToBrasilia(null)).toBe('');
      expect(formatToBrasilia('')).toBe('');
    });
  });

  it('renders loading state and displays existing notes as badges', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/notes')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 1,
              content: 'Primeira anotação da aula',
              created_at: '2026-09-30T14:00:00Z',
              updated_at: '2026-09-30T14:00:00Z'
            },
            {
              id: 2,
              content: 'Segunda anotação importante',
              created_at: '2026-09-30T15:30:00Z',
              updated_at: '2026-09-30T15:30:00Z'
            }
          ]
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<LessonNotes courseId={1} lessonId={10} currentUser={{ id: 5, role: 'aluno' }} />);

    expect(screen.getByText('Carregando suas anotações...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Primeira anotação da aula')).toBeInTheDocument();
      expect(screen.getByText('Segunda anotação importante')).toBeInTheDocument();
    });

    expect(screen.getByTestId('notes-count-badge')).toHaveTextContent('2 anotações');
    expect(screen.getByText(/100% Privado/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no notes', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(<LessonNotes courseId={1} lessonId={10} currentUser={{ id: 5, role: 'aluno' }} />);

    await waitFor(() => {
      expect(screen.getByTestId('notes-empty-state')).toBeInTheDocument();
    });
    expect(screen.getByText(/Nenhuma anotação salva ainda nesta aula/i)).toBeInTheDocument();
  });

  it('creates a new note badge and adds it to the list', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 99,
            content: 'Novo insight valioso',
            created_at: '2026-09-30T16:00:00Z',
            updated_at: '2026-09-30T16:00:00Z'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => []
      });
    });

    render(<LessonNotes courseId={1} lessonId={10} currentUser={{ id: 5, role: 'aluno' }} />);

    const textarea = await screen.findByTestId('lesson-note-textarea');
    fireEvent.change(textarea, { target: { value: 'Novo insight valioso' } });

    const saveBtn = screen.getByTestId('save-note-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('salva com sucesso'), 'success');
      expect(screen.getByText('Novo insight valioso')).toBeInTheDocument();
    });

    expect(textarea.value).toBe('');
    expect(screen.getByTestId('notes-count-badge')).toHaveTextContent('1 anotação');
  });

  it('creates note using Ctrl+Enter shortcut', async () => {
    let postCalled = false;
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        postCalled = true;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 100,
            content: 'Nota via atalho',
            created_at: '2026-09-30T16:05:00Z',
            updated_at: '2026-09-30T16:05:00Z'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => []
      });
    });

    render(<LessonNotes courseId={1} lessonId={10} currentUser={{ id: 5, role: 'aluno' }} />);

    const textarea = await screen.findByTestId('lesson-note-textarea');
    fireEvent.change(textarea, { target: { value: 'Nota via atalho' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(postCalled).toBe(true);
      expect(screen.getByText('Nota via atalho')).toBeInTheDocument();
    });
  });

  it('allows inline editing of an existing note badge', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 1,
            content: 'Nota editada com sucesso',
            created_at: '2026-09-30T14:00:00Z',
            updated_at: '2026-09-30T16:10:00Z'
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [
          {
            id: 1,
            content: 'Nota antes da edição',
            created_at: '2026-09-30T14:00:00Z',
            updated_at: '2026-09-30T14:00:00Z'
          }
        ]
      });
    });

    render(<LessonNotes courseId={1} lessonId={10} currentUser={{ id: 5, role: 'aluno' }} />);

    await waitFor(() => {
      expect(screen.getByText('Nota antes da edição')).toBeInTheDocument();
    });

    // Clica em Editar
    const editBtn = screen.getByTestId('edit-note-btn-1');
    fireEvent.click(editBtn);

    // O textarea de edição deve aparecer
    const editTextarea = screen.getByTestId('edit-note-textarea-1');
    expect(editTextarea.value).toBe('Nota antes da edição');

    // Testa cancelamento
    const cancelBtn = screen.getByTestId('cancel-edit-btn-1');
    fireEvent.click(cancelBtn);
    expect(screen.queryByTestId('edit-note-textarea-1')).not.toBeInTheDocument();

    // Reabre e salva
    fireEvent.click(screen.getByTestId('edit-note-btn-1'));
    const reEditTextarea = screen.getByTestId('edit-note-textarea-1');
    fireEvent.change(reEditTextarea, { target: { value: 'Nota editada com sucesso' } });

    const saveEditBtn = screen.getByTestId('save-edit-btn-1');
    fireEvent.click(saveEditBtn);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('atualizada com sucesso'), 'success');
      expect(screen.getByText('Nota editada com sucesso')).toBeInTheDocument();
    });
  });

  it('opens confirmation modal and deletes a note badge', async () => {
    let deleteCalled = false;
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'DELETE') {
        deleteCalled = true;
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Anotação excluída com sucesso' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [
          {
            id: 5,
            content: 'Nota a ser excluída',
            created_at: '2026-09-30T14:00:00Z',
            updated_at: '2026-09-30T14:00:00Z'
          }
        ]
      });
    });

    render(<LessonNotes courseId={1} lessonId={10} currentUser={{ id: 5, role: 'aluno' }} />);

    await waitFor(() => {
      expect(screen.getByText('Nota a ser excluída')).toBeInTheDocument();
    });

    // Clica no botão de excluir
    const deleteBtn = screen.getByTestId('delete-note-btn-5');
    fireEvent.click(deleteBtn);

    // O modal deve estar aberto (RULE[experiencia-usuario.md])
    const modal = screen.getByTestId('file-delete-confirm-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText('Excluir Anotação?')).toBeInTheDocument();

    // Testa cancelamento primeiro
    const cancelModalBtn = screen.getByTestId('cancel-file-delete-btn');
    fireEvent.click(cancelModalBtn);
    expect(screen.queryByTestId('file-delete-confirm-modal')).not.toBeInTheDocument();
    expect(screen.getByText('Nota a ser excluída')).toBeInTheDocument();

    // Abre novamente e confirma exclusão
    fireEvent.click(screen.getByTestId('delete-note-btn-5'));
    const confirmModalBtn = screen.getByTestId('confirm-file-delete-btn');
    fireEvent.click(confirmModalBtn);

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
      expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('excluída com sucesso'), 'success');
      expect(screen.queryByText('Nota a ser excluída')).not.toBeInTheDocument();
    });
  });

  it('paginates notes to show only 20 per page and allows navigation', async () => {
    // Cria 25 anotações simuladas
    const mockNotes = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      content: `Anotação de Teste Número ${i + 1}`,
      created_at: '2026-09-30T14:00:00Z',
      updated_at: '2026-09-30T14:00:00Z'
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockNotes
    });

    render(<LessonNotes courseId={1} lessonId={10} currentUser={{ id: 5, role: 'aluno' }} />);

    // Na página 1, deve exibir a nota 1 e a nota 20, mas NÃO a nota 21
    await waitFor(() => {
      expect(screen.getByText('Anotação de Teste Número 1')).toBeInTheDocument();
      expect(screen.getByText('Anotação de Teste Número 20')).toBeInTheDocument();
    });
    expect(screen.queryByText('Anotação de Teste Número 21')).not.toBeInTheDocument();

    // Controles de paginação
    const pagination = screen.getByTestId('notes-pagination');
    expect(pagination).toBeInTheDocument();
    expect(screen.getByText(/Exibindo 1–20 de 25 anotações/i)).toBeInTheDocument();
    expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument();

    // Botão Anterior desabilitado na primeira página
    const prevBtn = screen.getByTestId('prev-notes-page-btn');
    const nextBtn = screen.getByTestId('next-notes-page-btn');
    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Clica em Próxima
    fireEvent.click(nextBtn);

    // Na página 2, deve exibir a nota 21 e 25, mas NÃO a nota 1
    await waitFor(() => {
      expect(screen.getByText('Anotação de Teste Número 21')).toBeInTheDocument();
      expect(screen.getByText('Anotação de Teste Número 25')).toBeInTheDocument();
    });
    expect(screen.queryByText('Anotação de Teste Número 1')).not.toBeInTheDocument();
    expect(screen.getByText(/Exibindo 21–25 de 25 anotações/i)).toBeInTheDocument();
    expect(screen.getByText(/Página 2 de 2/i)).toBeInTheDocument();
    expect(nextBtn).toBeDisabled();
    expect(prevBtn).not.toBeDisabled();

    // Clica em Anterior para voltar
    fireEvent.click(prevBtn);
    await waitFor(() => {
      expect(screen.getByText('Anotação de Teste Número 1')).toBeInTheDocument();
    });
    expect(screen.getByText(/Página 1 de 2/i)).toBeInTheDocument();
  });
});

