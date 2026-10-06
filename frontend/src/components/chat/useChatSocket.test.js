import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useChatSocket } from './useChatSocket';

describe('useChatSocket Hook', () => {
  let mockSocket;

  beforeEach(() => {
    localStorage.setItem('auth_token', 'fake_jwt_token_123');

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

  it('connects to websocket with auth token and sets isConnected', () => {
    const onNewMessage = vi.fn();
    const { result } = renderHook(() =>
      useChatSocket({
        currentUser: { id: 1, name: 'Aluno' },
        selectedChannel: { id: 'general', type: 'general' },
        onNewMessage,
      })
    );

    expect(mockSocket.url).toContain('/api/v1/chat/ws?token=fake_jwt_token_123');

    act(() => {
      if (mockSocket.onopen) mockSocket.onopen();
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('dispatches onNewMessage when receiving new_message event for current channel', () => {
    const onNewMessage = vi.fn();
    const onChannelActivity = vi.fn();

    renderHook(() =>
      useChatSocket({
        currentUser: { id: 1, name: 'Aluno' },
        selectedChannel: { id: 'general', type: 'general' },
        onNewMessage,
        onChannelActivity,
      })
    );

    act(() => {
      if (mockSocket.onopen) mockSocket.onopen();
    });

    const newMsgPayload = {
      type: 'new_message',
      channel_type: 'general',
      course_id: null,
      data: {
        id: 101,
        message: 'Mensagem recebida em tempo real!',
        user: { id: 2, name: 'Colega' },
      },
    };

    act(() => {
      if (mockSocket.onmessage) {
        mockSocket.onmessage({ data: JSON.stringify(newMsgPayload) });
      }
    });

    expect(onNewMessage).toHaveBeenCalledWith(newMsgPayload.data);
    expect(onChannelActivity).toHaveBeenCalledWith('general', null, newMsgPayload.data);
  });

  it('dispatches onMessageDeleted when message is removed', () => {
    const onMessageDeleted = vi.fn();

    renderHook(() =>
      useChatSocket({
        currentUser: { id: 1 },
        selectedChannel: { id: 'general', type: 'general' },
        onMessageDeleted,
      })
    );

    act(() => {
      if (mockSocket.onopen) mockSocket.onopen();
    });

    act(() => {
      if (mockSocket.onmessage) {
        mockSocket.onmessage({
          data: JSON.stringify({
            type: 'message_deleted',
            channel_type: 'general',
            data: { message_id: 88 },
          }),
        });
      }
    });

    expect(onMessageDeleted).toHaveBeenCalledWith(88);
  });

  it('dispatches onMessageLiked when message is liked', () => {
    const onMessageLiked = vi.fn();

    renderHook(() =>
      useChatSocket({
        currentUser: { id: 1 },
        selectedChannel: { id: 'general', type: 'general' },
        onMessageLiked,
      })
    );

    act(() => {
      if (mockSocket.onopen) mockSocket.onopen();
    });

    const likeData = { message_id: 55, likes_count: 3, user_id: 2, liked: true };

    act(() => {
      if (mockSocket.onmessage) {
        mockSocket.onmessage({
          data: JSON.stringify({
            type: 'message_liked',
            channel_type: 'general',
            data: likeData,
          }),
        });
      }
    });

    expect(onMessageLiked).toHaveBeenCalledWith(likeData, { id: 1 });
  });
});
