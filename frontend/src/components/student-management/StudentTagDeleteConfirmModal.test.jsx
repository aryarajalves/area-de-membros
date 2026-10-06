import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StudentTagDeleteConfirmModal from './StudentTagDeleteConfirmModal';

describe('StudentTagDeleteConfirmModal Component', () => {
  const mockTag = {
    id: 1,
    name: 'aluno-novo',
    color: '#ef4444',
    student_count: 1,
  };

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <StudentTagDeleteConfirmModal
        isOpen={false}
        tag={mockTag}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with tag name, student count warning and action buttons', () => {
    render(
      <StudentTagDeleteConfirmModal
        isOpen={true}
        tag={mockTag}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByTestId('student-tag-delete-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Excluir Etiqueta?')).toBeInTheDocument();
    expect(screen.getByText(/aluno-novo/i)).toBeInTheDocument();
    expect(screen.getByText(/1 aluno/i)).toBeInTheDocument();
    expect(screen.getByTestId('cancel-delete-tag-btn')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-tag-btn')).toBeInTheDocument();
  });

  it('triggers onClose when clicking Cancelar button', () => {
    const onClose = vi.fn();
    render(
      <StudentTagDeleteConfirmModal
        isOpen={true}
        tag={mockTag}
        onClose={onClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('cancel-delete-tag-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onConfirm when clicking Sim, Excluir button', () => {
    const onConfirm = vi.fn();
    render(
      <StudentTagDeleteConfirmModal
        isOpen={true}
        tag={mockTag}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByTestId('confirm-delete-tag-btn'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner and disables buttons when deleting is true', () => {
    render(
      <StudentTagDeleteConfirmModal
        isOpen={true}
        tag={mockTag}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        deleting={true}
      />
    );

    expect(screen.getByText('Excluindo...')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-delete-tag-btn')).toBeDisabled();
    expect(screen.getByTestId('confirm-delete-tag-btn')).toBeDisabled();
  });
});
