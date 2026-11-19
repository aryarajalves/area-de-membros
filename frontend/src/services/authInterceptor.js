/**
 * Utilitário para interceptação de requisições, gerenciamento de expiração de sessão,
 * renovação automática (Sliding Session de 7 dias) e sincronização entre abas.
 */

export const AUTH_EXPIRED_EVENT = 'auth:session_expired';

let lastExpiredEventTime = 0;
const EXPIRED_EVENT_COOLDOWN_MS = 3000;

let lastRefreshAttemptTime = 0;
let isRefreshingToken = false;
const REFRESH_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutos entre renovações
const SLIDING_REFRESH_THRESHOLD_SECONDS = 6 * 24 * 60 * 60; // Renova quando faltar menos de 6 dias (ou tokens antigos de 24h)

/**
 * Decodifica o campo 'exp' (em segundos Unix) de um token JWT sem bibliotecas externas.
 */
export function decodeJwtExpSeconds(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const jsonPayload = atob(padded);
    const parsed = JSON.parse(jsonPayload);
    return typeof parsed?.exp === 'number' ? parsed.exp : null;
  } catch {
    return null;
  }
}

/**
 * Extrai o token Bearer enviado nos cabeçalhos de uma chamada fetch, se presente.
 */
export function extractSentBearerToken(args = []) {
  try {
    const reqOrUrl = args[0];
    const options = args[1] || {};
    const headersSource = options.headers || (reqOrUrl && typeof reqOrUrl === 'object' ? reqOrUrl.headers : null);
    if (!headersSource) return null;

    let authHeader = null;
    if (typeof headersSource.get === 'function') {
      authHeader = headersSource.get('Authorization') || headersSource.get('authorization');
    } else if (Array.isArray(headersSource)) {
      const found = headersSource.find(([k]) => String(k).toLowerCase() === 'authorization');
      authHeader = found ? found[1] : null;
    } else if (typeof headersSource === 'object') {
      authHeader = headersSource.Authorization || headersSource.authorization || null;
    }

    if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.slice(7).trim() || null;
    }
  } catch {
    // Ignora erro de parse de headers
  }
  return null;
}

/**
 * Avalia se um erro 401 deve encerrar a sessão atual.
 */
export function shouldExpireSessionOn401(args = []) {
  let url = '';
  if (typeof args[0] === 'string') {
    url = args[0];
  } else if (args[0] && typeof args[0].url === 'string') {
    url = args[0].url;
  }

  const isPublicAuthEndpoint =
    url.includes('/api/v1/auth/login') ||
    url.includes('/api/v1/auth/register') ||
    url.includes('/api/v1/auth/reset-password');

  if (isPublicAuthEndpoint) {
    return false;
  }

  const currentStoredToken = localStorage.getItem('auth_token');
  if (!currentStoredToken) {
    return false;
  }

  const sentToken = extractSentBearerToken(args);
  if (sentToken && sentToken !== currentStoredToken) {
    return false;
  }

  return true;
}

/**
 * Dispara o evento de expiração de sessão e limpa os dados de autenticação locais.
 */
export function handleSessionExpired() {
  const now = Date.now();
  const isCooldownActive = (now - lastExpiredEventTime) < EXPIRED_EVENT_COOLDOWN_MS;

  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('active_tab');
  localStorage.removeItem('active_subtab_usermanagement');

  if (isCooldownActive) {
    return;
  }
  lastExpiredEventTime = now;

  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
}

let isInterceptorInstalled = false;

/**
 * Reseta o estado interno do interceptor (útil para testes unitários).
 */
export function resetAuthInterceptorState() {
  lastExpiredEventTime = 0;
  lastRefreshAttemptTime = 0;
  isRefreshingToken = false;
  isInterceptorInstalled = false;
}

/**
 * Renova silenciosamente o token JWT em segundo plano (Sliding Session) quando faltar
 * menos de 6 dias para expirar (ou imediatamente para tokens antigos de 24h).
 */
export async function refreshSessionTokenIfNeeded({ onTokenRefreshed, force = false } = {}) {
  if (typeof window === 'undefined' || !window.fetch || isRefreshingToken) return null;

  const currentToken = localStorage.getItem('auth_token');
  if (!currentToken) return null;

  const nowMs = Date.now();
  if (!force && lastRefreshAttemptTime > 0 && (nowMs - lastRefreshAttemptTime) < REFRESH_COOLDOWN_MS) {
    return null;
  }

  const expSeconds = decodeJwtExpSeconds(currentToken);
  if (expSeconds !== null) {
    const remainingSeconds = expSeconds - Math.floor(nowMs / 1000);
    if (remainingSeconds <= 0) return null;
    if (!force && remainingSeconds > SLIDING_REFRESH_THRESHOLD_SECONDS) {
      return null;
    }
  } else if (!force) {
    return null;
  }

  isRefreshingToken = true;
  lastRefreshAttemptTime = nowMs;
  try {
    const res = await window.fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (res && res.ok) {
      const data = await res.json();
      if (data?.access_token) {
        localStorage.setItem('auth_token', data.access_token);
        if (data.user) {
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        }
        if (onTokenRefreshed) {
          onTokenRefreshed(data.access_token, data.user || null);
        }
        return data.access_token;
      }
    }
  } catch {
    // Falha de rede silenciosa: tentará novamente no próximo ciclo
  } finally {
    isRefreshingToken = false;
  }
  return null;
}

/**
 * Instala um interceptor global no window.fetch nativo.
 */
export function setupAuthInterceptor() {
  if (isInterceptorInstalled || typeof window === 'undefined' || !window.fetch) {
    return;
  }

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    if (response && response.status === 401 && shouldExpireSessionOn401(args)) {
      handleSessionExpired();
    }

    return response;
  };

  isInterceptorInstalled = true;
}

/**
 * Sincroniza o token e o usuário entre múltiplas abas do navegador via evento 'storage'
 * e ativa a verificação periódica de renovação automática (Sliding Session de 7 dias).
 */
export function subscribeAuthStorageSync({ onSessionUpdated, onSessionCleared }) {
  if (typeof window === 'undefined') return () => {};

  const handleStorage = (event) => {
    if (event.key === 'auth_token' || event.key === 'auth_user') {
      const latestToken = localStorage.getItem('auth_token');
      const latestUserRaw = localStorage.getItem('auth_user');

      if (!latestToken) {
        if (onSessionCleared) onSessionCleared();
        return;
      }

      let parsedUser = null;
      if (latestUserRaw) {
        try {
          parsedUser = JSON.parse(latestUserRaw);
        } catch {
          // ignore
        }
      }
      if (onSessionUpdated) {
        onSessionUpdated(latestToken, parsedUser);
      }
    }
  };

  window.addEventListener('storage', handleStorage);

  // Dispara verificação inicial de renovação (Sliding Session) e agenda checagem a cada 30 min
  refreshSessionTokenIfNeeded({ onTokenRefreshed: onSessionUpdated });
  const refreshInterval = window.setInterval(() => {
    refreshSessionTokenIfNeeded({ onTokenRefreshed: onSessionUpdated });
  }, 30 * 60 * 1000);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.clearInterval(refreshInterval);
  };
}
