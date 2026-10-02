import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeleteTokenConfirmModal from './DeleteTokenConfirmModal';

describe('DeleteTokenConfirmModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <DeleteTokenConfirmModal
        isOpen={false}
        tokenName="Minha Chave"
        loading={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders confirmation text with token name and handles confirm and cancel', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <DeleteTokenConfirmModal
        isOpen={true}
        tokenName="Minha Chave de Teste"
        loading={false}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    );

    expect(screen.getByTestId('delete-token-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Revogar Chave de API?')).toBeInTheDocument();
    expect(screen.getByText(/"Minha Chave de Teste"/)).toBeInTheDocument();

    const cancelBtn = screen.getByTestId('cancel-delete-token-btn');
    const confirmBtn = screen.getByTestId('confirm-delete-token-btn');

    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
