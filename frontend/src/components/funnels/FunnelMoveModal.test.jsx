import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelMoveModal from './FunnelMoveModal';

describe('FunnelMoveModal Component', () => {
  const mockFolders = [
    { id: 10, name: 'Onboarding VIP', color: '#8b5cf6' },
    { id: 20, name: 'Pós-Venda', color: '#10b981' },
  ];
  const mockFunnel = { id: 99, name: 'Funil Sequência 1', folder_id: 10 };

  it('renders folders list, permits selecting another folder and confirming', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <FunnelMoveModal
        isOpen={true}
        funnel={mockFunnel}
        folders={mockFolders}
        onClose={handleClose}
        onConfirm={handleConfirm}
        moving={false}
      />
    );

    expect(screen.getByText('Mover para Pasta')).toBeInTheDocument();
    expect(screen.getByText('Funil Sequência 1')).toBeInTheDocument();
    expect(screen.getByText('Onboarding VIP')).toBeInTheDocument();
    expect(screen.getByText('Pós-Venda')).toBeInTheDocument();
    expect(screen.getByText('Sem Pasta (Desvincular)')).toBeInTheDocument();

    // Seleciona a pasta Pós-Venda (ID 20)
    fireEvent.click(screen.getByTestId('move-option-folder-20'));
    fireEvent.click(screen.getByTestId('confirm-move-folder-btn'));

    expect(handleConfirm).toHaveBeenCalledWith(20);
  });

  it('permits selecting "Sem Pasta" (null) to unassign', () => {
    const handleConfirm = vi.fn();

    render(
      <FunnelMoveModal
        isOpen={true}
        funnel={mockFunnel}
        folders={mockFolders}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        moving={false}
      />
    );

    fireEvent.click(screen.getByTestId('move-option-unassigned'));
    fireEvent.click(screen.getByTestId('confirm-move-folder-btn'));

    expect(handleConfirm).toHaveBeenCalledWith(null);
  });
});
