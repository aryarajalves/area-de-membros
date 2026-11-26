import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as Sentry from '@sentry/react';
import {
  initFrontendSentry,
  setSentryUser,
  captureVideoIssueInSentry,
  isSentryInitialized,
  _resetSentryForTests,
} from './sentryService';

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  setUser: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
  replayIntegration: vi.fn(() => ({ name: 'Replay' })),
  withScope: vi.fn((cb) => cb({
    setLevel: vi.fn(),
    setTag: vi.fn(),
    setExtras: vi.fn(),
  })),
  captureMessage: vi.fn(),
}));

describe('sentryService', () => {
  beforeEach(() => {
    _resetSentryForTests();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('não inicializa quando sentry-config retorna enabled=false', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ enabled: false, dsn: '' }),
    });

    const result = await initFrontendSentry();
    expect(result).toBe(false);
    expect(isSentryInitialized()).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('inicializa com túnel anti-firewall e replay quando habilitado', async () => {
    localStorage.setItem('auth_user', JSON.stringify({ id: 7, name: 'Maria', email: 'maria@teste.com', role: 'aluno' }));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        dsn: 'https://frontkey@o1.ingest.sentry.io/12345',
        environment: 'production',
        tunnel: '/api/v1/logs/sentry-tunnel',
        traces_sample_rate: 0.2,
        replays_session_sample_rate: 0.05,
        replays_on_error_sample_rate: 1.0,
      }),
    });

    const result = await initFrontendSentry();
    expect(result).toBe(true);
    expect(isSentryInitialized()).toBe(true);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://frontkey@o1.ingest.sentry.io/12345',
        tunnel: '/api/v1/logs/sentry-tunnel',
        replaysOnErrorSampleRate: 1.0,
      })
    );
    expect(Sentry.setUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '7',
        email: 'maria@teste.com',
        username: 'Maria',
      })
    );

    // Limpa usuário no logout
    setSentryUser(null);
    expect(Sentry.setUser).toHaveBeenCalledWith(null);
  });

  it('captura falhas e travamentos do player de vídeo no Sentry quando inicializado', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        enabled: true,
        dsn: 'https://frontkey@o1.ingest.sentry.io/12345',
      }),
    });

    await initFrontendSentry();

    captureVideoIssueInSentry({
      eventType: 'BUFFERING_STALL_8S',
      title: 'Aula 01 - Astrologia',
      src: 'https://cdn.aryaraj.shop/aula01.mp4',
      readyState: 1,
      networkState: 2,
    });

    expect(Sentry.withScope).toHaveBeenCalled();
    expect(Sentry.captureMessage).toHaveBeenCalledWith('[VIDEO PLAYER] BUFFERING_STALL_8S: Aula 01 - Astrologia');
  });
});
