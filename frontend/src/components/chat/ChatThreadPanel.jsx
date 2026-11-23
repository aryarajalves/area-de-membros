import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import ChatMessageItem from './ChatMessageItem';
import ChatInputBar from './ChatInputBar';
import { useToast } from '../../context/ToastContext';

export default function ChatThreadPanel({
  parentMessage,
  currentUser,
  onClose,
  onDeleteMessage,
  onToggleLike,
}) {
  const { addToast } = useToast();
  const [parentState, setParentState] = useState(parentMessage);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const threadBottomRef = useRef(null);

  useEffect(() => {
    setParentState(parentMessage);
  }, [parentMessage]);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  // Buscar respostas da thread
  const fetchThreadReplies = async () => {
    if (!parentMessage) return;
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('channel_type', parentMessage.channel_type);
      if (parentMessage.course_id) {
        params.set('course_id', parentMessage.course_id);
      }
      params.set('parent_id', parentMessage.id);
      params.set('limit', '50');

      const res = await fetch(`/api/v1/chat/messages?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setReplies(data);
      }
    } catch (err) {
      console.error('Erro ao buscar respostas da thread:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreadReplies();
  }, [parentMessage?.id]);

  useEffect(() => {
    const handleDeleted = (e) => {
      const delId = e.detail;
      setReplies((prev) => prev.filter((r) => r.id !== delId));
    };

    const handleLiked = (e) => {
      const { message_id, likes_count, liked, isMe } = e.detail || {};
      setReplies((prev) =>
        prev.map((r) =>
          r.id === message_id
            ? { ...r, likes_count, liked_by_me: isMe ? liked : r.liked_by_me }
            : r
        )
      );
      setParentState((prev) =>
        prev && prev.id === message_id
          ? { ...prev, likes_count, liked_by_me: isMe ? liked : prev.liked_by_me }
          : prev
      );
    };

    const handleThreadPinned = (e) => {
      const { message_id, parent_id, is_pinned, pinned_at } = e.detail || {};
      if (!parentMessage || Number(parent_id) !== Number(parentMessage.id)) return;
      setReplies((prev) =>
        prev.map((r) =>
          r.id === message_id
            ? { ...r, is_pinned, pinned_at }
            : is_pinned
              ? { ...r, is_pinned: false, pinned_at: null }
              : r
        )
      );
    };

    window.addEventListener('chat_message_deleted', handleDeleted);
    window.addEventListener('chat_message_liked', handleLiked);
    window.addEventListener('chat_thread_message_pinned', handleThreadPinned);
    return () => {
      window.removeEventListener('chat_message_deleted', handleDeleted);
      window.removeEventListener('chat_message_liked', handleLiked);
      window.removeEventListener('chat_thread_message_pinned', handleThreadPinned);
    };
  }, [parentMessage?.id]);

  useEffect(() => {
    if (threadBottomRef.current && typeof threadBottomRef.current.scrollIntoView === 'function') {
      threadBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies]);

  const handleThreadToggleLike = async (messageId) => {
    if (!onToggleLike) return;
    const data = await onToggleLike(messageId);
    if (data && typeof data.likes_count === 'number') {
      setReplies((prev) =>
        prev.map((r) =>
          r.id === messageId
            ? { ...r, likes_count: data.likes_count, liked_by_me: data.liked }
            : r
        )
      );
      setParentState((prev) =>
        prev && prev.id === messageId
          ? { ...prev, likes_count: data.likes_count, liked_by_me: data.liked }
          : prev
      );
    }
  };

  // Enviar resposta na thread
  const handleSendThreadReply = async (text, mediaUrl = null, mediaType = null) => {
    if (!parentMessage || sending) return false;
    setSending(true);
    const token = getAuthToken();
    try {
      const payload = {
        channel_type: parentMessage.channel_type,
        course_id: parentMessage.course_id,
        parent_id: parentMessage.id,
        message: text || '',
        media_url: mediaUrl,
        media_type: mediaType,
      };

      const res = await fetch('/api/v1/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const newReply = await res.json();
        setReplies((prev) => [...prev, newReply]);
        return true;
      }
      const errData = await res.json().catch(() => ({}));
      addToast(errData.detail || 'Não foi possível enviar a resposta na thread.', 'error');
      return false;
    } catch (err) {
      console.error('Erro ao responder na thread:', err);
      addToast('Erro de conexão ao responder na thread.', 'error');
      return false;
    } finally {
      setSending(false);
    }
  };

  if (!parentMessage) return null;

  return (
    <div
      data-testid="chat-thread-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Thread de discussão"
        className="chat-thread-panel"
        data-testid="chat-thread-panel"
        style={{
          width: '100%',
          maxWidth: '680px',
          height: 'min(85vh, 760px)',
          backgroundColor: '#0c1322',
          border: '1px solid rgba(56, 189, 248, 0.22)',
          borderRadius: '16px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho do Popup da Thread */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0f172a',
            flexShrink: 0,
          }}
        >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="#38bdf8" />
          <h2
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
            }}
          >
            Thread
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          data-testid="close-thread-panel-btn"
          title="Fechar Thread"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <X size={18} />
        </button>
      </div>

        {/* Lista de Mensagens: Mensagem Pai fixada no topo + Respostas */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Mensagem Pai / Raiz */}
          <div
            data-testid="thread-parent-message-wrapper"
            style={{
              paddingBottom: '14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '14px',
            }}
          >
            <ChatMessageItem
              message={parentState || parentMessage}
              currentUser={currentUser}
              onDeleteMessage={onDeleteMessage}
              onToggleLike={handleThreadToggleLike}
              isInsideThread={true}
            />
          </div>

          {/* Respostas da Thread */}
          {loading ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                gap: '8px',
              }}
            >
              <Loader2 size={24} className="animate-spin" color="#38bdf8" />
              <span style={{ fontSize: '0.8125rem' }}>Carregando respostas...</span>
            </div>
          ) : replies.length === 0 ? (
            <div
              style={{
                padding: '24px 12px',
                textAlign: 'center',
                color: '#64748b',
                fontSize: '0.8125rem',
              }}
            >
              Nenhuma resposta nesta thread ainda. Seja o primeiro a responder!
            </div>
          ) : (
            replies.map((reply) => (
              <ChatMessageItem
                key={reply.id}
                message={reply}
                currentUser={currentUser}
                onDeleteMessage={onDeleteMessage}
                onToggleLike={handleThreadToggleLike}
                isInsideThread={true}
              />
            ))
          )}
        <div ref={threadBottomRef} />
      </div>

      {/* Barra de Entrada da Thread */}
      <ChatInputBar
        onSendMessage={handleSendThreadReply}
        sending={sending}
        channelName="thread"
        parentMessage={parentMessage}
      />
      </div>
    </div>
  );
}
