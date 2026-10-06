import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Sidebar from './Sidebar';

describe('Sidebar Component', () => {
  it('renders "Área de Membros" title and logo', () => {
    render(<Sidebar />);
    expect(screen.getByText('Área de Membros')).toBeInTheDocument();
    expect(screen.getByTestId('logo-icon')).toBeInTheDocument();
  });

  it('renders "Cursos" button for superadmin and aluno, and superadmin-only buttons', () => {
    // Superadmin vê Cursos, Backup, Logs e Gestão
    const superAdminUser = { name: 'Super Admin', email: 'admin@test.com', role: 'superadmin' };
    const { unmount } = render(<Sidebar user={superAdminUser} />);
    expect(screen.getByText('Cursos')).toBeInTheDocument();
    expect(screen.getByText('Depoimentos')).toBeInTheDocument();
    expect(screen.getByText('Ranking & Conquistas')).toBeInTheDocument();
    expect(screen.getByText('Backup Automático')).toBeInTheDocument();
    expect(screen.getByText('Logs do Sistema')).toBeInTheDocument();
    expect(screen.getByText('Gestão de Usuários')).toBeInTheDocument();
    unmount();

    // Aluno vê Cursos, Depoimentos e Ranking, mas NÃO vê Backup, Logs e Gestão de Usuários
    const alunoUser = { name: 'João Aluno', email: 'aluno@test.com', role: 'aluno' };
    const { unmount: unmountAluno } = render(<Sidebar user={alunoUser} />);
    expect(screen.getByText('Cursos')).toBeInTheDocument();
    expect(screen.getByText('Depoimentos')).toBeInTheDocument();
    expect(screen.getByText('Ranking & Conquistas')).toBeInTheDocument();
    expect(screen.queryByText('Backup Automático')).not.toBeInTheDocument();
    expect(screen.queryByText('Logs do Sistema')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestão de Usuários')).not.toBeInTheDocument();
    unmountAluno();

    // Usuário comum NÃO vê Cursos, Backup, Logs ou Gestão
    const regularUser = { name: 'Comum', email: 'comum@test.com', role: 'user' };
    render(<Sidebar user={regularUser} />);
    expect(screen.queryByText('Cursos')).not.toBeInTheDocument();
    expect(screen.queryByText('Backup Automático')).not.toBeInTheDocument();
    expect(screen.queryByText('Logs do Sistema')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestão de Usuários')).not.toBeInTheDocument();
  });

  it('renders user profile details and logout button', () => {
    const handleLogout = vi.fn();
    const user = { name: 'Super Admin', email: 'aryarajmarketing@gmail.com', role: 'superadmin' };
    render(<Sidebar user={user} onLogout={handleLogout} />);

    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('aryarajmarketing@gmail.com')).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toHaveTextContent('S');

    const logoutBtn = screen.getByTestId('logout-btn');
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalled();
  });

  it('allows clicking buttons and changing active state for superadmin', () => {
    const onSelectTabMock = vi.fn();
    const superAdminUser = { name: 'Super Admin', email: 'admin@test.com', role: 'superadmin' };
    render(<Sidebar user={superAdminUser} activeTab="users" onSelectTab={onSelectTabMock} />);

    const backupBtn = screen.getByTestId('nav-item-backup');
    fireEvent.click(backupBtn);
    expect(onSelectTabMock).toHaveBeenCalledWith('backup');
  });

  it('renders categories "Área Pedagógica", "Comunidade & Social" and "Sistema & Configurações" for superadmin and aluno', () => {
    // Superadmin vê as 3 categorias modernas da Proposta 2
    const superAdminUser = { name: 'Super Admin', email: 'admin@test.com', role: 'superadmin' };
    const { unmount } = render(<Sidebar user={superAdminUser} />);
    expect(screen.getByTestId('nav-category-pedagogica')).toBeInTheDocument();
    expect(screen.getByText('Área Pedagógica')).toBeInTheDocument();
    expect(screen.getByTestId('nav-category-comunidade')).toBeInTheDocument();
    expect(screen.getByText('Comunidade & Social')).toBeInTheDocument();
    expect(screen.getByTestId('nav-category-sistema')).toBeInTheDocument();
    expect(screen.getByText('Sistema & Configurações')).toBeInTheDocument();
    unmount();

    // Aluno vê Meu Aprendizado, Comunidade & Social e Sistema & Configurações (com Configurações)
    const alunoUser = { name: 'Aluno Teste', email: 'aluno@test.com', role: 'aluno' };
    const { unmount: unmountAluno } = render(<Sidebar user={alunoUser} />);
    expect(screen.getByTestId('nav-category-pedagogica')).toBeInTheDocument();
    expect(screen.getByText('Meu Aprendizado')).toBeInTheDocument();
    expect(screen.getByText('Relatos de Aulas')).toBeInTheDocument();
    expect(screen.getByTestId('nav-category-comunidade')).toBeInTheDocument();
    expect(screen.getByText('Comunidade & Social')).toBeInTheDocument();
    expect(screen.getByTestId('nav-category-sistema')).toBeInTheDocument();
    expect(screen.getByText('Sistema & Configurações')).toBeInTheDocument();
    expect(screen.getByTestId('nav-item-settings')).toBeInTheDocument();
    unmountAluno();
  });

  it('renders "Relatos de Aulas" with notification badge for superadmin when pendingReportsCount > 0', () => {
    const superAdminUser = { name: 'Super Admin', email: 'admin@test.com', role: 'superadmin' };
    render(<Sidebar user={superAdminUser} pendingReportsCount={3} />);

    expect(screen.getByText('Relatos de Aulas')).toBeInTheDocument();
    const badge = screen.getByTestId('pending-reports-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  it('applies member area background color to Sidebar and renders Configurações button for managers and alunos', () => {
    const onSelectTab = vi.fn();
    const superAdminUser = { name: 'Super Admin', email: 'admin@test.com', role: 'superadmin' };
    const { container, unmount } = render(<Sidebar user={superAdminUser} bgColor="#090d16" onSelectTab={onSelectTab} />);
    const aside = container.querySelector('aside.sidebar');
    expect(aside).toHaveStyle({ backgroundColor: '#090d16' });

    const settingsBtn = screen.getByTestId('nav-item-settings');
    expect(settingsBtn).toBeInTheDocument();
    fireEvent.click(settingsBtn);
    expect(onSelectTab).toHaveBeenCalledWith('settings');
    unmount();

    const onSelectTabAluno = vi.fn();
    const alunoUser = { name: 'Aluno Teste', email: 'aluno@test.com', role: 'aluno' };
    render(<Sidebar user={alunoUser} bgColor="#090d16" onSelectTab={onSelectTabAluno} />);
    const alunoSettingsBtn = screen.getByTestId('nav-item-settings');
    expect(alunoSettingsBtn).toBeInTheDocument();
    fireEvent.click(alunoSettingsBtn);
    expect(onSelectTabAluno).toHaveBeenCalledWith('settings');
  });

  it('renders "Integrações" button for superadmin and admin, and handles tab selection', () => {
    const onSelectTab = vi.fn();
    const superAdminUser = { name: 'Super Admin', email: 'admin@test.com', role: 'superadmin' };
    const { unmount } = render(<Sidebar user={superAdminUser} onSelectTab={onSelectTab} />);

    const integrationsBtn = screen.getByTestId('nav-item-integrations');
    expect(integrationsBtn).toBeInTheDocument();
    expect(screen.getByText('Integrações')).toBeInTheDocument();

    fireEvent.click(integrationsBtn);
    expect(onSelectTab).toHaveBeenCalledWith('integrations');
    unmount();

    // Aluno NÃO deve ver o botão de Integrações
    const alunoUser = { name: 'Aluno Teste', email: 'aluno@test.com', role: 'aluno' };
    render(<Sidebar user={alunoUser} />);
    expect(screen.queryByTestId('nav-item-integrations')).not.toBeInTheDocument();
    expect(screen.queryByText('Integrações')).not.toBeInTheDocument();
  });

  it('renders "Suporte" button for superadmin and aluno, and handles tab selection', () => {
    const onSelectTab = vi.fn();
    const superAdminUser = { name: 'Super Admin', email: 'admin@test.com', role: 'superadmin' };
    const { unmount } = render(<Sidebar user={superAdminUser} onSelectTab={onSelectTab} />);

    const supportBtn = screen.getByTestId('nav-item-support');
    expect(supportBtn).toBeInTheDocument();
    expect(screen.getByText('Suporte')).toBeInTheDocument();

    fireEvent.click(supportBtn);
    expect(onSelectTab).toHaveBeenCalledWith('support');
    unmount();

    // Aluno também DEVE ver o botão de Suporte
    const alunoUser = { name: 'Aluno Teste', email: 'aluno@test.com', role: 'aluno' };
    render(<Sidebar user={alunoUser} onSelectTab={onSelectTab} />);
    const alunoSupportBtn = screen.getByTestId('nav-item-support');
    expect(alunoSupportBtn).toBeInTheDocument();
    expect(screen.getByText('Suporte')).toBeInTheDocument();

    fireEvent.click(alunoSupportBtn);
    expect(onSelectTab).toHaveBeenCalledWith('support');
  });

  it('handles mobile drawer states, backdrop click, close button and auto-closing on selection', () => {
    const onCloseMobileMock = vi.fn();
    const onSelectTabMock = vi.fn();
    const superAdminUser = { name: 'Super Admin', email: 'admin@test.com', role: 'superadmin' };

    // Render fechado inicialmente
    const { rerender, container } = render(
      <Sidebar
        user={superAdminUser}
        isMobileOpen={false}
        onCloseMobile={onCloseMobileMock}
        onSelectTab={onSelectTabMock}
      />
    );

    const aside = container.querySelector('aside.sidebar');
    expect(aside).not.toHaveClass('mobile-open');
    expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();

    // Rerender aberto no mobile
    rerender(
      <Sidebar
        user={superAdminUser}
        isMobileOpen={true}
        onCloseMobile={onCloseMobileMock}
        onSelectTab={onSelectTabMock}
      />
    );

    expect(aside).toHaveClass('mobile-open');
    const backdrop = screen.getByTestId('sidebar-backdrop');
    expect(backdrop).toBeInTheDocument();

    // Clicar no backdrop fecha
    fireEvent.click(backdrop);
    expect(onCloseMobileMock).toHaveBeenCalledTimes(1);

    // Clicar no botão 'X' fecha
    const closeBtn = screen.getByTestId('sidebar-close-btn');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onCloseMobileMock).toHaveBeenCalledTimes(2);

    // Clicar em um item de navegação também fecha o drawer automaticamente
    const coursesBtn = screen.getByTestId('nav-item-courses');
    fireEvent.click(coursesBtn);
    expect(onSelectTabMock).toHaveBeenCalledWith('courses');
    expect(onCloseMobileMock).toHaveBeenCalledTimes(3);
  });

  it('renders "Chat da Comunidade" button for superadmin and aluno and handles selection', () => {
    const onSelectTabMock = vi.fn();
    const superAdminUser = { name: 'Super Admin', email: 'admin@test.com', role: 'superadmin' };
    const { unmount } = render(
      <Sidebar user={superAdminUser} onSelectTab={onSelectTabMock} />
    );

    const chatBtn = screen.getByTestId('nav-item-chat');
    expect(chatBtn).toBeInTheDocument();
    expect(screen.getByText('Chat da Comunidade')).toBeInTheDocument();

    fireEvent.click(chatBtn);
    expect(onSelectTabMock).toHaveBeenCalledWith('chat');
    unmount();

    // Aluno também tem acesso ao Chat
    const alunoUser = { name: 'João Aluno', email: 'aluno@test.com', role: 'aluno' };
    render(<Sidebar user={alunoUser} onSelectTab={onSelectTabMock} />);
    expect(screen.getByText('Chat da Comunidade')).toBeInTheDocument();
  });

  it('renders user-avatar-img when avatar_url is present on user object', () => {
    const userWithAvatar = {
      name: 'Aryaraj Alves',
      email: 'aryaraj@test.com',
      role: 'superadmin',
      avatar_url: 'https://cdn.test.com/my-avatar.jpg'
    };
    render(<Sidebar user={userWithAvatar} />);

    const avatarImg = screen.getByTestId('user-avatar-img');
    expect(avatarImg).toBeInTheDocument();
    expect(avatarImg).toHaveAttribute('src', 'https://cdn.test.com/my-avatar.jpg');
    expect(screen.queryByTestId('user-avatar')).not.toBeInTheDocument();
  });

  it('renders "Links" category with social and important links', async () => {
    localStorage.setItem('auth_token', 'fake-token');
    const mockLinks = [
      { id: 1, title: 'Instagram Oficial', url: 'https://instagram.com/oficial', icon: 'instagram', order_index: 1, is_active: true },
      { id: 2, title: 'Canal do YouTube', url: 'https://youtube.com/canal', icon: 'youtube', order_index: 2, is_active: true },
    ];

    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockLinks,
    });

    const user = { name: 'Aluno', email: 'aluno@test.com', role: 'aluno' };
    render(<Sidebar user={user} />);

    expect(await screen.findByTestId('nav-category-links')).toBeInTheDocument();
    expect(screen.getByText('Instagram Oficial')).toBeInTheDocument();
    expect(screen.getByText('Canal do YouTube')).toBeInTheDocument();

    const linkEl = screen.getByTestId('sidebar-link-1');
    expect(linkEl).toHaveAttribute('href', 'https://instagram.com/oficial');
    expect(linkEl).toHaveAttribute('target', '_blank');

    global.fetch = originalFetch;
  });
});



