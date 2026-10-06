import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../../context/ToastContext';
import StudentTagsModal from './StudentTagsModal';

const renderWithToast = (ui) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('StudentTagsModal Component', () => {
  const mockTags = [
    { id: 1, name: 'VIP Mentoria', color: '#f59e0b', student_count: 8 },
    { id: 2, name: 'Turma 2026', color: '#10b981', student_count: 24 },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders tags list with student counts and create form', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockTags,
    });

    renderWithToast(<StudentTagsModal isOpen={true} onClose={vi.fn()} onTagsUpdated={vi.fn()} />);

    expect(screen.getByText('Gerenciar Etiquetas de Alunos')).toBeInTheDocument();
    expect(screen.getByTestId('new-tag-name-input')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('VIP Mentoria')).toBeInTheDocument();
      expect(screen.getByText('8 alunos')).toBeInTheDocument();
      expect(screen.getByText('Turma 2026')).toBeInTheDocument();
      expect(screen.getByText('24 alunos')).toBeInTheDocument();
    });
  });

  it('creates new tag when submitting the form', async () => {
    vi.spyOn(window, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 3, name: 'Nova Tag', color: '#3b82f6', student_count: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [...mockTags, { id: 3, name: 'Nova Tag', color: '#3b82f6', student_count: 0 }],
      });

    const onTagsUpdated = vi.fn();
    renderWithToast(<StudentTagsModal isOpen={true} onClose={vi.fn()} onTagsUpdated={onTagsUpdated} />);

    await waitFor(() => {
      expect(screen.getByTestId('new-tag-name-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('new-tag-name-input'), { target: { value: 'Nova Tag' } });
    fireEvent.click(screen.getByTestId('create-tag-submit-btn'));

    await waitFor(() => {
      expect(onTagsUpdated).toHaveBeenCalled();
    });
  });

  it('opens confirmation popup when clicking delete button and proceeds on confirm', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTags,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'deleted' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockTags[1]],
      });

    const onTagsUpdated = vi.fn();
    renderWithToast(<StudentTagsModal isOpen={true} onClose={vi.fn()} onTagsUpdated={onTagsUpdated} />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-tag-btn-1')).toBeInTheDocument();
    });

    // 1. Clicar no botão de exclusão da tag 1
    fireEvent.click(screen.getByTestId('delete-tag-btn-1'));

    // 2. Popup de confirmação deve abrir na tela
    const confirmModal = screen.getByTestId('student-tag-delete-confirm-modal');
    expect(confirmModal).toBeInTheDocument();
    expect(screen.getByText('Excluir Etiqueta?')).toBeInTheDocument();
    expect(screen.getAllByText(/VIP Mentoria/i).length).toBeGreaterThanOrEqual(2);

    // 3. Confirmar a exclusão
    const confirmBtn = screen.getByTestId('confirm-delete-tag-btn');
    fireEvent.click(confirmBtn);

    // 4. Aguardar chamada DELETE e toast
    await waitFor(() => {
      const deleteCall = fetchSpy.mock.calls.find((call) => call[0] === '/api/v1/students/tags/1');
      expect(deleteCall).toBeDefined();
      expect(deleteCall[1].method).toBe('DELETE');
      expect(onTagsUpdated).toHaveBeenCalled();
    });
  });

  it('cancels deletion when clicking Cancelar button in confirmation popup', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockTags,
    });

    renderWithToast(<StudentTagsModal isOpen={true} onClose={vi.fn()} onTagsUpdated={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('delete-tag-btn-1')).toBeInTheDocument();
    });

    // Abrir popup de exclusão
    fireEvent.click(screen.getByTestId('delete-tag-btn-1'));
    expect(screen.getByTestId('student-tag-delete-confirm-modal')).toBeInTheDocument();

    // Cancelar exclusão
    const cancelBtn = screen.getByTestId('cancel-delete-tag-btn');
    fireEvent.click(cancelBtn);

    // Popup deve fechar
    expect(screen.queryByTestId('student-tag-delete-confirm-modal')).not.toBeInTheDocument();
  });
});
