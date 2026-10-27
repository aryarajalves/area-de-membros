import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelDeleteFolderConfirmModal from './FunnelDeleteFolderConfirmModal';

describe('FunnelDeleteFolderConfirmModal Component', () => {
  it('renders modal with folder name, safety message about funnels moving to Sem Pasta and buttons', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <FunnelDeleteFolderConfirmModal
        isOpen={true}
        folderName="Campanhas de Natal"
        funnelsCount={3}
        onClose={handleClose}
        onConfirm={handleConfirm}
        deleting={false}
      />
    );

    expect(screen.getByText('Excluir Pasta de Funis')).toBeInTheDocument();
    expect(screen.getByText(/"Campanhas de Natal"/)).toBeInTheDocument();
    expect(screen.getByText(/3 funil\(s\)/)).toBeInTheDocument();
    expect(screen.getByText(/NÃO serão apagados/)).toBeInTheDocument();

    // Testa botão cancelar
    fireEvent.click(screen.getByText('Cancelar'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Testa botão confirmar exclusão
    fireEvent.click(screen.getByTestId('confirm-delete-folder-btn'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
