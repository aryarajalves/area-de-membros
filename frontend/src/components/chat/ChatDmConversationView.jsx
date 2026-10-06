import React, { useState } from 'react';
import { Send, Loader2, ExternalLink } from 'lucide-react';
import { resolveButtonUrl } from './chatMentionUtils';

export default function ChatDmConversationView({
  selectedContact,
  currentUser,
  messages = [],
  loading = false,
  onSendMessage,
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const clean = text.trim();
    if (!clean || sending || !selectedContact?.id) return;
    setSending(true);
    const ok = await onSendMessage(clean);
    if (ok) setText('');
    setSending(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem' }}>Envie a primeira mensagem para começar!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMine = m.user.id === currentUser?.id;
            return (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMine ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
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
                  {m.message && <div>{m.message}</div>}

                  {/* Botão de Ação Interativo (CTA) */}
                  {m.button_text && m.button_url && (() => {
                    const resolvedHref = resolveButtonUrl(m.button_url, m.button_action_type);
                    return (
                      <div style={{ marginTop: m.message ? '10px' : '0', paddingTop: m.message ? '8px' : '0', borderTop: m.message ? '1px solid rgba(255, 255, 255, 0.12)' : 'none' }}>
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
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0c1322',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          placeholder={`Mensagem para ${selectedContact.name}...`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          data-testid="dm-message-input"
          style={{
            flex: 1,
            backgroundColor: '#1e293b',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#ffffff',
            fontSize: '0.85rem',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          data-testid="dm-send-btn"
          style={{
            backgroundColor: '#38bdf8',
            color: '#0f172a',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 16px',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: sending || !text.trim() ? 'not-allowed' : 'pointer',
            opacity: sending || !text.trim() ? 0.5 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          <span>Enviar</span>
        </button>
      </form>
    </div>
  );
}
