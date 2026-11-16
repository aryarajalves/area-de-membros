import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VerifyEmailPage from './VerifyEmailPage';
import { ToastProvider } from '../context/ToastContext';

describe('VerifyEmailPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    global.fetch = vi.fn();
    window.history.replaceState({}, '', '/verify-email?token=token-valido-123');
  });

  it('valida o token, salva auth_token e chama onVerifiedSuccess para entrar na comunidade', async () => {
    const onVerifiedSuccess = vi.fn();

    global.fetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/platform-theme')) {
        return Promise.resolve({ ok: true, json: async () => ({ bg_color: '#090d16' }) });
      }
      if (url === '/api/v1/auth/register/verify-link') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            access_token: 'jwt-confirmado-123',
            token_type: 'bearer',
            user: { id: 42, name: 'Aryaraj', email: 'aryaraj@teste.com', role: 'aluno' },
          }),
        });
      }
      return Promise.reject(new Error('URL inesperada'));
    });

    render(
      <ToastProvider>
        <VerifyEmailPage onVerifiedSuccess={onVerifiedSuccess} />
      </ToastProvider>
    );

    expect(await screen.findByTestId('verify-email-success')).toBeInTheDocument();
    expect(localStorage.getItem('auth_token')).toBe('jwt-confirmado-123');
    await waitFor(
      () => {
        expect(onVerifiedSuccess).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'aryaraj@teste.com' }),
          'jwt-confirmado-123'
        );
      },
      { timeout: 2500 }
    );
  });

  it('exibe estado de erro quando o token do link estiver expirado ou inválido', async () => {
    global.fetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/platform-theme')) {
        return Promise.resolve({ ok: true, json: async () => ({ bg_color: '#090d16' }) });
      }
      if (url === '/api/v1/auth/register/verify-link') {
        return Promise.resolve({
          ok: false,
          json: async () => ({ detail: 'Este link de verificação expirou.' }),
        });
      }
      return Promise.reject(new Error('URL inesperada'));
    });

    render(
      <ToastProvider>
        <VerifyEmailPage />
      </ToastProvider>
    );

    const errBox = await screen.findByTestId('verify-email-error');
    expect(errBox).toHaveTextContent('Este link de verificação expirou.');
    expect(screen.getByTestId('verify-email-back-btn')).toBeInTheDocument();
  });
});
