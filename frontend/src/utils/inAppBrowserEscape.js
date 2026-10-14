/**
 * Utilitário para detecção e redirecionamento de navegadores embutidos (In-App Browsers)
 * como Instagram, Facebook, Messenger e Threads no Android.
 *
 * Força a abertura no Google Chrome nativo do celular, eliminando a barra superior
 * com botão "X" e garantindo suporte completo a reprodução de mídias e downloads.
 */

/**
 * Verifica se a string do User-Agent corresponde a um navegador embutido de rede social.
 *
 * @param {string} userAgent
 * @returns {boolean}
 */
export function isInAppBrowser(userAgent = '') {
  if (!userAgent || typeof userAgent !== 'string') return false;
  // Instagram, Facebook App (FBAN/FBAV), Threads (Barcelona) e Messenger (FB_IAB)
  return /Instagram|FBAN|FBAV|Barcelona|FB_IAB/i.test(userAgent);
}

/**
 * Verifica se o dispositivo é baseado no sistema operacional Android.
 *
 * @param {string} userAgent
 * @returns {boolean}
 */
export function isAndroid(userAgent = '') {
  if (!userAgent || typeof userAgent !== 'string') return false;
  return /Android/i.test(userAgent);
}

/**
 * Constrói a URL no formato Android Intent para forçar a abertura no Google Chrome.
 *
 * @param {string} fullUrl - URL completa da página atual (ex: https://dominio.com/rota)
 * @returns {string} URL Intent formatada para o Android
 */
export function buildAndroidChromeIntent(fullUrl = '') {
  if (!fullUrl || typeof fullUrl !== 'string') return '';
  const cleanUrl = fullUrl.replace(/^https?:\/\//i, '');
  return `intent://${cleanUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(fullUrl)};end`;
}

/**
 * Executa a verificação e, se detectado In-App Browser no Android, redireciona para o Chrome externo.
 *
 * @param {Object} [deps] - Dependências injetadas para testes ou runtime
 * @param {string} [deps.userAgent] - String do User-Agent (default: navigator.userAgent)
 * @param {Location|Object} [deps.location] - Objeto window.location (default: window.location)
 * @returns {boolean} True se o redirecionamento foi acionado, False caso contrário
 */
export function checkAndEscapeInAppBrowser(deps = {}) {
  try {
    const userAgent = 'userAgent' in deps ? deps.userAgent : (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    const loc = 'location' in deps ? deps.location : (typeof window !== 'undefined' ? window.location : null);

    if (!loc || !loc.href) return false;

    // Se estiver em Android e dentro do In-App Browser do Instagram/Facebook
    if (isAndroid(userAgent) && isInAppBrowser(userAgent)) {
      const intentUrl = buildAndroidChromeIntent(loc.href);
      if (typeof loc.replace === 'function') {
        loc.replace(intentUrl);
      } else {
        loc.href = intentUrl;
      }
      return true;
    }

    return false;
  } catch {
    return false;
  }
}
