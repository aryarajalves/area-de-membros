import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook dedicado para manter a conexão WebSocket do TopNavbar ativa globalmente.
 * Atualiza os contadores de Favoritos, DMs e Notificações (Sino) em tempo real
 * em qualquer tela/aba da plataforma.
 */
export function useTopNavbarSocket({
  user,
  onFavoritesUpdated,
  onDmUpdated,
  onNotificationsUpdated,
}) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const isMountedRef = useRef(true);

  const callbacksRef = useRef({
    onFavoritesUpdated,
    onDmUpdated,
    onNotificationsUpdated,
  });
  callbacksRef.current = {
    onFavoritesUpdated,
    onDmUpdated,
    onNotificationsUpdated,
  };

  const userRef = useRef(user);
  userRef.current = user;

  const connect = useCallback(() => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    if (!token) return;

    try {
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/api/v1/chat/ws?token=${encodeURIComponent(token)}`;

      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMountedRef.current) return;

        // Heartbeat ping a cada 25 segundos para manter a conexão viva
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
          const { type, data, channel_type } = payload;

          if (type === 'pong') return;

          const currentUser = userRef.current;
          const currentUserId = currentUser?.id;

          // 1. Favoritos atualizados
          if (type === 'favorites_updated') {
            if (!data?.user_id || Number(data.user_id) === Number(currentUserId)) {
              if (callbacksRef.current.onFavoritesUpdated) {
                callbacksRef.current.onFavoritesUpdated();
              }
              window.dispatchEvent(new CustomEvent('favorites_updated'));
            }
          }

          // 2. Novas DMs ou alteração no status de leitura de DMs
          else if (type === 'new_dm' || type === 'dm_read' || type === 'dm_sent') {
            const isForMe =
              Number(data?.recipient_id) === Number(currentUserId) ||
              Number(data?.user_id) === Number(currentUserId) ||
              Number(data?.sender_id) === Number(currentUserId);

            if (isForMe) {
              if (callbacksRef.current.onDmUpdated) {
                callbacksRef.current.onDmUpdated();
              }
              window.dispatchEvent(new CustomEvent('dm_updated'));
            }
          }

          // 3. Notificações (Menções @ e Respostas em Threads)
          else if (type === 'new_notification' || type === 'notifications_updated') {
            if (!data?.user_id || Number(data.user_id) === Number(currentUserId)) {
              if (callbacksRef.current.onNotificationsUpdated) {
                callbacksRef.current.onNotificationsUpdated();
              }
              window.dispatchEvent(new CustomEvent('notifications_updated'));
            }
          }

          // 4. Nova mensagem global/canal/DM
          else if (type === 'new_message' && data) {
            // Se for DM direta para o usuário
            if (channel_type === 'dm' && Number(data?.recipient_id) === Number(currentUserId)) {
              if (callbacksRef.current.onDmUpdated) {
                callbacksRef.current.onDmUpdated();
              }
              window.dispatchEvent(new CustomEvent('dm_updated'));
            }

            // Se a mensagem mencionar o usuário
            if (currentUser?.name && data?.message) {
              const textLower = String(data.message).toLowerCase();
              const userNameLower = String(currentUser.name).toLowerCase();
              const firstNameLower = userNameLower.split(' ')[0];
              if (textLower.includes(`@${userNameLower}`) || (firstNameLower && textLower.includes(`@${firstNameLower}`))) {
                if (callbacksRef.current.onNotificationsUpdated) {
                  callbacksRef.current.onNotificationsUpdated();
                }
                window.dispatchEvent(new CustomEvent('notifications_updated'));
              }
            }

            // Atualiza resumo de mensagens não lidas no chat global
            window.dispatchEvent(new CustomEvent('chat_unread_updated'));
          }
        } catch {
          // Ignora mensagens mal formatadas
        }
      };

      socket.onclose = () => {
        if (!isMountedRef.current) return;
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
}
