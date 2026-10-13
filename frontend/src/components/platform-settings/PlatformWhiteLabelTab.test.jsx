import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlatformWhiteLabelTab from './PlatformWhiteLabelTab';

describe('PlatformWhiteLabelTab Component', () => {
  const mockAddToast = vi.fn();
  const mockOnPlatformNameChange = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-preview-url');
  });

  it('carrega configurações iniciais da API e exibe nome e banner padrão', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        platform_name: 'Minha Escola VIP',
        login_banner_url: null,
      }),
    });

    render(
      <PlatformWhiteLabelTab
        cardBg="#1e2230"
        cardBorder="1px solid #333"
        textColor="#fff"
        subTextColor="#888"
        addToast={mockAddToast}
        onPlatformNameChange={mockOnPlatformNameChange}
      />
    );

    expect(screen.getByText('Nome da Plataforma (Marca / WhiteLabel)')).toBeInTheDocument();
    expect(screen.getByText('Imagem de Banner da Tela de Login')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('platform-name-input')).toHaveValue('Minha Escola VIP');
    });

    const bannerImg = screen.getByTestId('login-banner-preview-img');
    expect(bannerImg).toBeInTheDocument();
  });

  it('permite alterar e salvar o nome da plataforma com sucesso', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ platform_name: 'Área de Membros', login_banner_url: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ platform_name: 'Comunidade Alpha' }),
      });

    const eventSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <PlatformWhiteLabelTab
        cardBg="#1e2230"
        cardBorder="1px solid #333"
        textColor="#fff"
        subTextColor="#888"
        addToast={mockAddToast}
        onPlatformNameChange={mockOnPlatformNameChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('save-platform-name-btn')).not.toBeDisabled();
    });

    const input = screen.getByTestId('platform-name-input');
    fireEvent.change(input, { target: { value: 'Comunidade Alpha' } });
    expect(input.value).toBe('Comunidade Alpha');

    const saveBtn = screen.getByTestId('save-platform-name-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/whitelabel',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock_token',
          }),
          body: JSON.stringify({ platform_name: 'Comunidade Alpha' }),
        })
      );
      expect(localStorage.getItem('platform_name')).toBe('Comunidade Alpha');
      expect(mockAddToast).toHaveBeenCalledWith('Nome da plataforma atualizado com sucesso!', 'success');
      expect(mockOnPlatformNameChange).toHaveBeenCalledWith('Comunidade Alpha');
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  it('permite selecionar um arquivo de imagem, exibe preview e realiza o upload', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ platform_name: 'Área de Membros', login_banner_url: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          platform_name: 'Área de Membros',
          login_banner_url: 'https://cdn.example.com/login-custom.png',
        }),
      });

    render(
      <PlatformWhiteLabelTab
        cardBg="#1e2230"
        cardBorder="1px solid #333"
        textColor="#fff"
        subTextColor="#888"
        addToast={mockAddToast}
      />
    );

    const fileInput = screen.getByTestId('login-banner-file-input');
    const mockFile = new File(['dummy-content'], 'novo-banner.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(screen.getByText(/novo-banner\.png/)).toBeInTheDocument();
    const confirmBtn = screen.getByTestId('confirm-upload-banner-btn');
    expect(confirmBtn).toBeInTheDocument();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/whitelabel/login-banner',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock_token',
          }),
        })
      );
      expect(mockAddToast).toHaveBeenCalledWith('Nova imagem da tela de login enviada com sucesso!', 'success');
    });
  });

  it('permite restaurar imagem de login para o padrão quando há banner customizado ativo', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          platform_name: 'Área de Membros',
          login_banner_url: 'https://cdn.example.com/custom.png',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          platform_name: 'Área de Membros',
          login_banner_url: null,
        }),
      });

    render(
      <PlatformWhiteLabelTab
        cardBg="#1e2230"
        cardBorder="1px solid #333"
        textColor="#fff"
        subTextColor="#888"
        addToast={mockAddToast}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('reset-login-banner-btn')).toBeInTheDocument();
    });

    const resetBtn = screen.getByTestId('reset-login-banner-btn');
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/whitelabel/login-banner',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock_token',
          }),
        })
      );
      expect(mockAddToast).toHaveBeenCalledWith('Imagem da tela de login restaurada para o padrão!', 'success');
    });
  });
});
