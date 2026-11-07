import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TutorClearHistoryModal from './TutorClearHistoryModal';

describe('TutorClearHistoryModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <TutorClearHistoryModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByTestId('tutor-clear-history-modal')).not.toBeInTheDocument();
  });

  it('renders modal with warning and buttons when isOpen is true', () => {
    render(
      <TutorClearHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByTestId('tutor-clear-history-modal')).toBeInTheDocument();
    expect(screen.getByText('Limpar Histórico da Aula?')).toBeInTheDocument();
    expect(screen.getByText(/Esta ação removerá todas as mensagens/i)).toBeInTheDocument();
    expect(screen.getByTestId('btn-cancel-clear-history')).toBeInTheDocument();
    expect(screen.getByTestId('btn-confirm-clear-history')).toBeInTheDocument();
  });

  it('calls onClose when clicking cancel button or close X', () => {
    const handleClose = vi.fn();
    render(
      <TutorClearHistoryModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('btn-cancel-clear-history'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-close-clear-modal'));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('calls onConfirm when clicking confirm button', () => {
    const handleConfirm = vi.fn();
    render(
      <TutorClearHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />
    );

    fireEvent.click(screen.getByTestId('btn-confirm-clear-history'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons and shows spinner when loading is true', () => {
    render(
      <TutorClearHistoryModal
        isOpen={true}
        loading={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Limpando...')).toBeInTheDocument();
    expect(screen.getByTestId('btn-confirm-clear-history')).toBeDisabled();
    expect(screen.getByTestId('btn-cancel-clear-history')).toBeDisabled();
  });
});
