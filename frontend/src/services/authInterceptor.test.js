import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setupAuthInterceptor,
  handleSessionExpired,
  resetAuthInterceptorState,
  shouldExpireSessionOn401,
  subscribeAuthStorageSync,
  refreshSessionTokenIfNeeded,
  AUTH_EXPIRED_EVENT,
} from './authInterceptor';

describe('authInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
    resetAuthInterceptorState();
    vi.restoreAllMocks();
  });

  it('handleSessionExpired cleans localStorage and dispatches event', () => {
    localStorage.setItem('auth_token', 'test_token');
    localStorage.setItem('auth_user', JSON.stringify({ name: 'Admin' }));
    localStorage.setItem('active_tab', 'users');
    localStorage.setItem('active_subtab_usermanagement', 'invites');

    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    handleSessionExpired();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(localStorage.getItem('active_tab')).toBeNull();
    expect(localStorage.getItem('active_subtab_usermanagement')).toBeNull();
    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });

  it('triggers session expiration on 401 response when sent token matches current localStorage token', async () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    localStorage.setItem('auth_token', 'active_token_123');

    window.fetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    });
    setupAuthInterceptor();

    await window.fetch('/api/v1/auth/users', {
      headers: { Authorization: 'Bearer active_token_123' },
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('auth_token')).toBeNull();

    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });

  it('does NOT expire session if 401 came from a stale token while localStorage has a newer token', async () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    localStorage.setItem('auth_token', 'newer_valid_token');

    window.fetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    });
    setupAuthInterceptor();

    await window.fetch('/api/v1/chat/unread-summary', {
      headers: { Authorization: 'Bearer old_stale_token' },
    });

    expect(shouldExpireSessionOn401(['/api/v1/chat/unread-summary', { headers: { Authorization: 'Bearer old_stale_token' } }])).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    expect(localStorage.getItem('auth_token')).toBe('newer_valid_token');

    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });

  it('does NOT trigger session expiration on 401 from login endpoint', async () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    localStorage.setItem('auth_token', 'some_token');
    window.fetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    });
    setupAuthInterceptor();

    await window.fetch('/api/v1/auth/login');

    expect(listener).not.toHaveBeenCalled();

    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });

  it('ignores multiple rapid calls within cooldown period and only dispatches event once', () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    localStorage.setItem('auth_token', 'test_token');

    handleSessionExpired();
    handleSessionExpired();
    handleSessionExpired();
    handleSessionExpired();
    handleSessionExpired();

    expect(listener).toHaveBeenCalledTimes(1);

    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });

  it('synchronizes token and user across tabs via subscribeAuthStorageSync', () => {
    const onSessionUpdated = vi.fn();
    const onSessionCleared = vi.fn();

    const unsubscribe = subscribeAuthStorageSync({
      onSessionUpdated,
      onSessionCleared,
    });

    localStorage.setItem('auth_token', 'synced_token_99');
    localStorage.setItem('auth_user', JSON.stringify({ id: 7, name: 'Aluno Sync', role: 'aluno' }));

    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: 'synced_token_99' }));
    expect(onSessionUpdated).toHaveBeenCalledWith('synced_token_99', { id: 7, name: 'Aluno Sync', role: 'aluno' });

    localStorage.removeItem('auth_token');
    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_token', newValue: null }));
    expect(onSessionCleared).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('automatically refreshes token via /api/v1/auth/refresh when remaining lifetime is below threshold', async () => {
    const expIn12Hours = Math.floor(Date.now() / 1000) + 12 * 3600;
    const payloadB64 = btoa(JSON.stringify({ sub: '1', exp: expIn12Hours }));
    const oldToken = `eyJhbGciOiJIUzI1NiJ9.${payloadB64}.sig`;

    localStorage.setItem('auth_token', oldToken);
    window.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        access_token: 'renewed_7d_token',
        user: { id: 1, name: 'Aluno Renovado', role: 'aluno' },
      }),
    });

    const onTokenRefreshed = vi.fn();
    const newToken = await refreshSessionTokenIfNeeded({ onTokenRefreshed });

    expect(newToken).toBe('renewed_7d_token');
    expect(localStorage.getItem('auth_token')).toBe('renewed_7d_token');
    expect(onTokenRefreshed).toHaveBeenCalledWith('renewed_7d_token', {
      id: 1,
      name: 'Aluno Renovado',
      role: 'aluno',
    });
  });
});
