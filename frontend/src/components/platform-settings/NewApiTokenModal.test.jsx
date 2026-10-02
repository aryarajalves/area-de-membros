import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NewApiTokenModal from './NewApiTokenModal';
import { ToastProvider } from '../../context/ToastContext';

describe('NewApiTokenModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ToastProvider>
        <NewApiTokenModal isOpen={false} onClose={vi.fn()} onTokenCreated={vi.fn()} />
      </ToastProvider>
    );
    expect(screen.queryByTestId('new-api-token-modal')).not.toBeInTheDocument();
  });

  it('renders input fields, allows typing name and changing expiration', () => {
    const handleClose = vi.fn();
    render(
      <ToastProvider>
        <NewApiTokenModal isOpen={true} onClose={handleClose} onTokenCreated={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByTestId('new-api-token-modal')).toBeInTheDocument();
    expect(screen.getByText('Gerar Nova Chave de API')).toBeInTheDocument();

    const nameInput = screen.getByTestId('api-token-name-input');
    const selectExpiration = screen.getByTestId('api-token-expiration-select');

    fireEvent.change(nameInput, { target: { value: 'Minha Integração' } });
    expect(nameInput).toHaveValue('Minha Integração');

    fireEvent.change(selectExpiration, { target: { value: '90' } });
    expect(selectExpiration).toHaveValue('90');

    // Fechar pelo botão cancelar
    fireEvent.click(screen.getByTestId('cancel-create-token-btn'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
