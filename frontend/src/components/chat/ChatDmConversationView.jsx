import React, { useRef, useEffect, useState } from 'react';
import { Loader2, ExternalLink, Lock, Check, CheckCheck, Clock, X, Trash2 } from 'lucide-react';
import { formatMessageWithMentions, resolveButtonUrl, handleInternalNavigation } from './chatMentionUtils';
import ChatDateSeparator from './ChatDateSeparator';
import { isSameDay } from './chatDateUtils';
import ChatMessageMediaAttachment from './ChatMessageMediaAttachment';
import ChatInputBar from './ChatInputBar';
import DeleteChatMessageModal from './DeleteChatMessageModal';
import ChatDmReactionPicker from './ChatDmReactionPicker';
import ChatDmReactionBadges from './ChatDmReactionBadges';

export function formatDateTimeFull(isoString) {
  if (!isoString) return '--/--/---- às --:--';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '--/--/---- às --:--';
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
}

export default function ChatDmConversationView({
  selectedContact,
  currentUser,
  messages = [],
  loading = false,
  onSendMessage,
  onDeleteMessage,
  onToggleReaction,
  adminThread = null,
}) {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const [expandedInfoMsgId, setExpandedInfoMsgId] = useState(null);
  const [deleteModalMsgId, setDeleteModalMsgId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const scrollToBottom = (behavior = 'auto') => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  useEffect(() => {
    scrollToBottom('auto');
    const t1 = setTimeout(() => scrollToBottom('auto'), 50);
    const t2 = setTimeout(() => scrollToBottom('smooth'), 180);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [selectedContact?.id, loading, messages.length]);

  const handleConfirmDelete = async () => {
    if (!deleteModalMsgId || !onDeleteMessage) return;
    setIsDeleting(true);
    try {
      await onDeleteMessage(deleteModalMsgId);
      setDeleteModalMsgId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Container de Histórico de Mensagens */}
      <div
        ref={containerRef}
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
        {adminThread ? (
          <div
            data-testid="dm-supervisor-banner"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 14px',
              margin: '0 auto 4px',
              backgroundColor: 'rgba(234, 179, 8, 0.12)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              borderRadius: '20px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: '#fde047',
              textAlign: 'center',
              maxWidth: '92%',
            }}
          >
            <span>🛡️ Modo Supervisão (Super Admin) • Atendimento: {adminThread.student?.name} ↔ {adminThread.admin?.name}</span>
          </div>
        ) : (
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
        )}
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
            const isDeleted = Boolean(m.is_deleted);
            const canDeleteThisMsg = (m.can_delete || isMine || currentUser?.role === 'superadmin' || currentUser?.role === 'admin') && !isDeleted;
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
                      backgroundColor: isDeleted ? 'rgba(30, 41, 59, 0.7)' : (isMine ? '#2563eb' : '#1e293b'),
                      color: isDeleted ? '#cbd5e1' : '#ffffff',
                      fontSize: '0.85rem',
                      lineHeight: 1.4,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      border: isDeleted
                        ? '1px dashed rgba(239, 68, 68, 0.45)'
                        : (isMine ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255,255,255,0.06)'),
                      opacity: isDeleted ? 0.45 : 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    {/* Badge Indicativo de Mensagem Excluída para Admins */}
                    {isDeleted && (
                      <div
                        data-testid={`dm-deleted-badge-${m.id}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.68rem',
                          color: '#f87171',
                          backgroundColor: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          marginBottom: '6px',
                          fontWeight: 600,
                        }}
                      >
                        <span>🛡️ Mensagem apagada pelo aluno</span>
                      </div>
                    )}

                    {/* Identificação de Super Admin ou Remetente na Thread */}
                    {m.user?.role === 'superadmin' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '5px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#facc15' }}>{m.user.name}</span>
                        <span
                          data-testid="superadmin-badge-bubble"
                          style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            color: '#facc15',
                            backgroundColor: 'rgba(234, 179, 8, 0.25)',
                            border: '1px solid rgba(234, 179, 8, 0.5)',
                            borderRadius: '999px',
                            padding: '1px 6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          🛡️ Super Admin
                        </span>
                      </div>
                    ) : (
                      adminThread && !isMine && (
                        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: m.user?.role === 'admin' ? '#facc15' : '#38bdf8', marginBottom: '3px' }}>
                          {m.user?.name} {m.user?.role === 'admin' ? '(Admin)' : '(Aluno)'}
                        </div>
                      )
                    )}
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
                              if (
                                m.button_action_type === 'course' ||
                                m.button_action_type === 'lesson' ||
                                resolvedHref.startsWith('internal://') ||
                                resolvedHref.startsWith('/courses') ||
                                resolvedHref.includes('course_id=') ||
                                resolvedHref.includes('lesson_id=')
                              ) {
                                e.preventDefault();
                                handleInternalNavigation(m.button_url || resolvedHref);
                                return;
                              }
                              if (resolvedHref.startsWith('/')) {
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

                  {!isDeleted && (
                    <ChatDmReactionBadges
                      messageId={m.id}
                      reactions={m.reactions}
                      isMine={isMine}
                      onToggleReaction={onToggleReaction}
                    />
                  )}

                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginTop: '3px',
                      fontSize: '0.66rem',
                      color: '#64748b',
                    }}
                  >
                    <span>
                      {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isDeleted && (
                      <ChatDmReactionPicker
                        messageId={m.id}
                        isMine={isMine}
                        onSelectReaction={onToggleReaction}
                      />
                    )}
                    {canDeleteThisMsg && (
                      <button
                        type="button"
                        onClick={() => setDeleteModalMsgId(m.id)}
                        data-testid={`dm-delete-btn-${m.id}`}
                        title="Excluir mensagem"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '1px 3px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => setExpandedInfoMsgId((prev) => (prev === m.id ? null : m.id))}
                        data-testid={`dm-read-status-${m.id}`}
                        aria-label="Ver data e horário de visualização da mensagem"
                        title={m.is_read ? 'Visualizada • Clique para ver data e horário' : 'Enviado • Aguardando leitura'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: expandedInfoMsgId === m.id ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                          border: expandedInfoMsgId === m.id ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid transparent',
                          borderRadius: '4px',
                          padding: '1px 5px',
                          cursor: 'pointer',
                          color: m.is_read ? '#38bdf8' : '#94a3b8',
                          fontWeight: m.is_read ? 600 : 400,
                          fontSize: '0.66rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {m.is_read ? (
                          <>
                            <CheckCheck size={13} color="#38bdf8" />
                            <span>Visto</span>
                          </>
                        ) : (
                          <>
                            <Check size={12} color="#94a3b8" />
                            <span>Enviado</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Popover Detalhado com Data e Horário ao Clicar em Visto */}
                  {isMine && expandedInfoMsgId === m.id && (
                    <div
                      data-testid={`dm-read-info-popover-${m.id}`}
                      style={{
                        marginTop: '4px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(56, 189, 248, 0.4)',
                        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        fontSize: '0.7rem',
                        color: '#cbd5e1',
                        maxWidth: '280px',
                        textAlign: 'left',
                        boxSizing: 'border-box',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px',
                          borderBottom: '1px solid rgba(255,255,255,0.08)',
                          paddingBottom: '4px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: m.is_read ? '#38bdf8' : '#94a3b8',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                          }}
                        >
                          {m.is_read ? <CheckCheck size={14} color="#38bdf8" /> : <Clock size={13} color="#94a3b8" />}
                          <span>{m.is_read ? 'Mensagem Visualizada' : 'Mensagem Enviada'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExpandedInfoMsgId(null)}
                          style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                          aria-label="Fechar detalhes"
                        >
                          <X size={12} />
                        </button>
                      </div>

                      {m.is_read ? (
                        <div style={{ color: '#f8fafc', fontSize: '0.72rem' }}>
                          <span style={{ color: '#94a3b8' }}>Visto em: </span>
                          <strong data-testid={`dm-seen-time-${m.id}`} style={{ color: '#38bdf8' }}>
                            {formatDateTimeFull(m.read_at || m.created_at)}
                          </strong>
                        </div>
                      ) : (
                        <div style={{ color: '#94a3b8', fontSize: '0.68rem', fontStyle: 'italic' }}>
                          Aguardando o destinatário abrir a conversa.
                        </div>
                      )}

                      <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                        <span>Enviada em: </span>
                        <span>{formatDateTimeFull(m.created_at)}</span>
                      </div>
                    </div>
                  )}
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

      {/* Modal de Confirmação para Excluir Mensagem */}
      <DeleteChatMessageModal
        isOpen={Boolean(deleteModalMsgId)}
        loading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalMsgId(null)}
      />
    </div>
  );
}
