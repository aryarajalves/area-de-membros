import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const NATIVE_FCM_TOKEN_KEY = 'native_fcm_token';
const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || '';

export function isNativeApp() {
  try {
    return Boolean(Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function getNativePlatform() {
  try {
    return Capacitor?.getPlatform?.() || 'web';
  } catch {
    return 'web';
  }
}

export async function registerPushTokenOnBackend(authToken, fcmToken, platform = getNativePlatform()) {
  if (!authToken || !fcmToken) return null;
  const response = await fetch(`${API_BASE}/api/v1/push/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      fcm_token: fcmToken,
      platform,
    }),
  });
  if (!response.ok) {
    throw new Error('Falha ao registrar token FCM no backend.');
  }
  return response.json();
}

export async function unregisterPushNotifications(authToken) {
  const fcmToken = localStorage.getItem(NATIVE_FCM_TOKEN_KEY);
  if (!fcmToken) return { removed: false };

  localStorage.removeItem(NATIVE_FCM_TOKEN_KEY);
  if (!authToken) return { removed: false };

  try {
    const response = await fetch(`${API_BASE}/api/v1/push/unregister`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ fcm_token: fcmToken }),
    });
    if (!response.ok) return { removed: false };
    return await response.json();
  } catch {
    return { removed: false };
  }
}

export async function initPushNotifications({
  authToken,
  onForegroundNotification,
  onNotificationTap,
} = {}) {
  if (!authToken || !isNativeApp()) {
    return () => {};
  }

  let permission = await PushNotifications.checkPermissions();
  if (permission?.receive === 'prompt') {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission?.receive !== 'granted') {
    return () => {};
  }

  const handles = [];

  handles.push(
    await PushNotifications.addListener('registration', async (tokenData) => {
      const fcmToken = tokenData?.value;
      if (!fcmToken) return;
      localStorage.setItem(NATIVE_FCM_TOKEN_KEY, fcmToken);
      try {
        await registerPushTokenOnBackend(authToken, fcmToken, getNativePlatform());
      } catch {
        // Silencioso para não bloquear a inicialização do app
      }
    }),
  );

  handles.push(
    await PushNotifications.addListener('registrationError', () => {
      // Falha de registro FCM tratada sem impactar navegação
    }),
  );

  if (onForegroundNotification) {
    handles.push(
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        onForegroundNotification(notification);
      }),
    );
  }

  if (onNotificationTap) {
    handles.push(
      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        onNotificationTap(action?.notification?.data || {});
      }),
    );
  }

  await PushNotifications.register();

  return () => {
    handles.forEach((handle) => {
      try {
        handle?.remove?.();
      } catch {
        // ignore cleanup error
      }
    });
  };
}
