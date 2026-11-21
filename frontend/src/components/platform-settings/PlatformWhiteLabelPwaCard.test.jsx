import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlatformWhiteLabelPwaCard from './PlatformWhiteLabelPwaCard';

describe('PlatformWhiteLabelPwaCard Component', () => {
  const defaultProps = {
    cardBg: 'rgba(15, 23, 42, 0.7)',
    cardBorder: 'rgba(255, 255, 255, 0.1)',
    textColor: '#f8fafc',
    subTextColor: '#94a3b8',
    addToast: vi.fn(),
    platformName: 'Escola VIP',
    logoUrl: '/logo-padrao.webp',
    initialPwaAppName: '',
    initialPwaIconUrl: null,
    onPwaUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'fake-admin-token');
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-pwa-icon');
  });

  it('salva nome personalizado do App PWA via PATCH /api/v1/whitelabel', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        platform_name: 'Escola VIP',
        pwa_app_name: 'Meu App VIP',
        pwa_icon_url: null,
      }),
    });

    render(<PlatformWhiteLabelPwaCard {...defaultProps} />);

    const input = screen.getByTestId('whitelabel-pwa-name-input');
    fireEvent.change(input, { target: { value: 'Meu App VIP' } });
    fireEvent.click(screen.getByTestId('save-pwa-name-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/whitelabel',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ pwa_app_name: 'Meu App VIP' }),
        })
      );
    });

    expect(defaultProps.addToast).toHaveBeenCalledWith('Nome do App (PWA) atualizado com sucesso!', 'success');
    expect(defaultProps.onPwaUpdated).toHaveBeenCalled();
  });

  it('permite selecionar e enviar novo ícone PWA e restaurar para o padrão', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          platform_name: 'Escola VIP',
          pwa_app_name: 'Meu App VIP',
          pwa_icon_url: 'https://cdn.test/pwa-custom.png',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          platform_name: 'Escola VIP',
          pwa_app_name: 'Meu App VIP',
          pwa_icon_url: null,
        }),
      });

    render(<PlatformWhiteLabelPwaCard {...defaultProps} />);

    const fileInput = screen.getByTestId('whitelabel-pwa-icon-input');
    const file = new File(['dummy'], 'icone-app.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const uploadBtn = screen.getByTestId('upload-pwa-icon-btn');
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/whitelabel/pwa-icon',
        expect.objectContaining({ method: 'POST' })
      );
    });

    expect(defaultProps.addToast).toHaveBeenCalledWith('Ícone do App (PWA) atualizado com sucesso!', 'success');

    const resetBtn = await screen.findByTestId('reset-pwa-icon-btn');
    fireEvent.click(resetBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/whitelabel/pwa-icon',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    expect(defaultProps.addToast).toHaveBeenCalledWith('Ícone do App (PWA) restaurado para o padrão!', 'success');
  });
});
