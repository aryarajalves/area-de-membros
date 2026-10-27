import React, { useRef, useEffect } from 'react';
import { Loader2, ExternalLink, Lock } from 'lucide-react';
import { formatMessageWithMentions, resolveButtonUrl } from './chatMentionUtils';
import ChatDateSeparator from './ChatDateSeparator';
import { isSameDay } from './chatDateUtils';
import ChatMessageMediaAttachment from './ChatMessageMediaAttachment';
import ChatInputBar from './ChatInputBar';

export default function ChatDmConversationView({
  selectedContact,
  currentUser,
  messages = [],
  loading = false,
  onSendMessage,
}) {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Container de Histórico de Mensagens */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
        data-testid="dm-messages-container"
      >
        {/* Banner Informativo de Criptografia de Ponta a Ponta */}
        <div
          data-testid="dm-encryption-banner"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '6px 14px',
            margin: '0 auto 4px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.22)',
            borderRadius: '20px',
            fontSize: '0.72rem',
            fontWeight: 500,
            color: '#a7f3d0',
            textAlign: 'center',
            maxWidth: '92%',
          }}
        >
          <Lock size={12} color="#10b981" />
          <span>Mensagens e arquivos protegidos por criptografia de ponta a ponta</span>
        </div>
        {loading ? (
          <div
            style={{
              padding: '40px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Loader2 size={24} className="animate-spin" color="#38bdf8" />
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>Nenhuma mensagem nesta conversa.</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem' }}>Envie a primeira mensagem, foto, áudio ou documento para começar!</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const prevM = idx > 0 ? messages[idx - 1] : null;
            const showSep = !prevM || !isSameDay(prevM.created_at, m.created_at);
            const isMine = m.user?.id === currentUser?.id;
            return (
              <React.Fragment key={m.id}>
                {showSep && <ChatDateSeparator date={m.created_at} />}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMine ? 'flex-end' : 'flex-start',
                  }}
                  data-testid={`dm-message-bubble-${m.id}`}
                >
                  <div
                    style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: isMine ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                      backgroundColor: isMine ? '#2563eb' : '#1e293b',
                      color: '#ffffff',
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      border: isMine ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    {/* Renderização de Mídia Anexada (Áudio, Vídeo, Imagem, GIF, PDF) */}
                    {m.media_url && (
                      <div style={{ marginBottom: m.message ? '8px' : '0' }}>
                        <ChatMessageMediaAttachment message={m} />
                      </div>
                    )}

                    {/* Texto da Mensagem */}
                    {m.message && (
                      <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {formatMessageWithMentions(m.message)}
                      </div>
                    )}

                    {/* Botão de Ação Interativo (CTA) */}
                    {m.button_text && m.button_url && (() => {
                      const resolvedHref = resolveButtonUrl(m.button_url, m.button_action_type);
                      return (
                        <div style={{ marginTop: m.message || m.media_url ? '10px' : '0', paddingTop: m.message || m.media_url ? '8px' : '0', borderTop: m.message || m.media_url ? '1px solid rgba(255, 255, 255, 0.12)' : 'none' }}>
                          <a
                            href={resolvedHref}
                            target={m.button_action_type === 'url' || resolvedHref.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            onClick={async (e) => {
                              if (m.button_action_type === 'funnel') {
                                e.preventDefault();
                                try {
                                  const token = localStorage.getItem('auth_token');
                                  await fetch(`/api/v1/funnels/${m.button_url}/trigger`, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                    },
                                    body: JSON.stringify({}),
                                  });
                                } catch {
                                  // silencioso
                                }
                                return;
                              }
                              if (m.button_action_type === 'course' || m.button_action_type === 'lesson' || resolvedHref.startsWith('/')) {
                                e.preventDefault();
                                window.location.href = resolvedHref;
                              }
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 14px',
                              borderRadius: '8px',
                              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                              color: '#ffffff',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              boxShadow: '0 3px 10px rgba(139, 92, 246, 0.35)',
                              cursor: 'pointer',
                            }}
                            data-testid={`dm-cta-button-${m.id}`}
                          >
                            <span>{m.button_text}</span>
                            <ExternalLink size={13} />
                          </a>
                        </div>
                      );
                    })()}
                  </div>

                  <span style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '3px' }}>
                    {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Barra Completa de Envio de Mensagem com Mídias (Vídeo, Áudio, Imagem, GIF, PDF) */}
      <ChatInputBar
        onSendMessage={onSendMessage}
        sending={loading}
        channelName={selectedContact?.name || 'conversa'}
        placeholder={`Mensagem para ${selectedContact?.name || 'contato'}...`}
      />
    </div>
  );
}
