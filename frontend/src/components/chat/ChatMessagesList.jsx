import React, { useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import ChatMessageItem from './ChatMessageItem';

export default function ChatMessagesList({
  messages = [],
  loading = false,
  currentUser,
  selectedChannel,
  onDeleteMessage,
  onToggleLike,
  onToggleFavorite,
  onTogglePin,
  onOpenThread,
  highlightedMessageId = null,
}) {
  const bottomRef = useRef(null);

  // Rola até o final ao receber novas mensagens
  useEffect(() => {
    if (!loading && bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  if (loading) {
    return (
      <div
        data-testid="chat-loading-state"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          gap: '12px',
        }}
      >
        <Loader2 size={32} className="animate-spin" color="#3b82f6" />
        <span style={{ fontSize: '0.875rem' }}>Carregando mensagens da conversa...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div
        data-testid="chat-empty-state"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          textAlign: 'center',
          padding: '32px 16px',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: '#3b82f6',
          }}
        >
          <Sparkles size={28} />
        </div>
        <h3
          style={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#f8fafc',
            margin: '0 0 8px',
          }}
        >
          Nenhuma mensagem ainda
        </h3>
        <p
          style={{
            fontSize: '0.875rem',
            color: '#94a3b8',
            maxWidth: '380px',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          Seja o primeiro a enviar uma mensagem e iniciar a conversa no canal{' '}
          <strong style={{ color: '#ffffff' }}>{selectedChannel?.name || 'Geral'}</strong>!
        </p>
      </div>
    );
  }

  return (
    <div
      className="chat-messages-container"
      data-testid="chat-messages-list"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {messages.map((msg) => (
        <ChatMessageItem
          key={msg.id}
          message={msg}
          currentUser={currentUser}
          onDeleteMessage={onDeleteMessage}
          onToggleLike={onToggleLike}
          onToggleFavorite={onToggleFavorite}
          onTogglePin={onTogglePin}
          onOpenThread={onOpenThread}
          isHighlighted={msg.id === highlightedMessageId}
        />
      ))}
      <div ref={bottomRef} style={{ height: '4px' }} />
    </div>
  );
}
