import { describe, it, expect } from 'vitest';
import { isMobileOrTabletDevice, isIosDevice, isStandaloneApp, syncPwaWhiteLabelMeta } from './pwaDeviceUtils';

describe('pwaDeviceUtils', () => {
  it('identifica celulares e tablets corretamente (Android, iPhone, iPad, iPadOS)', () => {
    expect(
      isMobileOrTabletDevice({
        userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Mobile Safari/537.36',
        maxTouchPoints: 5,
      })
    ).toBe(true);

    expect(
      isMobileOrTabletDevice({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
        maxTouchPoints: 5,
      })
    ).toBe(true);

    expect(
      isMobileOrTabletDevice({
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
        maxTouchPoints: 5,
      })
    ).toBe(true);

    // iPadOS que se identifica como Macintosh com maxTouchPoints > 1
    expect(
      isMobileOrTabletDevice({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
        maxTouchPoints: 5,
      })
    ).toBe(true);
  });

  it('retorna false para navegadores desktop/notebook (Windows, Mac, Linux)', () => {
    expect(
      isMobileOrTabletDevice({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        maxTouchPoints: 0,
      })
    ).toBe(false);

    expect(
      isMobileOrTabletDevice({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0',
        maxTouchPoints: 0,
      })
    ).toBe(false);

    expect(
      isMobileOrTabletDevice({
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0',
        maxTouchPoints: 0,
      })
    ).toBe(false);
  });

  it('identifica dispositivos iOS e iPadOS corretamente via isIosDevice', () => {
    expect(isIosDevice({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)', maxTouchPoints: 5 })).toBe(true);
    expect(isIosDevice({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', maxTouchPoints: 5 })).toBe(true);
    expect(isIosDevice({ userAgent: 'Mozilla/5.0 (Linux; Android 14)', maxTouchPoints: 5 })).toBe(false);
  });

  it('detecta modo standalone instalado (display-mode: standalone ou navigator.standalone)', () => {
    expect(
      isStandaloneApp({
        matchMedia: () => ({ matches: true }),
        navigator: {},
        document: { referrer: '' },
      })
    ).toBe(true);

    expect(
      isStandaloneApp({
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: true },
        document: { referrer: '' },
      })
    ).toBe(true);

    expect(
      isStandaloneApp({
        matchMedia: () => ({ matches: false }),
        navigator: { standalone: false },
        document: { referrer: '' },
      })
    ).toBe(false);
  });

  it('permite pré-visualizar em localhost quando largura for <= 768px, mas bloqueia em domínio real no PC', () => {
    const winNav = { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', maxTouchPoints: 0 };

    expect(
      isMobileOrTabletDevice(winNav, { location: { hostname: 'localhost' }, innerWidth: 390 })
    ).toBe(true);

    expect(
      isMobileOrTabletDevice(winNav, { location: { hostname: 'localhost' }, innerWidth: 1280 })
    ).toBe(false);

    expect(
      isMobileOrTabletDevice(winNav, { location: { hostname: 'alunos.minhaescola.com' }, innerWidth: 390 })
    ).toBe(false);
  });

  it('sincroniza metadados PWA (título, cor e apple-touch-icon) com WhiteLabel', () => {
    const titleMeta = document.createElement('meta');
    titleMeta.setAttribute('name', 'apple-mobile-web-app-title');
    const themeMeta = document.createElement('meta');
    themeMeta.setAttribute('name', 'theme-color');
    const appleIcon = document.createElement('link');
    appleIcon.setAttribute('rel', 'apple-touch-icon');
    document.head.append(titleMeta, themeMeta, appleIcon);

    syncPwaWhiteLabelMeta(
      { platformName: 'Escola Alpha', logoUrl: 'https://cdn.test/logo.webp', bgColor: '#112233' },
      document
    );

    expect(titleMeta.getAttribute('content')).toBe('Escola Alpha');
    expect(themeMeta.getAttribute('content')).toBe('#112233');
    expect(appleIcon.getAttribute('href')).toBe('https://cdn.test/logo.webp');

    titleMeta.remove();
    themeMeta.remove();
    appleIcon.remove();
  });
});
