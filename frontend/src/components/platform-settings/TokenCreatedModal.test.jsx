import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TokenCreatedModal from './TokenCreatedModal';
import { ToastProvider } from '../../context/ToastContext';

describe('TokenCreatedModal Component', () => {
  const mockData = {
    name: 'Token Especial',
    raw_token: 'sk_live_abcdef1234567890',
  };

  it('does not render when isOpen is false', () => {
    render(
      <ToastProvider>
        <TokenCreatedModal isOpen={false} tokenData={mockData} onClose={vi.fn()} />
      </ToastProvider>
    );
    expect(screen.queryByTestId('token-created-modal')).not.toBeInTheDocument();
  });

  it('renders raw token, copy button, security alert and close button', () => {
    const handleClose = vi.fn();
    render(
      <ToastProvider>
        <TokenCreatedModal isOpen={true} tokenData={mockData} onClose={handleClose} />
      </ToastProvider>
    );

    expect(screen.getByTestId('token-created-modal')).toBeInTheDocument();
    expect(screen.getByText('Chave de API Gerada!')).toBeInTheDocument();
    expect(screen.getByText('Token Especial')).toBeInTheDocument();
    expect(screen.getByText('sk_live_abcdef1234567890')).toBeInTheDocument();
    expect(screen.getByText(/Copie esta chave agora/i)).toBeInTheDocument();

    const closeBtn = screen.getByTestId('close-token-created-modal-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
