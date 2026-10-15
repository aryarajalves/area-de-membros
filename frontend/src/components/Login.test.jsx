import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Login from './Login';
import { ToastProvider } from '../context/ToastContext';

describe('Login Component', () => {
  it('renders login form with email, password and submit button', () => {
    render(
      <ToastProvider>
        <Login />
      </ToastProvider>
    );
    expect(screen.getByText('Área de Membros')).toBeInTheDocument();
    expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
  });

  it('toggles password visibility when clicking eye button', () => {
    render(
      <ToastProvider>
        <Login />
      </ToastProvider>
    );
    const passwordInput = screen.getByTestId('login-password-input');
    const toggleBtn = screen.getByTestId('toggle-password-visibility');

    expect(passwordInput).toHaveAttribute('type', 'password');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'text');
    fireEvent.click(toggleBtn);
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('updates email and password inputs correctly when user types inside input-wrapper', () => {
    render(
      <ToastProvider>
        <Login />
      </ToastProvider>
    );
    const emailInput = screen.getByTestId('login-email-input');
    const passwordInput = screen.getByTestId('login-password-input');

    expect(emailInput.closest('.input-wrapper')).toBeInTheDocument();
    expect(passwordInput.closest('.input-wrapper')).toBeInTheDocument();

    fireEvent.change(emailInput, { target: { value: 'usuario@exemplo.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Senha@123456' } });

    expect(emailInput.value).toBe('usuario@exemplo.com');
    expect(passwordInput.value).toBe('Senha@123456');
  });

  it('sets active_tab to courses in localStorage when logged in user is aluno', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/v1/auth/login') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            access_token: 'fake-token-aluno',
            user: { id: 10, name: 'Aluno Teste', email: 'aluno@teste.com', role: 'aluno' },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ platform_name: 'Área de Membros', login_banner_url: null }),
      });
    });

    const onLoginSuccess = vi.fn();

    render(
      <ToastProvider>
        <Login onLoginSuccess={onLoginSuccess} />
      </ToastProvider>
    );

    fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'aluno@teste.com' } });
    fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'SenhaForte123!' } });
    fireEvent.click(screen.getByTestId('login-submit-btn'));

    // Aguarda o login concluir
    await vi.waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'aluno' }),
        'fake-token-aluno'
      );
    });

    expect(localStorage.getItem('active_tab')).toBe('courses');
  });

  it('carrega nome e banner customizados da API de WhiteLabel', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/v1/whitelabel') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            platform_name: 'Escola de Elite',
            login_banner_url: 'https://exemplo.com/banner-elite.jpg',
          }),
        });
      }
      return Promise.reject(new Error('URL não mapeada'));
    });

    render(
      <ToastProvider>
        <Login />
      </ToastProvider>
    );

    await vi.waitFor(() => {
      expect(screen.getByText('Escola de Elite')).toBeInTheDocument();
      const bannerImg = screen.getByTestId('login-banner-image');
      expect(bannerImg).toHaveAttribute('src', 'https://exemplo.com/banner-elite.jpg');
      expect(bannerImg).toHaveAttribute('alt', 'Escola de Elite');
    });
  });

  it('switches between login and registration forms using toggle buttons', () => {
    render(
      <ToastProvider>
        <Login />
      </ToastProvider>
    );

    const goToRegisterBtn = screen.getByTestId('go-to-register-btn');
    expect(goToRegisterBtn).toBeInTheDocument();

    fireEvent.click(goToRegisterBtn);

    expect(screen.getByText('Criar Conta')).toBeInTheDocument();
    expect(screen.getByTestId('register-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('register-submit-btn')).toBeInTheDocument();

    const goToLoginBtn = screen.getByTestId('go-to-login-btn');
    fireEvent.click(goToLoginBtn);

    expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
  });

  it('submits registration form successfully and invokes onLoginSuccess', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/v1/auth/public-register') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            access_token: 'fake-register-token',
            user: { id: 25, name: 'Aluno Comunidade', email: 'novo@teste.com', role: 'aluno' },
          }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ platform_name: 'Área de Membros', login_banner_url: null }),
      });
    });

    const onLoginSuccess = vi.fn();

    render(
      <ToastProvider>
        <Login onLoginSuccess={onLoginSuccess} />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('go-to-register-btn'));

    fireEvent.change(screen.getByTestId('register-name-input'), { target: { value: 'Aluno Comunidade' } });
    fireEvent.change(screen.getByTestId('register-email-input'), { target: { value: 'novo@teste.com' } });
    fireEvent.change(screen.getByTestId('register-password-input'), { target: { value: 'SenhaSegura123!@' } });
    fireEvent.change(screen.getByTestId('register-confirm-password-input'), { target: { value: 'SenhaSegura123!@' } });

    fireEvent.click(screen.getByTestId('register-submit-btn'));

    await vi.waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Aluno Comunidade', role: 'aluno' }),
        'fake-register-token'
      );
    });

    expect(localStorage.getItem('auth_token')).toBe('fake-register-token');
  });

  it('shows error banner when passwords do not match', async () => {
    render(
      <ToastProvider>
        <Login />
      </ToastProvider>
    );

    fireEvent.click(screen.getByTestId('go-to-register-btn'));

    fireEvent.change(screen.getByTestId('register-name-input'), { target: { value: 'Aluno Teste' } });
    fireEvent.change(screen.getByTestId('register-email-input'), { target: { value: 'aluno@teste.com' } });
    fireEvent.change(screen.getByTestId('register-password-input'), { target: { value: 'SenhaSegura123!@' } });
    fireEvent.change(screen.getByTestId('register-confirm-password-input'), { target: { value: 'OutraSenha123!@' } });

    fireEvent.click(screen.getByTestId('register-submit-btn'));

    expect(screen.getByTestId('register-error')).toHaveTextContent('As senhas digitadas não coincidem.');
  });

  it('hides right side banner and renders centered register container when in registration mode', () => {
    const { container } = render(
      <ToastProvider>
        <Login />
      </ToastProvider>
    );

    // No modo login, o banner da direita existe
    expect(container.querySelector('.login-image-side')).toBeInTheDocument();

    // Clica para ir ao cadastro
    fireEvent.click(screen.getByTestId('go-to-register-btn'));

    // No modo cadastro, o banner da direita SUMIU e o container centralizado é exibido
    expect(container.querySelector('.login-image-side')).toBeNull();
    expect(container.querySelector('.register-page-container')).toBeInTheDocument();
    expect(screen.getByTestId('public-register-container')).toBeInTheDocument();
  });

  it('pre-fills email input when prefill_login_email exists in localStorage and cleans it up', () => {
    localStorage.setItem('prefill_login_email', 'aryarajunity@gmail.com');

    render(
      <ToastProvider>
        <Login />
      </ToastProvider>
    );

    const emailInput = screen.getByTestId('login-email-input');
    expect(emailInput.value).toBe('aryarajunity@gmail.com');
    expect(localStorage.getItem('prefill_login_email')).toBeNull();
  });
});
