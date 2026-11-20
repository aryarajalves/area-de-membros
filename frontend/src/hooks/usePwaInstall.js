import { useState, useEffect, useCallback } from 'react';
import { isMobileOrTabletDevice, isIosDevice, isStandaloneApp } from '../utils/pwaDeviceUtils';

const BANNER_DISMISSED_KEY = 'pwa_install_banner_dismissed';

export function usePwaInstall() {
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() => isMobileOrTabletDevice());
  const [isStandalone, setIsStandalone] = useState(() => isStandaloneApp());
  const [isIos, setIsIos] = useState(() => isIosDevice());
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => {
    try {
      return localStorage.getItem(BANNER_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);

  useEffect(() => {
    setIsMobileOrTablet(isMobileOrTabletDevice());
    setIsStandalone(isStandaloneApp());
    setIsIos(isIosDevice());

    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setShowInstructionsModal(false);
    };

    const handleResize = () => {
      setIsMobileOrTablet(isMobileOrTabletDevice());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const canShowBanner = isMobileOrTablet && !isStandalone && !isBannerDismissed;
  const canShowSidebarButton = isMobileOrTablet && !isStandalone;

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    } catch {
      // Ignora erro de storage
    }
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (deferredPrompt && typeof deferredPrompt.prompt === 'function') {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === 'accepted') {
          setIsStandalone(true);
        }
      } catch {
        setShowInstructionsModal(true);
      } finally {
        setDeferredPrompt(null);
      }
      return;
    }

    setShowInstructionsModal(true);
  }, [deferredPrompt]);

  const closeInstructionsModal = useCallback(() => {
    setShowInstructionsModal(false);
  }, []);

  return {
    isMobileOrTablet,
    isStandalone,
    isIos,
    hasNativePrompt: Boolean(deferredPrompt),
    canShowBanner,
    canShowSidebarButton,
    showInstructionsModal,
    handleInstallClick,
    dismissBanner,
    closeInstructionsModal,
  };
}

export default usePwaInstall;
