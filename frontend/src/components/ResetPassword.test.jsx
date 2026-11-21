import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResetPassword from './ResetPassword';
import { ToastProvider } from '../context/ToastContext';

global.fetch = vi.fn();

describe('ResetPassword Component', () => {
  beforeEach(() => {
    global.fetch.mockReset();
    localStorage.clear();
  });

  it('validates token and enforces 12+ chars, upper, lower, number, special char', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/validate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ valid: true, name: 'Aryaraj', email: 'aryarajunity@gmail.com' }),
        });
      }
      if (url.includes('/confirm')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Senha redefinida com sucesso.' }),
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <ToastProvider>
        <ResetPassword token="valid-reset-token" />
      </ToastProvider>
    );

    expect(await screen.findByText('Redefinir Senha')).toBeInTheDocument();
    expect(screen.getByText(/aryarajunity@gmail.com/i)).toBeInTheDocument();

    const passwordInput = screen.getByTestId('reset-password-input');
    const submitBtn = screen.getByTestId('reset-submit-btn');

    expect(submitBtn).toBeDisabled();

    // Senha fraca
    fireEvent.change(passwordInput, { target: { value: 'fraca' } });
    expect(submitBtn).toBeDisabled();

    // Senha forte, mas confirmação vazia -> botão desabilitado
    fireEvent.change(passwordInput, { target: { value: 'MinhaNovaSenha123@' } });
    expect(submitBtn).toBeDisabled();

    const confirmInput = screen.getByTestId('reset-password-confirm-input');

    // Confirmação com senha diferente -> indicador de erro e botão desabilitado
    fireEvent.change(confirmInput, { target: { value: 'OutraSenhaDiferente1@' } });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByTestId('password-match-indicator')).toHaveTextContent('As senhas não coincidem');

    // Confirmação coincidente -> indicador de sucesso e botão habilitado
    fireEvent.change(confirmInput, { target: { value: 'MinhaNovaSenha123@' } });
    expect(screen.getByTestId('password-match-indicator')).toHaveTextContent('As senhas conferem');
    expect(submitBtn).not.toBeDisabled();

    // Toggle de visibilidade da confirmação de senha
    const toggleConfirmBtn = screen.getByTestId('reset-toggle-confirm-password');
    expect(confirmInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleConfirmBtn);
    expect(confirmInput).toHaveAttribute('type', 'text');

    // Toggle de visibilidade da senha
    const toggleBtn = screen.getByTestId('reset-toggle-password');
    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');

    // Submissão bem-sucedida
    fireEvent.click(submitBtn);
    expect(await screen.findByText('Senha atualizada com sucesso!')).toBeInTheDocument();
  });

  it('redirects to home if user already has an active session', async () => {
    localStorage.setItem('auth_token', 'active-jwt-token');
    const onRedirectToHome = vi.fn();

    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/v1/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, email: 'aluno@teste.com' }),
        });
      }
      if (url.includes('platform-theme')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.reject(new Error('Should not validate reset token when logged in'));
    });

    render(
      <ToastProvider>
        <ResetPassword token="used-reset-token" onRedirectToHome={onRedirectToHome} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(onRedirectToHome).toHaveBeenCalledWith('/');
    });
  });

  it('redirects to login and prefills email when reset link was already used', async () => {
    const onRedirectToLogin = vi.fn();

    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/v1/auth/reset-password/validate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            valid: false,
            already_used: true,
            email: 'aluno@teste.com',
            detail: 'Este link de redefinição já foi utilizado.',
          }),
        });
      }
      if (url.includes('platform-theme')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <ToastProvider>
        <ResetPassword token="used-reset-token" onRedirectToLogin={onRedirectToLogin} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(onRedirectToLogin).toHaveBeenCalledWith('/login?email=aluno%40teste.com');
    });
    expect(localStorage.getItem('prefill_login_email')).toBe('aluno@teste.com');
  });

  it('redirects to login and prefills email when reset link is expired', async () => {
    const onRedirectToLogin = vi.fn();

    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/v1/auth/reset-password/validate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            valid: false,
            is_expired: true,
            email: 'expirado@teste.com',
            detail: 'Este link de redefinição expirou.',
          }),
        });
      }
      if (url.includes('platform-theme')) {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <ToastProvider>
        <ResetPassword token="expired-reset-token" onRedirectToLogin={onRedirectToLogin} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(onRedirectToLogin).toHaveBeenCalledWith('/login?email=expirado%40teste.com');
    });
    expect(localStorage.getItem('prefill_login_email')).toBe('expirado@teste.com');
  });
});
