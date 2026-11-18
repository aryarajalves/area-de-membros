import { useEffect, useCallback } from 'react';
import { initPushNotifications, unregisterPushNotifications } from '../services/pushNotifications';

export { unregisterPushNotifications };

export function usePushNotifications({ token, setActiveTab }) {
  const handleNotificationTap = useCallback((data) => {
    const targetTab = data?.type === 'dm' ? 'chat' : data?.type === 'community' ? 'introductions' : null;
    if (targetTab && setActiveTab) {
      setActiveTab(targetTab);
      localStorage.setItem('active_tab', targetTab);
    }
  }, [setActiveTab]);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    let cleanupFn = null;

    initPushNotifications({
      authToken: token,
      onNotificationTap: handleNotificationTap,
    }).then((fn) => {
      if (cancelled) {
        fn?.();
      } else {
        cleanupFn = fn;
      }
    });

    return () => {
      cancelled = true;
      cleanupFn?.();
    };
  }, [token, handleNotificationTap]);
}
