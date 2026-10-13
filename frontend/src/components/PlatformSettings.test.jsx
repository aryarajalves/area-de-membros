import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlatformSettings from './PlatformSettings';
import { ToastProvider } from '../context/ToastContext';

describe('PlatformSettings Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
  });

  it('renders platform settings page and allows selecting a preset and saving global background color', async () => {
    const onThemeColorChange = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bg_color: '#121620' }),
    });

    render(
      <ToastProvider>
        <PlatformSettings bgColor="#090d16" onThemeColorChange={onThemeColorChange} />
      </ToastProvider>
    );

    expect(screen.getByText('Configurações da Área de Membros')).toBeInTheDocument();
    expect(screen.getByTestId('platform-bgcolor-input')).toHaveValue('#090d16');

    // Seleciona o preset Grafite Escuro (#121620)
    fireEvent.click(screen.getByTestId('preset-bgcolor-#121620'));
    expect(screen.getByTestId('platform-bgcolor-input')).toHaveValue('#121620');

    // Clica em Salvar Configurações
    fireEvent.click(screen.getByTestId('save-platform-settings-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/platform-theme',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ bg_color: '#121620' }),
        })
      );
      expect(onThemeColorChange).toHaveBeenCalledWith('#121620');
    });
  });

  it('permite alternar para a aba Meu Perfil e exibe o formulário de perfil', () => {
    const mockUser = {
      id: 1,
      name: 'Aryaraj Super',
      email: 'aryaraj@test.com',
      role: 'superadmin',
    };

    render(
      <ToastProvider>
        <PlatformSettings
          bgColor="#090d16"
          currentUser={mockUser}
        />
      </ToastProvider>
    );

    const profileTabBtn = screen.getByTestId('tab-profile-btn');
    expect(profileTabBtn).toBeInTheDocument();

    // Clica na aba Meu Perfil
    fireEvent.click(profileTabBtn);

    expect(screen.getByTestId('platform-profile-tab')).toBeInTheDocument();
    expect(screen.getByText('Meu Perfil e Identidade')).toBeInTheDocument();
  });

  it('exibe apenas as abas Cor de Fundo e Meu Perfil para aluno, ocultando Tokens de API', () => {
    const alunoUser = {
      id: 2,
      name: 'Aluno Teste',
      email: 'aluno@test.com',
      role: 'aluno',
    };

    render(
      <ToastProvider>
        <PlatformSettings
          bgColor="#090d16"
          currentUser={alunoUser}
        />
      </ToastProvider>
    );

    expect(screen.getByTestId('tab-appearance-btn')).toBeInTheDocument();
    expect(screen.getByTestId('tab-profile-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-api-tokens-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('tab-whitelabel-btn')).not.toBeInTheDocument();
  });

  it('exibe a aba Tokens de API e Links da Plataforma para administradores e permite alternar para Links', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const adminUser = {
      id: 1,
      name: 'Admin Teste',
      email: 'admin@test.com',
      role: 'admin',
    };

    render(
      <ToastProvider>
        <PlatformSettings
          bgColor="#090d16"
          currentUser={adminUser}
        />
      </ToastProvider>
    );

    const linksTabBtn = screen.getByTestId('tab-platform-links-btn');
    expect(linksTabBtn).toBeInTheDocument();
    expect(screen.getByTestId('tab-api-tokens-btn')).toBeInTheDocument();

    // Clica na aba Links da Plataforma
    fireEvent.click(linksTabBtn);

    expect(await screen.findByTestId('platform-links-tab')).toBeInTheDocument();
    expect(screen.getByText('Links da Barra Lateral')).toBeInTheDocument();
  });

  it('oculta a aba Links da Plataforma para alunos', () => {
    const alunoUser = {
      id: 2,
      name: 'Aluno Teste',
      email: 'aluno@test.com',
      role: 'aluno',
    };

    render(
      <ToastProvider>
        <PlatformSettings
          bgColor="#090d16"
          currentUser={alunoUser}
        />
      </ToastProvider>
    );

    expect(screen.queryByTestId('tab-platform-links-btn')).not.toBeInTheDocument();
  });

  it('renders responsive tabs with platform-settings-tabs and platform-settings-tab-btn classes', () => {
    const adminUser = {
      id: 1,
      name: 'Aryaraj Super',
      email: 'aryaraj@test.com',
      role: 'superadmin',
    };

    render(
      <ToastProvider>
        <PlatformSettings
          bgColor="#090d16"
          currentUser={adminUser}
        />
      </ToastProvider>
    );

    const tabsContainer = screen.getByTestId('platform-settings-tabs');
    expect(tabsContainer).toHaveClass('platform-settings-tabs');

    const appearanceBtn = screen.getByTestId('tab-appearance-btn');
    const profileBtn = screen.getByTestId('tab-profile-btn');
    const apiTokensBtn = screen.getByTestId('tab-api-tokens-btn');
    const linksBtn = screen.getByTestId('tab-platform-links-btn');
    const whitelabelBtn = screen.getByTestId('tab-whitelabel-btn');

    expect(appearanceBtn).toHaveClass('platform-settings-tab-btn');
    expect(profileBtn).toHaveClass('platform-settings-tab-btn');
    expect(apiTokensBtn).toHaveClass('platform-settings-tab-btn');
    expect(linksBtn).toHaveClass('platform-settings-tab-btn');
    expect(whitelabelBtn).toHaveClass('platform-settings-tab-btn');
  });

  it('exibe a aba WhiteLabel para administradores e permite alternar para ela', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ platform_name: 'Área de Membros', login_banner_url: null }),
    });

    const adminUser = {
      id: 1,
      name: 'Admin Teste',
      email: 'admin@test.com',
      role: 'admin',
    };

    render(
      <ToastProvider>
        <PlatformSettings
          bgColor="#090d16"
          currentUser={adminUser}
        />
      </ToastProvider>
    );

    const whitelabelBtn = screen.getByTestId('tab-whitelabel-btn');
    expect(whitelabelBtn).toBeInTheDocument();

    fireEvent.click(whitelabelBtn);

    expect(await screen.findByTestId('platform-whitelabel-tab')).toBeInTheDocument();
    expect(screen.getByText('Nome da Plataforma (Marca / WhiteLabel)')).toBeInTheDocument();
  });
});


