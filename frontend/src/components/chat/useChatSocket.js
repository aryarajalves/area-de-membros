import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook customizado para gerenciar a conexão WebSocket do Chat em tempo real.
 * Escuta eventos de novas mensagens, curtidas, mensagens fixadas e exclusões.
 */
export function useChatSocket({
  currentUser,
  selectedChannel,
  onNewMessage,
  onMessageDeleted,
  onMessageLiked,
  onMessagePinned,
  onChannelActivity,
}) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const selectedChannelRef = useRef(selectedChannel);
  selectedChannelRef.current = selectedChannel;

  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const callbacksRef = useRef({
    onNewMessage,
    onMessageDeleted,
    onMessageLiked,
    onMessagePinned,
    onChannelActivity,
  });

  callbacksRef.current = {
    onNewMessage,
    onMessageDeleted,
    onMessageLiked,
    onMessagePinned,
    onChannelActivity,
  };

  const connect = useCallback(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) return;

    try {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/v1/chat/ws?token=${encodeURIComponent(token)}`;

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMountedRef.current) return;
        setIsConnected(true);

        // Heartbeat ping a cada 25 segundos
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 25000);
      };

      socket.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const payload = JSON.parse(event.data);
          const { type, data, channel_type, course_id } = payload;

          if (type === 'pong') return;

          const currentChan = selectedChannelRef.current;
          const isCurrentChan =
            currentChan &&
            ((channel_type === 'general' && currentChan.type === 'general') ||
              (channel_type === 'course' && currentChan.type === 'course' && Number(course_id) === Number(currentChan.course_id)));

          if (type === 'new_message' && data) {
            // Se for do canal selecionado, adiciona à lista
            if (isCurrentChan && callbacksRef.current.onNewMessage) {
              callbacksRef.current.onNewMessage(data);
            }
            // Atualiza resumo do canal na barra lateral de canais
            if (callbacksRef.current.onChannelActivity) {
              callbacksRef.current.onChannelActivity(channel_type, course_id, data);
            }
            // Notifica TopNavbar e Sidebar globalmente em tempo real
            window.dispatchEvent(new CustomEvent('chat_unread_updated'));
            window.dispatchEvent(new CustomEvent('notifications_updated'));
            window.dispatchEvent(new CustomEvent('dm_updated'));
          } else if (type === 'message_deleted' && data?.message_id) {
            if (isCurrentChan && callbacksRef.current.onMessageDeleted) {
              callbacksRef.current.onMessageDeleted(data.message_id);
            }
          } else if (type === 'message_liked' && data?.message_id) {
            if (isCurrentChan && callbacksRef.current.onMessageLiked) {
              callbacksRef.current.onMessageLiked(data, currentUserRef.current);
            }
          } else if (type === 'message_pinned' && data) {
            if (isCurrentChan && callbacksRef.current.onMessagePinned) {
              callbacksRef.current.onMessagePinned(data);
            }
          } else if (type === 'new_dm' || type === 'dm_read') {
            window.dispatchEvent(new CustomEvent('dm_updated'));
          } else if (type === 'new_notification' || type === 'notifications_updated') {
            window.dispatchEvent(new CustomEvent('notifications_updated'));
          } else if (type === 'favorites_updated') {
            window.dispatchEvent(new CustomEvent('favorites_updated'));
          }
        } catch {

          // ignore non-json messages
        }
      };

      socket.onclose = () => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // Tenta reconectar após 4 segundos se o componente ainda estiver ativo
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            connect();
          }
        }, 4000);
      };

      socket.onerror = () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch {
      // Falha ao abrir websocket
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [connect]);

  return { isConnected };
}
