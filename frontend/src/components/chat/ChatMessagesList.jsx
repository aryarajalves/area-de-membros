import React, { useEffect, useRef } from 'react';
import { MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import ChatMessageItem from './ChatMessageItem';
import ChatDateSeparator from './ChatDateSeparator';
import { isSameDay } from './chatDateUtils';

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
  const prevChannelIdRef = useRef(null);
  const prevMessagesCountRef = useRef(0);

  // Rola até o final ao receber novas mensagens ou carregar o canal
  useEffect(() => {
    if (loading || !bottomRef.current || typeof bottomRef.current.scrollIntoView !== 'function') {
      return;
    }

    const currentChannelId = selectedChannel?.id || 'default';
    const isChannelChanged = prevChannelIdRef.current !== currentChannelId;
    const isInitialChannelLoad = isChannelChanged || prevMessagesCountRef.current === 0;

    // Se é a primeira carga do canal ou troca de canal, rola instantaneamente ('auto')
    // evitando throttling de renderização e congelamento de animações (GIFs) no Chromium.
    // Se novas mensagens foram adicionadas ao canal já aberto, rola suavemente ('smooth').
    const behavior = isInitialChannelLoad ? 'auto' : 'smooth';

    bottomRef.current.scrollIntoView({ behavior });

    prevChannelIdRef.current = currentChannelId;
    prevMessagesCountRef.current = messages.length;
  }, [messages, loading, selectedChannel]);

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
      {messages.map((msg, idx) => {
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const showSeparator = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);

        return (
          <React.Fragment key={msg.id}>
            {showSeparator && <ChatDateSeparator date={msg.created_at} />}
            <ChatMessageItem
              message={msg}
              currentUser={currentUser}
              onDeleteMessage={onDeleteMessage}
              onToggleLike={onToggleLike}
              onToggleFavorite={onToggleFavorite}
              onTogglePin={onTogglePin}
              onOpenThread={onOpenThread}
              isHighlighted={msg.id === highlightedMessageId}
            />
          </React.Fragment>
        );
      })}
      <div ref={bottomRef} style={{ height: '4px' }} />
    </div>
  );
}
