import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicRegisterCard from './PublicRegisterCard';
import { ToastProvider } from '../context/ToastContext';

describe('PublicRegisterCard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  it('exibe tela de confirmação de e-mail após enviar cadastro público com requires_verification', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'Enviamos um link de confirmação para o seu e-mail.',
        email: 'comunidade@teste.com',
        requires_verification: true,
      }),
    });

    render(
      <ToastProvider>
        <PublicRegisterCard />
      </ToastProvider>
    );

    fireEvent.change(screen.getByTestId('register-name-input'), {
      target: { value: 'Novo Membro' },
    });
    fireEvent.change(screen.getByTestId('register-email-input'), {
      target: { value: 'comunidade@teste.com' },
    });
    fireEvent.change(screen.getByTestId('register-password-input'), {
      target: { value: 'SenhaSegura123!@' },
    });
    fireEvent.change(screen.getByTestId('register-confirm-password-input'), {
      target: { value: 'SenhaSegura123!@' },
    });

    fireEvent.click(screen.getByTestId('register-submit-btn'));

    expect(await screen.findByText('Confirme seu E-mail')).toBeInTheDocument();
    expect(screen.getByText(/comunidade@teste.com/i)).toBeInTheDocument();
    expect(screen.getByText(/30 minutos/i)).toBeInTheDocument();
    expect(screen.getByTestId('resend-code-btn')).toBeInTheDocument();
  });
});
