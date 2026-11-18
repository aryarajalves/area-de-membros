import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockCapacitor, mockPushNotifications } = vi.hoisted(() => ({
  mockCapacitor: {
    isNativePlatform: vi.fn(),
    getPlatform: vi.fn(),
  },
  mockPushNotifications: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    register: vi.fn(),
    addListener: vi.fn(),
  },
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: mockCapacitor,
}));

vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: mockPushNotifications,
}));

import {
  isNativeApp,
  getNativePlatform,
  initPushNotifications,
  unregisterPushNotifications,
} from './pushNotifications';

describe('pushNotifications service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok', removed: true }),
    });
  });

  it('retorna no-op seguro quando rodando na Web (não nativo)', async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(false);
    mockCapacitor.getPlatform.mockReturnValue('web');

    expect(isNativeApp()).toBe(false);
    expect(getNativePlatform()).toBe('web');

    const cleanup = await initPushNotifications({ authToken: 'jwt-123' });
    expect(typeof cleanup).toBe('function');
    expect(mockPushNotifications.checkPermissions).not.toHaveBeenCalled();
    expect(mockPushNotifications.register).not.toHaveBeenCalled();
  });

  it('solicita permissão, registra FCM e envia token ao backend no ambiente nativo', async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(true);
    mockCapacitor.getPlatform.mockReturnValue('android');
    mockPushNotifications.checkPermissions.mockResolvedValue({ receive: 'prompt' });
    mockPushNotifications.requestPermissions.mockResolvedValue({ receive: 'granted' });
    mockPushNotifications.register.mockResolvedValue();

    const listeners = {};
    const mockRemove = vi.fn();
    mockPushNotifications.addListener.mockImplementation(async (eventName, cb) => {
      listeners[eventName] = cb;
      return { remove: mockRemove };
    });

    const onTap = vi.fn();
    const cleanup = await initPushNotifications({
      authToken: 'jwt-aluno',
      onNotificationTap: onTap,
    });

    expect(mockPushNotifications.requestPermissions).toHaveBeenCalledTimes(1);
    expect(mockPushNotifications.register).toHaveBeenCalledTimes(1);

    await listeners.registration({ value: 'fcm-token-android-999' });
    expect(localStorage.getItem('native_fcm_token')).toBe('fcm-token-android-999');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/push/register',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer jwt-aluno',
        }),
      }),
    );

    listeners.pushNotificationActionPerformed({ notification: { data: { type: 'dm', sender_id: '5' } } });
    expect(onTap).toHaveBeenCalledWith({ type: 'dm', sender_id: '5' });

    cleanup();
    expect(mockRemove).toHaveBeenCalled();
  });

  it('remove o token FCM no backend e limpa localStorage ao deslogar', async () => {
    localStorage.setItem('native_fcm_token', 'fcm-token-para-remover');

    const res = await unregisterPushNotifications('jwt-aluno');
    expect(res).toEqual({ status: 'ok', removed: true });
    expect(localStorage.getItem('native_fcm_token')).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/push/unregister',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
