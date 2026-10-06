import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../../context/ToastContext';
import StudentAssignTagsModal from './StudentAssignTagsModal';

const renderWithToast = (ui) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('StudentAssignTagsModal Component', () => {
  const mockStudent = {
    id: 42,
    name: 'Mariana Aluna',
    email: 'mariana@test.com',
    tags: [{ id: 1, name: 'VIP', color: '#8b5cf6' }],
  };

  const mockTagsList = [
    { id: 1, name: 'VIP', color: '#8b5cf6', student_count: 3 },
    { id: 2, name: 'Sem Curso', color: '#ef4444', student_count: 1 },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window, 'fetch').mockImplementation(async (url, options) => {
      if (url.includes('/api/v1/students/tags/student/')) {
        return { ok: true, json: async () => ({ ok: true }) };
      }
      if (url.endsWith('/api/v1/students/tags') && options?.method === 'POST') {
        const body = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({ id: 99, name: body.name, color: body.color, student_count: 0 }),
        };
      }
      return { ok: true, json: async () => mockTagsList };
    });
  });

  it('renders student info, preselected tags, and inline tag creation form', async () => {
    renderWithToast(
      <StudentAssignTagsModal
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Etiquetas do Aluno')).toBeInTheDocument();
    expect(screen.getByText(/Mariana Aluna/i)).toBeInTheDocument();
    expect(screen.getByTestId('inline-create-tag-input')).toBeInTheDocument();
    expect(screen.getByTestId('inline-create-tag-btn')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('Sem Curso')).toBeInTheDocument();
    });
  });

  it('allows creating a new tag inline and marks it automatically for the student', async () => {
    renderWithToast(
      <StudentAssignTagsModal
        isOpen={true}
        onClose={vi.fn()}
        student={mockStudent}
        onSuccess={vi.fn()}
      />
    );

    const input = screen.getByTestId('inline-create-tag-input');
    const createBtn = screen.getByTestId('inline-create-tag-btn');

    fireEvent.change(input, { target: { value: 'Interessado Mentoria' } });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText('Interessado Mentoria')).toBeInTheDocument();
    });
  });

  it('saves selected tags when clicking Salvar Etiquetas', async () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    renderWithToast(
      <StudentAssignTagsModal
        isOpen={true}
        onClose={onClose}
        student={mockStudent}
        onSuccess={onSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Sem Curso')).toBeInTheDocument();
    });

    // Clica para marcar a tag "Sem Curso"
    fireEvent.click(screen.getByTestId('assign-tag-option-2'));

    // Clica no botão Salvar Etiquetas
    const saveBtn = screen.getByTestId('save-student-tags-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
