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
    expect(screen.getByText('Backup Automático')).toBeInTheDocument();
    expect(screen.getByText('Gerenciamento de logs')).toBeInTheDocument();
    expect(screen.getByText('Gestão de Usuário')).toBeInTheDocument();
    unmount();

    // Aluno vê Cursos, mas NÃO vê Backup, Logs e Gestão de Usuários
    const alunoUser = { name: 'João Aluno', email: 'aluno@test.com', role: 'aluno' };
    const { unmount: unmountAluno } = render(<Sidebar user={alunoUser} />);
    expect(screen.getByText('Cursos')).toBeInTheDocument();
    expect(screen.queryByText('Backup Automático')).not.toBeInTheDocument();
    expect(screen.queryByText('Gerenciamento de logs')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestão de Usuário')).not.toBeInTheDocument();
    unmountAluno();

    // Usuário comum NÃO vê Cursos, Backup, Logs ou Gestão
    const regularUser = { name: 'Comum', email: 'comum@test.com', role: 'user' };
    render(<Sidebar user={regularUser} />);
    expect(screen.queryByText('Cursos')).not.toBeInTheDocument();
    expect(screen.queryByText('Backup Automático')).not.toBeInTheDocument();
    expect(screen.queryByText('Gerenciamento de logs')).not.toBeInTheDocument();
    expect(screen.queryByText('Gestão de Usuário')).not.toBeInTheDocument();
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

  it('renders categories "Gestão de Ensino", "Administração" and "Segurança" for superadmin, and only "Meu Aprendizado" for aluno', () => {
    // Superadmin vê as categorias de Ensino, Administração e Segurança
    const superAdminUser = { name: 'Super Admin', email: 'admin@test.com', role: 'superadmin' };
    const { unmount } = render(<Sidebar user={superAdminUser} />);
    expect(screen.getByTestId('nav-category-ensino')).toBeInTheDocument();
    expect(screen.getByText('Gestão de Ensino')).toBeInTheDocument();
    expect(screen.getByTestId('nav-category-administracao')).toBeInTheDocument();
    expect(screen.getByText('Administração')).toBeInTheDocument();
    expect(screen.getByTestId('nav-category-seguranca')).toBeInTheDocument();
    expect(screen.getByText('Segurança')).toBeInTheDocument();
    unmount();

    // Aluno vê apenas a categoria de Ensino (com Cursos e Suporte), sem Administração e sem Segurança
    const alunoUser = { name: 'Aluno Teste', email: 'aluno@test.com', role: 'aluno' };
    const { unmount: unmountAluno } = render(<Sidebar user={alunoUser} />);
    expect(screen.getByTestId('nav-category-ensino')).toBeInTheDocument();
    expect(screen.getByText('Meu Aprendizado')).toBeInTheDocument();
    expect(screen.queryByTestId('nav-category-administracao')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-category-seguranca')).not.toBeInTheDocument();
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

  it('applies member area background color to Sidebar and renders Configurações button for managers only', () => {
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

    const alunoUser = { name: 'Aluno Teste', email: 'aluno@test.com', role: 'aluno' };
    render(<Sidebar user={alunoUser} bgColor="#090d16" />);
    expect(screen.queryByTestId('nav-item-settings')).not.toBeInTheDocument();
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
});
