import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import ChatMessageItem from './ChatMessageItem';
import ChatInputBar from './ChatInputBar';

export default function ChatThreadPanel({
  parentMessage,
  currentUser,
  onClose,
  onDeleteMessage,
  onToggleLike,
  onToggleFavorite,
  onTogglePin,
}) {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const threadBottomRef = useRef(null);

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
    if (threadBottomRef.current && typeof threadBottomRef.current.scrollIntoView === 'function') {
      threadBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [replies]);

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
        message: text,
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
      return false;
    } catch (err) {
      console.error('Erro ao responder na thread:', err);
      return false;
    } finally {
      setSending(false);
    }
  };

  if (!parentMessage) return null;

  return (
    <aside
      className="chat-thread-panel"
      data-testid="chat-thread-panel"
      style={{
        width: '420px',
        minWidth: '380px',
        maxWidth: '520px',
        backgroundColor: '#0c1322',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: 20,
      }}
    >
      {/* Cabeçalho do Painel da Thread */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#0f172a',
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
            message={parentMessage}
            currentUser={currentUser}
            onDeleteMessage={onDeleteMessage}
            onToggleLike={onToggleLike}
            onToggleFavorite={onToggleFavorite}
            onTogglePin={onTogglePin}
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
              onToggleLike={onToggleLike}
              onToggleFavorite={onToggleFavorite}
              onTogglePin={onTogglePin}
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
    </aside>
  );
}
