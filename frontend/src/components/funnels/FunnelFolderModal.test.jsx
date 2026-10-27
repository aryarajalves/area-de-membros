import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelFolderModal from './FunnelFolderModal';

describe('FunnelFolderModal Component', () => {
  it('renders creation modal, allows entering name, choosing color and saving', () => {
    const handleSave = vi.fn();
    const handleClose = vi.fn();

    render(
      <FunnelFolderModal
        isOpen={true}
        onClose={handleClose}
        onSave={handleSave}
        folder={null}
        saving={false}
      />
    );

    expect(screen.getByText('Nova Pasta de Funis')).toBeInTheDocument();
    const input = screen.getByTestId('folder-name-input');
    fireEvent.change(input, { target: { value: 'Lançamento 2026' } });

    // Clica no preset de cor esmeralda (#10b981)
    const colorBtn = screen.getByTestId('color-preset-#10b981');
    fireEvent.click(colorBtn);

    const submitBtn = screen.getByTestId('submit-folder-btn');
    fireEvent.click(submitBtn);

    expect(handleSave).toHaveBeenCalledWith({
      name: 'Lançamento 2026',
      color: '#10b981',
    });
  });

  it('renders edit modal with existing folder data', () => {
    const handleSave = vi.fn();
    render(
      <FunnelFolderModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        folder={{ id: 5, name: 'Reengajamento', color: '#ec4899' }}
        saving={false}
      />
    );

    expect(screen.getByText('Editar Pasta de Funis')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Reengajamento')).toBeInTheDocument();
  });

  it('triggers onClose when clicking Cancelar', () => {
    const handleClose = vi.fn();
    render(
      <FunnelFolderModal
        isOpen={true}
        onClose={handleClose}
        onSave={vi.fn()}
        folder={null}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
