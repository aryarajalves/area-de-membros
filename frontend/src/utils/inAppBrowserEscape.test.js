import { describe, it, expect, vi } from 'vitest';
import {
  isInAppBrowser,
  isAndroid,
  buildAndroidChromeIntent,
  checkAndEscapeInAppBrowser
} from './inAppBrowserEscape';

describe('inAppBrowserEscape Utility', () => {
  // Amostras reais de User-Agents
  const INSTAGRAM_ANDROID_UA =
    'Mozilla/5.0 (Linux; Android 14; SM-S918B Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36 Instagram 316.0.0.38.109 Android (34/14; 480dpi; 1080x2340; samsung; SM-S918B; dm3q; qcom; pt_BR; 564993883)';
  const FACEBOOK_ANDROID_UA =
    'Mozilla/5.0 (Linux; Android 13; SM-A536B Build/TP1A.220624.014; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/118.0.5993.80 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/438.0.0.31.116;]';
  const THREADS_ANDROID_UA =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/121.0.6167.143 Mobile Safari/537.36 Barcelona 318.0.0.33.109';
  const CHROME_ANDROID_UA =
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36';
  const CHROME_DESKTOP_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  const INSTAGRAM_IOS_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 316.0.0.38.109 (iPhone15,2; iOS 17_3; pt_BR; pt; scale=3.00; 1179x2556)';

  describe('isInAppBrowser', () => {
    it('detects Instagram on Android and iOS', () => {
      expect(isInAppBrowser(INSTAGRAM_ANDROID_UA)).toBe(true);
      expect(isInAppBrowser(INSTAGRAM_IOS_UA)).toBe(true);
    });

    it('detects Facebook and Threads on Android', () => {
      expect(isInAppBrowser(FACEBOOK_ANDROID_UA)).toBe(true);
      expect(isInAppBrowser(THREADS_ANDROID_UA)).toBe(true);
    });

    it('returns false for standard web browsers', () => {
      expect(isInAppBrowser(CHROME_ANDROID_UA)).toBe(false);
      expect(isInAppBrowser(CHROME_DESKTOP_UA)).toBe(false);
      expect(isInAppBrowser('')).toBe(false);
      expect(isInAppBrowser(null)).toBe(false);
      expect(isInAppBrowser(undefined)).toBe(false);
    });
  });

  describe('isAndroid', () => {
    it('returns true for Android user agents', () => {
      expect(isAndroid(INSTAGRAM_ANDROID_UA)).toBe(true);
      expect(isAndroid(CHROME_ANDROID_UA)).toBe(true);
    });

    it('returns false for non-Android user agents', () => {
      expect(isAndroid(INSTAGRAM_IOS_UA)).toBe(false);
      expect(isAndroid(CHROME_DESKTOP_UA)).toBe(false);
      expect(isAndroid('')).toBe(false);
      expect(isAndroid(null)).toBe(false);
    });
  });

  describe('buildAndroidChromeIntent', () => {
    it('builds valid Android Intent URL for https links', () => {
      const originalUrl = 'https://aulas-crassos-front.aryaraj.shop/dashboard?tab=courses';
      const intentUrl = buildAndroidChromeIntent(originalUrl);

      expect(intentUrl).toContain('intent://aulas-crassos-front.aryaraj.shop/dashboard?tab=courses#Intent;');
      expect(intentUrl).toContain('scheme=https;');
      expect(intentUrl).toContain('package=com.android.chrome;');
      expect(intentUrl).toContain(`S.browser_fallback_url=${encodeURIComponent(originalUrl)}`);
    });

    it('handles URLs without protocol or returns empty string when invalid', () => {
      expect(buildAndroidChromeIntent('')).toBe('');
      expect(buildAndroidChromeIntent(null)).toBe('');
    });
  });

  describe('checkAndEscapeInAppBrowser', () => {
    it('triggers replace with intent URL when inside Instagram on Android', () => {
      const mockReplace = vi.fn();
      const mockLocation = {
        href: 'https://aulas-crassos-front.aryaraj.shop/',
        replace: mockReplace
      };

      const redirected = checkAndEscapeInAppBrowser({
        userAgent: INSTAGRAM_ANDROID_UA,
        location: mockLocation
      });

      expect(redirected).toBe(true);
      expect(mockReplace).toHaveBeenCalledTimes(1);
      const calledUrl = mockReplace.mock.calls[0][0];
      expect(calledUrl).toContain('intent://aulas-crassos-front.aryaraj.shop/#Intent;');
      expect(calledUrl).toContain('package=com.android.chrome;');
    });

    it('does not redirect when running in standard Chrome on Android', () => {
      const mockReplace = vi.fn();
      const mockLocation = {
        href: 'https://aulas-crassos-front.aryaraj.shop/',
        replace: mockReplace
      };

      const redirected = checkAndEscapeInAppBrowser({
        userAgent: CHROME_ANDROID_UA,
        location: mockLocation
      });

      expect(redirected).toBe(false);
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('does not redirect on desktop browsers', () => {
      const mockReplace = vi.fn();
      const mockLocation = {
        href: 'https://aulas-crassos-front.aryaraj.shop/',
        replace: mockReplace
      };

      const redirected = checkAndEscapeInAppBrowser({
        userAgent: CHROME_DESKTOP_UA,
        location: mockLocation
      });

      expect(redirected).toBe(false);
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('does not trigger Android Intent on iOS devices', () => {
      const mockReplace = vi.fn();
      const mockLocation = {
        href: 'https://aulas-crassos-front.aryaraj.shop/',
        replace: mockReplace
      };

      const redirected = checkAndEscapeInAppBrowser({
        userAgent: INSTAGRAM_IOS_UA,
        location: mockLocation
      });

      expect(redirected).toBe(false);
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('handles null location gracefully without throwing', () => {
      const redirected = checkAndEscapeInAppBrowser({
        userAgent: INSTAGRAM_ANDROID_UA,
        location: null
      });

      expect(redirected).toBe(false);
    });
  });
});
