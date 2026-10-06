import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { useChatSocket } from './useChatSocket';

export function useChat(currentUser) {
  const { addToast } = useToast();
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    messageId: null,
    loading: false,
  });

  const pollingRef = useRef(null);
  const selectedChannelRef = useRef(null);
  selectedChannelRef.current = selectedChannel;

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const favoritesOnlyRef = useRef(favoritesOnly);
  favoritesOnlyRef.current = favoritesOnly;

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  const authHeaders = useCallback(() => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  // Carrega a lista de canais disponíveis
  const fetchChannels = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoadingChannels(false);
      return;
    }
    try {
      const res = await fetch('/api/v1/chat/channels', {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
        if (!selectedChannelRef.current && data.length > 0) {
          const general = data.find((c) => c.id === 'general') || data[0];
          setSelectedChannel(general);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar canais de chat:', err);
    } finally {
      setLoadingChannels(false);
    }
  }, [authHeaders]);

  // Carrega mensagem fixada do canal
  const fetchPinnedMessage = useCallback(async (channel) => {
    if (!channel) {
      setPinnedMessage(null);
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    try {
      const params = new URLSearchParams();
      params.set('channel_type', channel.type);
      if (channel.type === 'course' && channel.course_id) {
        params.set('course_id', channel.course_id);
      }
      const res = await fetch(`/api/v1/chat/pinned-message?${params.toString()}`, {
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setPinnedMessage(data);
      } else {
        setPinnedMessage(null);
      }
    } catch {
      setPinnedMessage(null);
    }
  }, [authHeaders]);

  // Carrega histórico de mensagens do canal ativo
  const fetchMessages = useCallback(async (channel, isFavOnly = false) => {
    if (!channel) return;
    const token = getAuthToken();
    if (!token) return;
    setLoadingMessages(true);
    try {
      const params = new URLSearchParams();
      params.set('channel_type', channel.type);
      if (channel.type === 'course' && channel.course_id) {
        params.set('course_id', channel.course_id);
      }
      if (isFavOnly) {
        params.set('favorites_only', 'true');
      }
      params.set('limit', '60');

      const res = await fetch(`/api/v1/chat/messages?${params.toString()}`, {
        headers: authHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else if (res.status === 403) {
        addToast('Você não tem acesso a este canal.', 'error');
        setMessages([]);
      }
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, [authHeaders, addToast]);

  // Busca incremental de novas mensagens (polling leve)
  const pollNewMessages = useCallback(async () => {
    const currentChan = selectedChannelRef.current;
    if (!currentChan || favoritesOnlyRef.current) return;
    const token = getAuthToken();
    if (!token) return;

    const currentMsgs = messagesRef.current;
    const lastId = currentMsgs.length > 0 ? currentMsgs[currentMsgs.length - 1].id : null;

    try {
      const params = new URLSearchParams();
      params.set('channel_type', currentChan.type);
      if (currentChan.type === 'course' && currentChan.course_id) {
        params.set('course_id', currentChan.course_id);
      }
      if (lastId) {
        params.set('after_id', lastId);
      }
      params.set('limit', '30');

      const res = await fetch(`/api/v1/chat/messages?${params.toString()}`, {
        headers: authHeaders(),
      });

      if (res.ok) {
        const newMsgs = await res.json();
        if (newMsgs && newMsgs.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const filteredNew = newMsgs.filter((m) => !existingIds.has(m.id));
            if (filteredNew.length === 0) return prev;
            return [...prev, ...filteredNew];
          });
        }
      }
    } catch {
      // Ignora silenciosamente erros em polling de segundo plano
    }
  }, [authHeaders]);

  // Handlers para eventos recebidos em tempo real via WebSocket
  const handleSocketNewMessage = useCallback((newMsg) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  }, []);

  const handleSocketMessageDeleted = useCallback((delId) => {
    setMessages((prev) => prev.filter((m) => m.id !== delId));
    setPinnedMessage((current) => (current && current.id === delId ? null : current));
  }, []);

  const handleSocketMessageLiked = useCallback((data, user) => {
    const { message_id, likes_count, user_id, liked } = data;
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== message_id) return m;
        const isMe = user?.id === user_id;
        return {
          ...m,
          likes_count,
          liked_by_me: isMe ? liked : m.liked_by_me,
        };
      })
    );
  }, []);

  const handleSocketMessagePinned = useCallback((data) => {
    const { message_id, is_pinned, pinned_message } = data;
    setMessages((prev) =>
      prev.map((m) => (m.id === message_id ? { ...m, is_pinned } : m))
    );
    if (is_pinned && pinned_message) {
      setPinnedMessage(pinned_message);
    } else {
      setPinnedMessage(null);
    }
  }, []);

  const handleSocketChannelActivity = useCallback((channel_type, course_id, messageData) => {
    setChannels((prev) =>
      prev.map((chan) => {
        const matches =
          (channel_type === 'general' && chan.type === 'general') ||
          (channel_type === 'course' && chan.type === 'course' && Number(course_id) === Number(chan.course_id));
        if (!matches) return chan;
        return {
          ...chan,
          last_message: messageData?.message || (messageData?.media_url ? '[Mídia]' : chan.last_message),
          last_message_at: messageData?.created_at || new Date().toISOString(),
        };
      })
    );
  }, []);

  // Conexão em tempo real via WebSocket
  const { isConnected: isWsConnected } = useChatSocket({
    currentUser,
    selectedChannel,
    onNewMessage: handleSocketNewMessage,
    onMessageDeleted: handleSocketMessageDeleted,
    onMessageLiked: handleSocketMessageLiked,
    onMessagePinned: handleSocketMessagePinned,
    onChannelActivity: handleSocketChannelActivity,
  });

  // Carrega canais no mount
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Sempre que mudar de canal selecionado, recarrega o histórico e mensagem fixada
  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel, favoritesOnly);
      fetchPinnedMessage(selectedChannel);
    }
  }, [selectedChannel, favoritesOnly, fetchMessages, fetchPinnedMessage]);

  // Polling como fallback de contingência somente se o WebSocket estiver desconectado
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    const token = getAuthToken();
    if (!token || !selectedChannel || favoritesOnly || isWsConnected) return;

    pollingRef.current = setInterval(() => {
      pollNewMessages();
    }, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [pollNewMessages, selectedChannel, favoritesOnly, isWsConnected]);

  // Enviar mensagem (com suporte a texto e/ou mídia)
  const sendMessage = async (text, mediaUrl = null, mediaType = null) => {
    const hasText = text && text.trim();
    const hasMedia = !!mediaUrl;
    if ((!hasText && !hasMedia) || !selectedChannel || sending) return false;
    setSending(true);

    try {
      const payload = {
        channel_type: selectedChannel.type,
        course_id: selectedChannel.type === 'course' ? selectedChannel.course_id : null,
        message: hasText ? text.trim() : '',
        media_url: mediaUrl,
        media_type: mediaType,
      };

      const res = await fetch('/api/v1/chat/messages', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        return true;
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.detail || 'Não foi possível enviar a mensagem.', 'error');
        return false;
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      addToast('Erro de conexão ao enviar mensagem.', 'error');
      return false;
    } finally {
      setSending(false);
    }
  };

  // Curtir ou descurtir mensagem
  const toggleLike = async (messageId) => {
    try {
      const res = await fetch(`/api/v1/chat/messages/${messageId}/like`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, likes_count: data.likes_count, liked_by_me: data.liked }
              : m
          )
        );
        if (pinnedMessage && pinnedMessage.id === messageId) {
          setPinnedMessage((prev) =>
            prev ? { ...prev, likes_count: data.likes_count, liked_by_me: data.liked } : null
          );
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.detail || 'Erro ao processar curtida.', 'error');
      }
    } catch (err) {
      console.error('Erro ao curtir mensagem:', err);
    }
  };

  // Favoritar ou desfavoritar mensagem
  const toggleFavorite = async (messageId) => {
    try {
      const res = await fetch(`/api/v1/chat/messages/${messageId}/favorite`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => {
          if (favoritesOnly && !data.is_favorited) {
            return prev.filter((m) => m.id !== messageId);
          }
          return prev.map((m) =>
            m.id === messageId ? { ...m, is_favorited: data.is_favorited } : m
          );
        });
        addToast(
          data.is_favorited ? 'Mensagem adicionada aos favoritos ⭐' : 'Mensagem removida dos favoritos',
          'success'
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.detail || 'Erro ao favoritar mensagem.', 'error');
      }
    } catch (err) {
      console.error('Erro ao favoritar mensagem:', err);
    }
  };

  // Fixar ou desafixar mensagem (gestores)
  const togglePin = async (messageId) => {
    try {
      const res = await fetch(`/api/v1/chat/messages/${messageId}/pin`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (res.ok) {
        const updated = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? updated : m))
        );
        if (updated.is_pinned) {
          setPinnedMessage(updated);
          addToast('Mensagem fixada no canal 📌', 'success');
        } else {
          setPinnedMessage(null);
          addToast('Mensagem desafixada do canal', 'success');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.detail || 'Não foi possível fixar/desafixar a mensagem.', 'error');
      }
    } catch (err) {
      console.error('Erro ao fixar mensagem:', err);
    }
  };

  // Abrir modal de confirmação de exclusão
  const promptDeleteMessage = (messageId) => {
    setDeleteModalState({
      isOpen: true,
      messageId,
      loading: false,
    });
  };

  // Fechar modal de confirmação
  const closeDeleteModal = () => {
    setDeleteModalState({
      isOpen: false,
      messageId: null,
      loading: false,
    });
  };

  // Confirmar exclusão de mensagem
  const confirmDeleteMessage = async () => {
    const { messageId } = deleteModalState;
    if (!messageId) return;

    setDeleteModalState((prev) => ({ ...prev, loading: true }));

    try {
      const res = await fetch(`/api/v1/chat/messages/${messageId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== messageId));
        if (pinnedMessage && pinnedMessage.id === messageId) {
          setPinnedMessage(null);
        }
        addToast('Mensagem excluída com sucesso!', 'success');
        closeDeleteModal();
      } else {
        const errData = await res.json().catch(() => ({}));
        addToast(errData.detail || 'Erro ao excluir mensagem.', 'error');
        setDeleteModalState((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error('Erro ao excluir mensagem:', err);
      addToast('Erro ao comunicar com o servidor.', 'error');
      setDeleteModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  return {
    channels,
    selectedChannel,
    setSelectedChannel,
    messages,
    loadingChannels,
    loadingMessages,
    sending,
    sendMessage,
    favoritesOnly,
    setFavoritesOnly,
    pinnedMessage,
    toggleLike,
    toggleFavorite,
    togglePin,
    deleteModalState,
    promptDeleteMessage,
    closeDeleteModal,
    confirmDeleteMessage,
    refetchChannels: fetchChannels,
    refetchMessages: () => fetchMessages(selectedChannel, favoritesOnly),
  };
}
