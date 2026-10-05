import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LessonModal, ConfirmDeleteModal } from './ModuleLessonModals';
import ModuleModal from './ModuleModal';

// Mock dos subgerenciadores para isolar o teste do modal
vi.mock('./LessonThumbnailManager', () => ({
  default: () => <div data-testid="mock-thumbnail-manager" />
}));

vi.mock('./LessonVideoManager', () => ({
  default: () => <div data-testid="mock-video-manager" />
}));

vi.mock('./LessonAttachmentsManager', () => ({
  default: () => <div data-testid="mock-attachments-manager" />
}));

describe('LessonModal & ConfirmDeleteModal Components', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    editingLesson: null,
    loading: false
  };

  it('renders duration label explicitly stating "(em minutos)" and helper hint', () => {
    render(<LessonModal {...defaultProps} />);

    expect(screen.getByText(/Duração Estimada/i)).toBeInTheDocument();
    expect(screen.getByText(/\(em minutos\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Tempo em minutos/i)).toBeInTheDocument();

    const durationInput = screen.getByTestId('lesson-duration-input');
    expect(durationInput).toHaveAttribute('placeholder', 'Ex: 20 min ou 15:30');
  });

  it('normalizes pure numbers (e.g. "20") to "20 min" on save', () => {
    const handleSave = vi.fn();
    render(<LessonModal {...defaultProps} onSave={handleSave} />);

    // Preenche título obrigatório
    const titleInput = screen.getByTestId('lesson-title-input');
    fireEvent.change(titleInput, { target: { value: 'Aula Teste Normalização' } });

    // Preenche duração apenas com "20"
    const durationInput = screen.getByTestId('lesson-duration-input');
    fireEvent.change(durationInput, { target: { value: '20' } });

    // Submete formulário
    fireEvent.submit(titleInput.closest('form'));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Aula Teste Normalização',
        duration: '20 min'
      })
    );
  });

  it('keeps formatted strings like "15:30" or "25 min" intact on save', () => {
    const handleSave = vi.fn();
    render(<LessonModal {...defaultProps} onSave={handleSave} />);

    const titleInput = screen.getByTestId('lesson-title-input');
    fireEvent.change(titleInput, { target: { value: 'Aula com Cronômetro' } });

    const durationInput = screen.getByTestId('lesson-duration-input');
    fireEvent.change(durationInput, { target: { value: '15:30' } });

    fireEvent.submit(titleInput.closest('form'));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: '15:30'
      })
    );
  });

  it('applies member area bgColor to ConfirmDeleteModal card and dark style to Cancelar button', () => {
    render(
      <ConfirmDeleteModal
        isOpen={true}
        title="Excluir Módulo: Modulo 02?"
        message="Ao excluir este módulo, todas as aulas serão apagadas."
        bgColor="#090d16"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    const heading = screen.getByText('Excluir Módulo: Modulo 02?');
    expect(heading).toHaveStyle({ color: '#f8fafc' });
    const card = heading.closest('.table-card');
    expect(card).toHaveStyle({ backgroundColor: '#090d16' });
    expect(screen.getByTestId('cancel-delete-btn')).toHaveStyle({ color: '#f8fafc' });
  });

  it('renders maximize button on LessonModal description and toggles expansion', () => {
    render(<LessonModal {...defaultProps} />);

    const toggleBtn = screen.getByTestId('toggle-expand-lesson-description-btn');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent('Maximizar');

    const descInput = screen.getByTestId('lesson-description-input');
    expect(descInput).toHaveAttribute('rows', '2');

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent('Restaurar');
    expect(descInput).toHaveAttribute('rows', '8');
  });

  it('renders maximize button on ModuleModal description and toggles expansion', () => {
    render(
      <ModuleModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );

    const toggleBtn = screen.getByTestId('toggle-expand-module-description-btn');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent('Maximizar');

    const descInput = screen.getByTestId('module-description-input');
    expect(descInput).toHaveAttribute('rows', '2');

    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent('Restaurar');
    expect(descInput).toHaveAttribute('rows', '8');
  });
});

