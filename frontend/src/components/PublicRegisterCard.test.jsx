import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicRegisterCard from './PublicRegisterCard';
import { ToastProvider } from '../context/ToastContext';

describe('PublicRegisterCard Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const renderCard = (props = {}) => {
    return render(
      <ToastProvider>
        <PublicRegisterCard
          onRegisterSuccess={vi.fn()}
          onBackToLogin={vi.fn()}
          {...props}
        />
      </ToastProvider>
    );
  };

  it('renders all fields, headers and buttons properly', () => {
    renderCard();

    expect(screen.getByText('Criar Conta')).toBeInTheDocument();
    expect(screen.getByText(/Cadastre-se para acessar a comunidade/i)).toBeInTheDocument();
    expect(screen.getByTestId('register-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-phone-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-submit-btn')).toBeInTheDocument();
    expect(screen.getByTestId('go-to-login-btn')).toBeInTheDocument();
  });

  it('defaults country code badge to BR and DDI to +55 and includes country codes in options', () => {
    renderCard();

    const codeBadge = screen.getByTestId('phone-country-code-badge');
    expect(codeBadge).toHaveTextContent('BR');

    const selectorBox = screen.getByTestId('phone-country-selector-box');
    expect(selectorBox).toHaveTextContent('+55');

    const countrySelect = screen.getByTestId('phone-country-select');
    expect(countrySelect.value).toBe('BR');
    expect(screen.getByRole('option', { name: /BR - Brasil \(\+55\)/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /PT - Portugal \(\+351\)/i })).toBeInTheDocument();
  });

  it('allows changing country DDI dropdown to another country updating the country code badge', () => {
    renderCard();

    const countrySelect = screen.getByTestId('phone-country-select');
    fireEvent.change(countrySelect, { target: { value: 'PT' } });

    const codeBadge = screen.getByTestId('phone-country-code-badge');
    expect(codeBadge).toHaveTextContent('PT');

    const selectorBox = screen.getByTestId('phone-country-selector-box');
    expect(selectorBox).toHaveTextContent('+351');
  });

  it('initializes all input fields strictly empty with autocomplete configured to prevent login autofill', () => {
    renderCard();

    const nameInput = screen.getByTestId('register-name-input');
    const emailInput = screen.getByTestId('register-email-input');
    const phoneInput = screen.getByTestId('register-phone-input');
    const passwordInput = screen.getByTestId('register-password-input');
    const confirmInput = screen.getByTestId('register-confirm-password-input');

    expect(nameInput.value).toBe('');
    expect(emailInput.value).toBe('');
    expect(phoneInput.value).toBe('');
    expect(passwordInput.value).toBe('');
    expect(confirmInput.value).toBe('');

    expect(passwordInput).toHaveAttribute('autocomplete', 'new-password');
    expect(confirmInput).toHaveAttribute('autocomplete', 'new-password');
  });

  it('formats Brazilian phone number automatically on user input', () => {
    renderCard();

    const phoneInput = screen.getByTestId('register-phone-input');
    fireEvent.change(phoneInput, { target: { value: '11988887777' } });

    expect(phoneInput.value).toBe('(11) 98888-7777');
  });

  it('shows error if password and confirm password do not match', async () => {
    renderCard();

    fireEvent.change(screen.getByTestId('register-name-input'), { target: { value: 'Aluno Teste' } });
    fireEvent.change(screen.getByTestId('register-email-input'), { target: { value: 'aluno@teste.com' } });
    fireEvent.change(screen.getByTestId('register-password-input'), { target: { value: 'SenhaForte123!' } });
    fireEvent.change(screen.getByTestId('register-confirm-password-input'), { target: { value: 'OutraSenha123!' } });

    fireEvent.click(screen.getByTestId('register-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('register-error')).toHaveTextContent('As senhas digitadas não coincidem.');
    });
  });

  it('shows error if password has fewer than 12 characters', async () => {
    renderCard();

    fireEvent.change(screen.getByTestId('register-name-input'), { target: { value: 'Aluno Teste' } });
    fireEvent.change(screen.getByTestId('register-email-input'), { target: { value: 'aluno@teste.com' } });
    fireEvent.change(screen.getByTestId('register-password-input'), { target: { value: 'Curta1!' } });
    fireEvent.change(screen.getByTestId('register-confirm-password-input'), { target: { value: 'Curta1!' } });

    fireEvent.click(screen.getByTestId('register-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('register-error')).toHaveTextContent('A senha deve ter no mínimo 12 caracteres.');
    });
  });

  it('submits form successfully with DDI included and triggers onRegisterSuccess', async () => {
    const onRegisterSuccess = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'valid-jwt-token',
        user: { id: 1, name: 'Aluno VIP', email: 'alunovip@teste.com', role: 'aluno' },
      }),
    });

    renderCard({ onRegisterSuccess });

    fireEvent.change(screen.getByTestId('register-name-input'), { target: { value: 'Aluno VIP' } });
    fireEvent.change(screen.getByTestId('register-email-input'), { target: { value: 'alunovip@teste.com' } });
    fireEvent.change(screen.getByTestId('register-phone-input'), { target: { value: '11999998888' } });
    fireEvent.change(screen.getByTestId('register-password-input'), { target: { value: 'SenhaSuperForte123!' } });
    fireEvent.change(screen.getByTestId('register-confirm-password-input'), { target: { value: 'SenhaSuperForte123!' } });

    fireEvent.click(screen.getByTestId('register-submit-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/auth/public-register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Aluno VIP',
            email: 'alunovip@teste.com',
            password: 'SenhaSuperForte123!',
            phone: '+55 (11) 99999-8888',
          }),
        })
      );
      expect(onRegisterSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Aluno VIP' }),
        'valid-jwt-token'
      );
    });

    expect(localStorage.getItem('auth_token')).toBe('valid-jwt-token');
    expect(localStorage.getItem('active_tab')).toBe('courses');
  });

  it('triggers onBackToLogin callback when back button is clicked', () => {
    const onBackToLogin = vi.fn();
    renderCard({ onBackToLogin });

    fireEvent.click(screen.getByTestId('go-to-login-btn'));
    expect(onBackToLogin).toHaveBeenCalledTimes(1);
  });
});
