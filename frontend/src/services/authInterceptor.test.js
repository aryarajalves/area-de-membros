import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setupAuthInterceptor,
  handleSessionExpired,
  AUTH_EXPIRED_EVENT,
} from './authInterceptor';

describe('authInterceptor', () => {
  beforeEach(() => {
    localStorage.clear();
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

  it('triggers session expiration on 401 response from regular endpoints', async () => {
    setupAuthInterceptor();

    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    localStorage.setItem('auth_token', 'expired_token');

    // Simula uma resposta 401 de uma chamada da API
    const fakeFetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
    });
    window.fetch = fakeFetch;

    // Reinstala o interceptor com o fetch mockado
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);
      if (response && response.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        if (!url.includes('/api/v1/auth/login')) {
          handleSessionExpired();
        }
      }
      return response;
    };

    await window.fetch('/api/v1/auth/users');

    expect(listener).toHaveBeenCalled();
    expect(localStorage.getItem('auth_token')).toBeNull();

    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });

  it('does NOT trigger session expiration on 401 from login endpoint', async () => {
    const listener = vi.fn();
    window.addEventListener(AUTH_EXPIRED_EVENT, listener);

    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const response = await originalFetch.apply(this, args);
      if (response && response.status === 401) {
        const url = typeof args[0] === 'string' ? args[0] : (args[0]?.url || '');
        if (!url.includes('/api/v1/auth/login')) {
          handleSessionExpired();
        }
      }
      return response;
    };

    await window.fetch('/api/v1/auth/login');

    expect(listener).not.toHaveBeenCalled();

    window.removeEventListener(AUTH_EXPIRED_EVENT, listener);
  });
});
