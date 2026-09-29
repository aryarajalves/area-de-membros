import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Register from './Register';
import { ToastProvider } from '../context/ToastContext';

// Mock fetch
global.fetch = vi.fn();

describe('Register Component', () => {
  it('enforces password rules: >= 12 chars, upper, lower, number, special char', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ valid: true, role: 'admin' }),
    });

    render(
      <ToastProvider>
        <Register token="valid-test-token" />
      </ToastProvider>
    );

    // Wait for validation
    expect(await screen.findByText('Criar Conta')).toBeInTheDocument();

    const passwordInput = screen.getByTestId('reg-password-input');
    const submitBtn = screen.getByTestId('register-submit-btn');

    // Initially disabled because password is empty
    expect(submitBtn).toBeDisabled();

    // Type weak password
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    expect(submitBtn).toBeDisabled();

    // Type password meeting all rules, but confirmation is empty -> disabled
    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
    expect(submitBtn).toBeDisabled();

    const confirmInput = screen.getByTestId('reg-password-confirm-input');

    // Type non-matching confirmation -> disabled with mismatch indicator
    fireEvent.change(confirmInput, { target: { value: 'DifferentPassword123!' } });
    expect(submitBtn).toBeDisabled();
    expect(screen.getByTestId('register-password-match-indicator')).toHaveTextContent('As senhas não coincidem');

    // Type matching confirmation -> enabled with match indicator
    fireEvent.change(confirmInput, { target: { value: 'StrongPassword123!' } });
    expect(screen.getByTestId('register-password-match-indicator')).toHaveTextContent('As senhas conferem');
    expect(submitBtn).not.toBeDisabled();
  });

  it('toggles password visibility', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ valid: true, role: 'user' }),
    });

    render(
      <ToastProvider>
        <Register token="test-token" />
      </ToastProvider>
    );
    expect(await screen.findByText('Criar Conta')).toBeInTheDocument();

    const passwordInput = screen.getByTestId('reg-password-input');
    const toggleBtn = screen.getByTestId('reg-toggle-password');

    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('submits registration, advances to OTP verification step, and completes registration', async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes('/validate')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ valid: true, role: 'admin' }),
        });
      }
      if (url === '/api/v1/auth/register') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: 'Código de verificação enviado para o seu e-mail.',
            email: 'novouser@teste.com',
            requires_verification: true,
          }),
        });
      }
      if (url === '/api/v1/auth/register/verify') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 10,
            email: 'novouser@teste.com',
            name: 'Novo Usuário',
            role: 'admin',
          }),
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    render(
      <ToastProvider>
        <Register token="valid-test-token" />
      </ToastProvider>
    );

    expect(await screen.findByText('Criar Conta')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('reg-name-input'), { target: { value: 'Novo Usuário' } });
    fireEvent.change(screen.getByTestId('reg-email-input'), { target: { value: 'novouser@teste.com' } });
    fireEvent.change(screen.getByTestId('reg-password-input'), { target: { value: 'MinhaSenhaSegura123!' } });
    fireEvent.change(screen.getByTestId('reg-password-confirm-input'), { target: { value: 'MinhaSenhaSegura123!' } });

    const submitBtn = screen.getByTestId('register-submit-btn');
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    // Deve avançar para a tela de OTP
    expect(await screen.findByText('Validar E-mail')).toBeInTheDocument();
    expect(screen.getByText(/novouser@teste.com/i)).toBeInTheDocument();

    const otpInput = screen.getByTestId('reg-otp-input');
    const verifyBtn = screen.getByTestId('verify-submit-btn');

    // Botão desabilitado se código tiver menos de 6 dígitos
    fireEvent.change(otpInput, { target: { value: '123' } });
    expect(verifyBtn).toBeDisabled();

    // Digita 6 dígitos corretos
    fireEvent.change(otpInput, { target: { value: '123456' } });
    expect(verifyBtn).not.toBeDisabled();

    fireEvent.click(verifyBtn);
    expect(await screen.findByText('Conta criada com sucesso!')).toBeInTheDocument();
  });
});
