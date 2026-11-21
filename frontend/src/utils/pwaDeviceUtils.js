/**
 * Utilitários para detecção de dispositivos móveis/tablets e modo standalone (PWA instalado).
 */

export function isMobileOrTabletDevice(
  nav = typeof window !== 'undefined' ? window.navigator : null,
  win = typeof window !== 'undefined' ? window : null
) {
  if (!nav) return false;

  const ua = String(nav.userAgent || '').toLowerCase();
  const maxTouchPoints = Number(nav.maxTouchPoints || 0);

  // Celulares e tablets explícitos (Android, iPhone, iPad, iPod, etc.)
  if (/android|iphone|ipod|ipad|iemobile|opera mini|blackberry|webos|silk|kindle|playbook/.test(ua)) {
    return true;
  }

  // iPadOS moderno que se identifica como Macintosh no Safari, mas possui múltiplas pontas de toque
  if (/macintosh/.test(ua) && maxTouchPoints > 1) {
    return true;
  }

  // Em localhost, permite pré-visualizar no modo responsivo do navegador em largura mobile/tablet
  const hostname = String(win?.location?.hostname || '').toLowerCase();
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  if (isLocal && Number(win?.innerWidth || 0) > 0 && Number(win.innerWidth) <= 768) {
    return true;
  }

  return false;
}

export function isIosDevice(nav = typeof window !== 'undefined' ? window.navigator : null) {
  if (!nav) return false;

  const ua = String(nav.userAgent || '').toLowerCase();
  const maxTouchPoints = Number(nav.maxTouchPoints || 0);

  if (/iphone|ipod|ipad/.test(ua)) {
    return true;
  }

  if (/macintosh/.test(ua) && maxTouchPoints > 1) {
    return true;
  }

  return false;
}

export function isStandaloneApp(win = typeof window !== 'undefined' ? window : null) {
  if (!win) return false;

  try {
    if (typeof win.matchMedia === 'function' && win.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
  } catch {
    // Ignora falha de matchMedia em ambientes parciais
  }

  if (win.navigator?.standalone === true) {
    return true;
  }

  if (typeof win.document?.referrer === 'string' && win.document.referrer.includes('android-app://')) {
    return true;
  }

  return false;
}

export function syncPwaWhiteLabelMeta(
  { platformName, pwaAppName, logoUrl, pwaIconUrl, bgColor } = {},
  doc = typeof document !== 'undefined' ? document : null
) {
  if (!doc) return;

  const effectiveTitle = (pwaAppName || platformName || '').trim();
  if (effectiveTitle) {
    const titleMeta = doc.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (titleMeta) titleMeta.setAttribute('content', effectiveTitle);
  }

  if (bgColor) {
    const themeMeta = doc.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', bgColor);
  }

  if (pwaIconUrl !== undefined || logoUrl !== undefined) {
    const effectiveIcon = pwaIconUrl || logoUrl || '/apple-touch-icon.png';
    const appleIcon = doc.querySelector('link[rel="apple-touch-icon"]');
    if (appleIcon) appleIcon.setAttribute('href', effectiveIcon);
  }
}
