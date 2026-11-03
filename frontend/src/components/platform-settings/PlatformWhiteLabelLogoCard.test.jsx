import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlatformWhiteLabelLogoCard from './PlatformWhiteLabelLogoCard';

describe('PlatformWhiteLabelLogoCard Component', () => {
  const mockAddToast = vi.fn();
  const mockOnLogoUpdated = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-logo-preview-url');
  });

  it('renderiza o card de logotipo exibindo a prévia da logo padrão quando não há customizada', () => {
    render(
      <PlatformWhiteLabelLogoCard
        cardBg="#1e2230"
        cardBorder="1px solid #333"
        textColor="#fff"
        subTextColor="#888"
        addToast={mockAddToast}
        initialLogoUrl={null}
        onLogoUpdated={mockOnLogoUpdated}
      />
    );

    expect(screen.getByText('Logotipo da Plataforma (Barra Lateral / Topo)')).toBeInTheDocument();
    expect(screen.getByTestId('platform-logo-default-preview')).toBeInTheDocument();
    expect(screen.getByText('Logotipo Padrão do Sistema')).toBeInTheDocument();
    expect(screen.getByTestId('select-logo-file-label')).toBeInTheDocument();
  });

  it('exibe o logotipo personalizado ativo quando initialLogoUrl é fornecido', () => {
    render(
      <PlatformWhiteLabelLogoCard
        cardBg="#1e2230"
        cardBorder="1px solid #333"
        textColor="#fff"
        subTextColor="#888"
        addToast={mockAddToast}
        initialLogoUrl="https://cdn.example.com/minha-empresa-logo.png"
        onLogoUpdated={mockOnLogoUpdated}
      />
    );

    expect(screen.getByText('Logotipo Personalizado Ativo')).toBeInTheDocument();
    const img = screen.getByTestId('platform-logo-preview-img');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/minha-empresa-logo.png');
    expect(screen.getByTestId('reset-platform-logo-btn')).toBeInTheDocument();
  });

  it('permite selecionar um arquivo de imagem, exibe preview e realiza o upload com sucesso', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        platform_name: 'Área de Membros',
        logo_url: 'https://cdn.example.com/nova-logo-salva.png',
      }),
    });

    const eventSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <PlatformWhiteLabelLogoCard
        cardBg="#1e2230"
        cardBorder="1px solid #333"
        textColor="#fff"
        subTextColor="#888"
        addToast={mockAddToast}
        initialLogoUrl={null}
        onLogoUpdated={mockOnLogoUpdated}
      />
    );

    const fileInput = screen.getByTestId('platform-logo-file-input');
    const mockFile = new File(['dummy-logo'], 'logo-crassus.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    expect(screen.getByText(/logo-crassus\.png/)).toBeInTheDocument();
    expect(screen.getByText('Pré-visualização (Novo Arquivo)')).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-upload-logo-btn');
    expect(confirmBtn).toBeInTheDocument();

    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/whitelabel/logo',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock_token',
          }),
        })
      );
      expect(localStorage.getItem('platform_logo')).toBe('https://cdn.example.com/nova-logo-salva.png');
      expect(mockAddToast).toHaveBeenCalledWith('Novo logotipo da plataforma salvo com sucesso!', 'success');
      expect(mockOnLogoUpdated).toHaveBeenCalledWith('https://cdn.example.com/nova-logo-salva.png');
      expect(eventSpy).toHaveBeenCalled();
    });
  });

  it('permite restaurar o logotipo para o padrão do sistema', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        platform_name: 'Área de Membros',
        logo_url: null,
      }),
    });

    render(
      <PlatformWhiteLabelLogoCard
        cardBg="#1e2230"
        cardBorder="1px solid #333"
        textColor="#fff"
        subTextColor="#888"
        addToast={mockAddToast}
        initialLogoUrl="https://cdn.example.com/logo-antiga.png"
        onLogoUpdated={mockOnLogoUpdated}
      />
    );

    const resetBtn = screen.getByTestId('reset-platform-logo-btn');
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/whitelabel/logo',
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            Authorization: 'Bearer mock_token',
          }),
        })
      );
      expect(localStorage.getItem('platform_logo')).toBeNull();
      expect(mockAddToast).toHaveBeenCalledWith('Logotipo restaurado para o padrão do sistema!', 'success');
      expect(mockOnLogoUpdated).toHaveBeenCalledWith(null);
    });
  });
});
