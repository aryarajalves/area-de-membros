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
});
