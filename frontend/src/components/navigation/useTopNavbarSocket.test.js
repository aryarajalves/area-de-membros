import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTopNavbarSocket } from './useTopNavbarSocket';

describe('useTopNavbarSocket Hook', () => {
  let mockSocket;

  beforeEach(() => {
    localStorage.setItem('auth_token', 'fake_jwt_token_topnavbar');

    class MockWebSocket {
      constructor(url) {
        this.url = url;
        this.readyState = 1;
        this.send = vi.fn();
        this.close = vi.fn();
        this.onopen = null;
        this.onmessage = null;
        this.onclose = null;
        this.onerror = null;
        mockSocket = this;
      }
    }
    MockWebSocket.OPEN = 1;
    MockWebSocket.CONNECTING = 0;
    global.WebSocket = MockWebSocket;
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('connects to websocket with auth token in URL', () => {
    const onFavoritesUpdated = vi.fn();
    const onDmUpdated = vi.fn();
    const onNotificationsUpdated = vi.fn();

    renderHook(() =>
      useTopNavbarSocket({
        user: { id: 10, name: 'Aryaraj Alves' },
        onFavoritesUpdated,
        onDmUpdated,
        onNotificationsUpdated,
      })
    );

    expect(mockSocket).toBeDefined();
    expect(mockSocket.url).toContain('/api/v1/chat/ws?token=fake_jwt_token_topnavbar');
  });

  it('triggers onFavoritesUpdated when receiving favorites_updated event', () => {
    const onFavoritesUpdated = vi.fn();
    const windowDispatcher = vi.spyOn(window, 'dispatchEvent');

    renderHook(() =>
      useTopNavbarSocket({
        user: { id: 10, name: 'Aryaraj Alves' },
        onFavoritesUpdated,
        onDmUpdated: vi.fn(),
        onNotificationsUpdated: vi.fn(),
      })
    );

    act(() => {
      if (mockSocket.onmessage) {
        mockSocket.onmessage({
          data: JSON.stringify({
            type: 'favorites_updated',
            data: { user_id: 10 },
          }),
        });
      }
    });

    expect(onFavoritesUpdated).toHaveBeenCalledTimes(1);
    expect(windowDispatcher).toHaveBeenCalled();
  });

  it('triggers onDmUpdated when receiving new_dm event for current user', () => {
    const onDmUpdated = vi.fn();

    renderHook(() =>
      useTopNavbarSocket({
        user: { id: 10, name: 'Aryaraj Alves' },
        onFavoritesUpdated: vi.fn(),
        onDmUpdated,
        onNotificationsUpdated: vi.fn(),
      })
    );

    act(() => {
      if (mockSocket.onmessage) {
        mockSocket.onmessage({
          data: JSON.stringify({
            type: 'new_dm',
            data: { recipient_id: 10, sender_id: 5, message_id: 99 },
          }),
        });
      }
    });

    expect(onDmUpdated).toHaveBeenCalledTimes(1);
  });

  it('triggers onNotificationsUpdated when receiving new_notification event', () => {
    const onNotificationsUpdated = vi.fn();

    renderHook(() =>
      useTopNavbarSocket({
        user: { id: 10, name: 'Aryaraj Alves' },
        onFavoritesUpdated: vi.fn(),
        onDmUpdated: vi.fn(),
        onNotificationsUpdated,
      })
    );

    act(() => {
      if (mockSocket.onmessage) {
        mockSocket.onmessage({
          data: JSON.stringify({
            type: 'new_notification',
            data: { user_id: 10, type: 'mention', message_id: 123 },
          }),
        });
      }
    });

    expect(onNotificationsUpdated).toHaveBeenCalledTimes(1);
  });

  it('triggers onNotificationsUpdated when a new message mentions user name', () => {
    const onNotificationsUpdated = vi.fn();

    renderHook(() =>
      useTopNavbarSocket({
        user: { id: 10, name: 'Aryaraj Alves' },
        onFavoritesUpdated: vi.fn(),
        onDmUpdated: vi.fn(),
        onNotificationsUpdated,
      })
    );

    act(() => {
      if (mockSocket.onmessage) {
        mockSocket.onmessage({
          data: JSON.stringify({
            type: 'new_message',
            channel_type: 'general',
            data: { id: 50, message: 'Olá @Aryaraj veja isso aqui!' },
          }),
        });
      }
    });

    expect(onNotificationsUpdated).toHaveBeenCalledTimes(1);
  });

  it('closes socket on unmount', () => {
    const { unmount } = renderHook(() =>
      useTopNavbarSocket({
        user: { id: 10, name: 'Aryaraj Alves' },
        onFavoritesUpdated: vi.fn(),
        onDmUpdated: vi.fn(),
        onNotificationsUpdated: vi.fn(),
      })
    );

    act(() => {
      unmount();
    });

    expect(mockSocket.close).toHaveBeenCalled();
  });
});
