import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from './App';
import { ToastProvider } from './context/ToastContext';

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login screen when unauthenticated', () => {
    render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );
    expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
  });

  it('renders authenticated dashboard with sidebar when token and user exist', () => {
    localStorage.setItem('auth_token', 'mock_token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 1,
        name: 'Super Admin',
        email: 'aryarajmarketing@gmail.com',
        role: 'superadmin',
      })
    );
    localStorage.setItem('active_tab', 'users');

    render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );
    expect(screen.getByRole('complementary', { name: /menu lateral/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Gestão de Usuários' })).toBeInTheDocument();
  });

  it('restores last active tab from localStorage upon page reload', () => {
    localStorage.setItem('auth_token', 'mock_token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 1,
        name: 'Super Admin',
        email: 'aryarajmarketing@gmail.com',
        role: 'superadmin',
      })
    );
    localStorage.setItem('active_tab', 'backup');

    render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );

    expect(screen.getByTestId('automated-backup-page')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Gestão de Usuários' })).not.toBeInTheDocument();
  });

  it('renders welcome screen for non-superadmin users without mentioning restricted areas', () => {
    localStorage.setItem('auth_token', 'mock_token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 2,
        name: 'Usuário Comum',
        email: 'user@test.com',
        role: 'user',
      })
    );

    render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );

    expect(screen.getByTestId('restricted-access-screen')).toBeInTheDocument();
    expect(screen.getByText('Olá, Usuário Comum!')).toBeInTheDocument();
    expect(screen.getAllByText('user@test.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(/acesso exclusivo/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Gestão de Usuários')).not.toBeInTheDocument();
    expect(screen.queryByTestId('automated-backup-page')).not.toBeInTheDocument();
  });

  it('opens logout confirmation modal when clicking logout and proceeds only on confirm', () => {
    localStorage.setItem('auth_token', 'mock_token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 1,
        name: 'Super Admin',
        email: 'admin@test.com',
        role: 'superadmin',
      })
    );

    render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );

    const logoutBtn = screen.getByTestId('logout-btn');
    fireEvent.click(logoutBtn);

    // Modal de confirmação aberto
    expect(screen.getByTestId('logout-modal-content')).toBeInTheDocument();
    expect(screen.getByText('Encerrar Sessão')).toBeInTheDocument();

    // Clicar em cancelar fecha o modal e mantém o usuário logado
    const cancelBtn = screen.getByTestId('cancel-logout-btn');
    fireEvent.click(cancelBtn);
    expect(screen.queryByTestId('logout-modal-content')).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: /menu lateral/i })).toBeInTheDocument();

    // Clicar novamente no logout e depois em confirmar
    fireEvent.click(logoutBtn);
    expect(screen.getByTestId('logout-modal-content')).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-logout-btn');
    fireEvent.click(confirmBtn);

    // Usuário deslogado com sucesso e redirecionado para a tela de login
    expect(screen.queryByTestId('logout-modal-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });

  it('automatically logs out user and shows toast when session expires (AUTH_EXPIRED_EVENT)', async () => {
    localStorage.setItem('auth_token', 'expired_token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 1,
        name: 'Super Admin',
        email: 'admin@test.com',
        role: 'superadmin',
      })
    );

    render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );

    // Confirma que está logado
    expect(screen.getByRole('complementary', { name: /menu lateral/i })).toBeInTheDocument();

    // Dispara evento de sessão expirada
    window.dispatchEvent(new CustomEvent('auth:session_expired'));

    // Deve redirecionar para tela de login e exibir toast
    expect(await screen.findByTestId('login-email-input')).toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: /menu lateral/i })).not.toBeInTheDocument();
    expect(screen.getByText('Sua sessão expirou. Por favor, faça login novamente.')).toBeInTheDocument();
  });

  it('always opens courses tab for aluno user even if previous active_tab was different', async () => {
    localStorage.setItem('auth_token', 'mock_token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 7,
        name: 'Fernandes Aluno',
        email: 'fernandes@exemplo.com',
        role: 'aluno',
      })
    );
    // Simula resquício de outra aba usada anteriormente
    localStorage.setItem('active_tab', 'backup');

    render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );

    // O aluno não tem acesso a backup e deve ser redirecionado para a aba Cursos
    expect(screen.getByRole('complementary', { name: /menu lateral/i })).toBeInTheDocument();
    expect(screen.getByText('Cursos da Plataforma')).toBeInTheDocument();
    expect(screen.queryByTestId('automated-backup-page')).not.toBeInTheDocument();
    expect(localStorage.getItem('active_tab')).toBe('courses');
  });

  it('renders mobile-header when authenticated and toggles mobile menu drawer', () => {
    localStorage.setItem('auth_token', 'mock_token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 1,
        name: 'Super Admin',
        email: 'aryarajmarketing@gmail.com',
        role: 'superadmin',
      })
    );
    localStorage.setItem('active_tab', 'courses');

    const { container } = render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );

    // Mobile header deve estar presente
    const mobileHeader = screen.getByTestId('mobile-header');
    expect(mobileHeader).toBeInTheDocument();
    expect(screen.getByTestId('mobile-header-avatar')).toHaveTextContent('S');

    // Sidebar inicialmente fechada para mobile
    const aside = container.querySelector('aside.sidebar');
    expect(aside).not.toHaveClass('mobile-open');

    // Clica no botão do menu hambúrguer mobile
    const mobileToggleBtn = screen.getByTestId('mobile-menu-toggle-btn');
    fireEvent.click(mobileToggleBtn);

    // Sidebar agora deve possuir a classe mobile-open e exibir o backdrop
    expect(aside).toHaveClass('mobile-open');
    const backdrop = screen.getByTestId('sidebar-backdrop');
    expect(backdrop).toBeInTheDocument();

    // Clica no backdrop para fechar
    fireEvent.click(backdrop);
    expect(aside).not.toHaveClass('mobile-open');
  });

  it('allows aluno user to access lesson-reports and settings tabs', () => {
    localStorage.setItem('auth_token', 'mock_token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 7,
        name: 'Fernandes Aluno',
        email: 'fernandes@exemplo.com',
        role: 'aluno',
      })
    );
    localStorage.setItem('active_tab', 'settings');

    render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );

    expect(screen.getByTestId('platform-settings-page')).toBeInTheDocument();
    expect(screen.getByText('Configurações da Área de Membros')).toBeInTheDocument();
    expect(localStorage.getItem('active_tab')).toBe('settings');
  });
});



