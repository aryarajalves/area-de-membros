import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Register from './Register';
import { ToastProvider } from '../context/ToastContext';

global.fetch = vi.fn();

describe('Register Component - Expired Invite Redirection', () => {
  beforeEach(() => {
    global.fetch.mockReset();
    localStorage.clear();
  });

  it('redireciona automaticamente para tela de login quando o convite expirou e usuario nao possui sessao ativa', async () => {
    const onRedirectToHome = vi.fn();
    const onRedirectToLogin = vi.fn();

    global.fetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/platform-theme')) {
        return Promise.resolve({ ok: true, json: async () => ({ bg_color: '#090d16' }) });
      }
      if (typeof url === 'string' && url.includes('/validate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            valid: false,
            is_expired: true,
            detail: 'Este convite expirou.',
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <Register
          token="token-expirado-123"
          onRedirectToHome={onRedirectToHome}
          onRedirectToLogin={onRedirectToLogin}
        />
      </ToastProvider>
    );

    await vi.waitFor(() => {
      expect(onRedirectToLogin).toHaveBeenCalled();
    });
    expect(onRedirectToHome).not.toHaveBeenCalled();
  });

  it('redireciona automaticamente para a tela principal (home) quando o convite expirou mas usuario possui sessao ativa', async () => {
    localStorage.setItem('auth_token', 'valid-active-token');
    localStorage.setItem('auth_user', JSON.stringify({ id: 10, email: 'aluno@ativo.com' }));

    const onRedirectToHome = vi.fn();
    const onRedirectToLogin = vi.fn();

    global.fetch.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/platform-theme')) {
        return Promise.resolve({ ok: true, json: async () => ({ bg_color: '#090d16' }) });
      }
      if (typeof url === 'string' && url.includes('/validate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            valid: false,
            is_expired: true,
            detail: 'Este convite expirou.',
          }),
        });
      }
      if (typeof url === 'string' && url.includes('/api/v1/users/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 10, email: 'aluno@ativo.com' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <Register
          token="token-expirado-com-sessao"
          onRedirectToHome={onRedirectToHome}
          onRedirectToLogin={onRedirectToLogin}
        />
      </ToastProvider>
    );

    await vi.waitFor(() => {
      expect(onRedirectToHome).toHaveBeenCalled();
    });
    expect(onRedirectToLogin).not.toHaveBeenCalled();
  });
});
