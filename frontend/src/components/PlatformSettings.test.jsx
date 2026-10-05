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
  });

  it('exibe a aba Tokens de API para administradores', () => {
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

    expect(screen.getByTestId('tab-api-tokens-btn')).toBeInTheDocument();
  });
});

