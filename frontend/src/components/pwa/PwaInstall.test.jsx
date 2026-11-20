import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PwaInstallPortal from './PwaInstallPortal';
import Sidebar from '../Sidebar';

const originalUserAgent = navigator.userAgent;
const originalMaxTouchPoints = navigator.maxTouchPoints;
const originalMatchMedia = window.matchMedia;

function setMockDevice({ userAgent, maxTouchPoints = 0, standalone = false }) {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  });
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: maxTouchPoints,
    configurable: true,
  });
  Object.defineProperty(navigator, 'standalone', {
    value: standalone,
    configurable: true,
  });
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query === '(display-mode: standalone)' ? standalone : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('PWA Install (Banner, Sidebar Mobile Button & Instructions Modal)', () => {
  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', { value: originalUserAgent, configurable: true });
    Object.defineProperty(navigator, 'maxTouchPoints', { value: originalMaxTouchPoints, configurable: true });
    Object.defineProperty(navigator, 'standalone', { value: false, configurable: true });
    window.matchMedia = originalMatchMedia;
  });

  it('nunca exibe o banner nem o botão no menu lateral em desktop/PC', () => {
    setMockDevice({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
      maxTouchPoints: 0,
      standalone: false,
    });

    render(
      <>
        <PwaInstallPortal />
        <Sidebar user={{ name: 'Aluno', email: 'a@a.com', role: 'aluno' }} onLogout={vi.fn()} />
      </>
    );

    expect(screen.queryByTestId('pwa-install-banner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-pwa-install-btn')).not.toBeInTheDocument();
  });

  it('não exibe banner nem botão quando o app já está instalado em modo standalone', () => {
    setMockDevice({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
      maxTouchPoints: 5,
      standalone: true,
    });

    render(
      <>
        <PwaInstallPortal />
        <Sidebar user={{ name: 'Aluno', email: 'a@a.com', role: 'aluno' }} onLogout={vi.fn()} />
      </>
    );

    expect(screen.queryByTestId('pwa-install-banner')).not.toBeInTheDocument();
    expect(screen.queryByTestId('sidebar-pwa-install-btn')).not.toBeInTheDocument();
  });

  it('exibe banner no topo no celular, permite dispensar com "Agora não" e mantém botão no menu lateral', () => {
    setMockDevice({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36',
      maxTouchPoints: 5,
      standalone: false,
    });

    render(
      <>
        <PwaInstallPortal />
        <Sidebar user={{ name: 'Aluno', email: 'a@a.com', role: 'aluno' }} onLogout={vi.fn()} />
      </>
    );

    expect(screen.getByTestId('pwa-install-banner')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-pwa-install-btn')).toBeInTheDocument();

    // Dispensa o banner
    fireEvent.click(screen.getByTestId('pwa-banner-dismiss-btn'));
    expect(screen.queryByTestId('pwa-install-banner')).not.toBeInTheDocument();
    expect(localStorage.getItem('pwa_install_banner_dismissed')).toBe('true');

    // Botão no menu lateral continua visível para instalação posterior
    expect(screen.getByTestId('sidebar-pwa-install-btn')).toBeInTheDocument();
  });

  it('aciona prompt nativo no Android quando beforeinstallprompt estiver disponível', async () => {
    setMockDevice({
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari/537.36',
      maxTouchPoints: 5,
      standalone: false,
    });

    render(<PwaInstallPortal />);

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const promptEvent = new Event('beforeinstallprompt');
    promptEvent.prompt = mockPrompt;
    promptEvent.userChoice = Promise.resolve({ outcome: 'accepted' });

    act(() => {
      window.dispatchEvent(promptEvent);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('pwa-banner-install-btn'));
    });

    expect(mockPrompt).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('pwa-instructions-modal')).not.toBeInTheDocument();
  });

  it('abre modal centralizado com instruções de 2 passos no iOS e fecha somente pelo botão', () => {
    setMockDevice({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
      maxTouchPoints: 5,
      standalone: false,
    });

    render(<PwaInstallPortal />);

    fireEvent.click(screen.getByTestId('pwa-banner-install-btn'));

    const modal = screen.getByTestId('pwa-instructions-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByText(/Adicionar à Tela de Início/i)).toBeInTheDocument();

    // Clicar no backdrop NÃO deve fechar o modal
    fireEvent.click(screen.getByTestId('pwa-instructions-backdrop'));
    expect(screen.getByTestId('pwa-instructions-modal')).toBeInTheDocument();

    // Clicar no botão de fechar fecha o modal
    fireEvent.click(screen.getByTestId('pwa-modal-close-btn'));
    expect(screen.queryByTestId('pwa-instructions-modal')).not.toBeInTheDocument();
  });
});
