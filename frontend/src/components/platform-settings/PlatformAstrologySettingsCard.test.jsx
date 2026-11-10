import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PlatformAstrologySettingsCard from './PlatformAstrologySettingsCard';

describe('PlatformAstrologySettingsCard Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('não renderiza nada se o usuário não for Super Admin', () => {
    const { container: alunoContainer } = render(
      <PlatformAstrologySettingsCard currentUser={{ role: 'aluno' }} />
    );
    expect(alunoContainer.firstChild).toBeNull();

    const { container: adminContainer } = render(
      <PlatformAstrologySettingsCard currentUser={{ role: 'admin' }} />
    );
    expect(adminContainer.firstChild).toBeNull();
  });

  it('renderiza o switch e informações para Super Admin', () => {
    render(
      <PlatformAstrologySettingsCard
        currentUser={{ role: 'superadmin' }}
        isAstrologyPlatform={false}
      />
    );

    expect(screen.getByTestId('astrology-settings-card')).toBeInTheDocument();
    expect(screen.getByText('Módulo de Astrologia & Signos Zodiacais')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Oculto')).toBeInTheDocument();
  });

  it('permite alternar o switch e chama a API com sucesso', async () => {
    const addToast = vi.fn();
    const onSettingChange = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ is_astrology_platform: true }),
    });

    render(
      <PlatformAstrologySettingsCard
        currentUser={{ role: 'superadmin' }}
        isAstrologyPlatform={false}
        addToast={addToast}
        onSettingChange={onSettingChange}
      />
    );

    const switchBtn = screen.getByTestId('toggle-astrology-platform-btn');
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/whitelabel', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ is_astrology_platform: true }),
      }));
      expect(onSettingChange).toHaveBeenCalledWith(true);
      expect(addToast).toHaveBeenCalledWith(expect.stringContaining('ativado com sucesso'), 'success');
    });
  });
});
