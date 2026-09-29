/**
 * Utilitário para interceptação de requisições e gerenciamento de expiração de sessão.
 */

export const AUTH_EXPIRED_EVENT = 'auth:session_expired';

/**
 * Dispara o evento de expiração de sessão e limpa os dados de autenticação locais.
 */
export function handleSessionExpired() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  localStorage.removeItem('active_tab');
  localStorage.removeItem('active_subtab_usermanagement');
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
}

let isInterceptorInstalled = false;

/**
 * Instala um interceptor global no window.fetch nativo.
 * Se qualquer chamada para a API retornar 401 Unauthorized (exceto rotas públicas de login/validação),
 * encerra a sessão imediatamente disparando o evento global de logout.
 */
export function setupAuthInterceptor() {
  if (isInterceptorInstalled || typeof window === 'undefined' || !window.fetch) {
    return;
  }

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    if (response && response.status === 401) {
      let url = '';
      if (typeof args[0] === 'string') {
        url = args[0];
      } else if (args[0] && typeof args[0].url === 'string') {
        url = args[0].url;
      }

      // Não deslogar se o 401 vier da própria tentativa de login com credenciais erradas
      const isLoginEndpoint = url.includes('/api/v1/auth/login');

      if (!isLoginEndpoint) {
        handleSessionExpired();
      }
    }

    return response;
  };

  isInterceptorInstalled = true;
}
