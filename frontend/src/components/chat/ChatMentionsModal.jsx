import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AtSign, X, Check, Loader2, MessageSquare, ExternalLink } from 'lucide-react';

export default function ChatMentionsModal({ isOpen, onClose, onJumpToMessage }) {
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Bloqueio do scroll do fundo quando o modal estiver aberto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  const fetchMentions = async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/chat/mentions?limit=40', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMentions(data);
      }
    } catch (err) {
      console.error('Erro ao carregar menções:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMentions();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (mentionId, e) => {
    if (e) e.stopPropagation();
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/chat/mentions/${mentionId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setMentions((prev) =>
          prev.map((m) => (m.id === mentionId ? { ...m, is_read: true } : m))
        );
      }
    } catch (err) {
      console.error('Erro ao marcar menção como lida:', err);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      data-testid="chat-mentions-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '80vh',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#131d35',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AtSign size={18} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  margin: 0,
                }}
              >
                Minhas Menções
              </h2>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  margin: '2px 0 0',
                }}
              >
                Mensagens onde outros alunos ou professores marcaram você
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="close-mentions-modal-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Lista */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '40px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                color: '#94a3b8',
              }}
            >
              <Loader2 size={28} className="animate-spin" color="#38bdf8" />
              <span style={{ fontSize: '0.85rem' }}>Carregando suas menções...</span>
            </div>
          ) : mentions.length === 0 ? (
            <div
              style={{
                padding: '40px 16px',
                textAlign: 'center',
                color: '#64748b',
              }}
            >
              <MessageSquare size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>
                Nenhuma menção encontrada.
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
                Quando alguém marcar seu nome com @, aparecerá aqui.
              </p>
            </div>
          ) : (
            mentions.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  if (item.message_id) {
                    onJumpToMessage(item.message_id);
                    if (!item.is_read) handleMarkAsRead(item.id);
                    onClose();
                  }
                }}
                style={{
                  backgroundColor: item.is_read ? '#1e293b' : 'rgba(56, 189, 248, 0.08)',
                  border: item.is_read
                    ? '1px solid rgba(255, 255, 255, 0.06)'
                    : '1px solid rgba(56, 189, 248, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: '#f8fafc',
                      }}
                    >
                      {item.sender_name || 'Aluno'}
                    </span>
                    {!item.is_read && (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          backgroundColor: '#38bdf8',
                          color: '#0f172a',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '9999px',
                        }}
                      >
                        Nova
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                    {new Date(item.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.82rem',
                    color: '#94a3b8',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.message_preview || 'Mensagem com anexo'}
                </p>

                <div
                  style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#38bdf8',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ExternalLink size={11} /> Ir para mensagem
                  </span>
                  {!item.is_read && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(item.id, e)}
                      title="Marcar como lida"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      <Check size={12} color="#10b981" /> Marcar lida
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
