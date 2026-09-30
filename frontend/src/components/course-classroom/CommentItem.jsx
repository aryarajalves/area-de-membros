import React, { useState } from 'react';
import { Send, CornerDownRight, Trash2, ChevronDown, ChevronUp, Reply } from 'lucide-react';
import { formatToBrasilia } from './LessonComments';

export default function CommentItem({
  comment,
  currentUser,
  onReply,
  onDeleteRequest,
  getRoleBadge,
  canDeleteComment,
  isLightBg = false
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  const authorColor = isLightBg ? '#0f172a' : '#f8fafc';
  const contentColor = isLightBg ? '#334155' : '#e2e8f0';
  const subColor = isLightBg ? '#64748b' : '#94a3b8';
  const avatarBg = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const avatarColor = isLightBg ? '#334155' : '#f8fafc';
  const replyBoxBg = isLightBg ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)';
  const replyBoxBorder = isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)';
  const replyItemBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.025)';
  const replyItemBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)';
  const threadBorder = isLightBg ? '2px solid #e2e8f0' : '2px solid rgba(255, 255, 255, 0.1)';
  const inputTextColor = isLightBg ? '#0f172a' : '#f8fafc';

  const author = comment.user;
  const badge = getRoleBadge(author?.role);
  const initials = author?.name
    ? author.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  const replies = comment.replies || [];

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setIsReplying(false);
      setShowReplies(true);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleStartReply = (mentionName = '') => {
    setIsReplying(true);
    if (mentionName) {
      setReplyText((prev) => prev.startsWith(`@${mentionName}`) ? prev : `@${mentionName} ${prev}`.trimStart());
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: cardBg,
        border: cardBorder,
        borderRadius: '10px',
        padding: '16px',
        backdropFilter: isLightBg ? 'none' : 'blur(8px)',
        transition: 'all 0.2s ease'
      }}
      data-testid={`comment-item-${comment.id}`}
    >
      {/* Comentário Raiz */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Avatar */}
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: avatarBg,
          color: avatarColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '13.5px',
          fontWeight: 700,
          flexShrink: 0
        }}>
          {initials}
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: authorColor }}>
                {author?.name || 'Usuário'}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: badge.bg,
                color: badge.text,
                padding: '1px 7px',
                borderRadius: '4px'
              }}>
                {badge.label}
              </span>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                {formatToBrasilia(comment.created_at)}
              </span>
            </div>

            {/* Ação de Excluir Comentário Raiz */}
            {canDeleteComment(comment) && (
              <button
                type="button"
                onClick={() => onDeleteRequest(comment)}
                className="table-action-btn btn-danger"
                title="Excluir comentário"
                style={{ padding: '4px' }}
                data-testid={`delete-comment-btn-${comment.id}`}
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          <p style={{
            fontSize: '13.5px',
            color: contentColor,
            margin: '6px 0 0 0',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap'
          }}>
            {comment.content}
          </p>

          {/* Barra de Ações do Comentário */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={() => handleStartReply()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'none',
                border: 'none',
                padding: '4px 8px',
                fontSize: '12px',
                fontWeight: 600,
                color: subColor,
                cursor: 'pointer',
                borderRadius: '6px',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              data-testid={`reply-btn-${comment.id}`}
            >
              <CornerDownRight size={13} color="#38bdf8" />
              <span>Responder</span>
            </button>

            {replies.length > 0 && (
              <button
                type="button"
                onClick={() => setShowReplies((prev) => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#38bdf8',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
                data-testid={`toggle-replies-btn-${comment.id}`}
              >
                {showReplies ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                <span>
                  {showReplies
                    ? `Ocultar respostas (${replies.length})`
                    : `Ver ${replies.length} ${replies.length === 1 ? 'resposta' : 'respostas'}`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Formulário Inline de Resposta */}
      {isReplying && (
        <form
          onSubmit={handleSubmitReply}
          style={{
            marginTop: '12px',
            marginLeft: '50px',
            backgroundColor: replyBoxBg,
            border: replyBoxBorder,
            borderRadius: '8px',
            padding: '10px'
          }}
          data-testid={`reply-form-${comment.id}`}
        >
          <textarea
            rows={2}
            autoFocus
            placeholder={`Responder a ${author?.name || 'este comentário'}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="form-control-modern"
            style={{
              width: '100%',
              resize: 'vertical',
              border: 'none',
              backgroundColor: 'transparent',
              padding: '0',
              fontSize: '13px',
              color: inputTextColor
            }}
            data-testid={`reply-input-${comment.id}`}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setIsReplying(false);
                setReplyText('');
              }}
              className="secondary-btn"
              style={{ padding: '5px 10px', fontSize: '11.5px' }}
              data-testid={`cancel-reply-btn-${comment.id}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submittingReply || !replyText.trim()}
              className="primary-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 12px',
                fontSize: '11.5px'
              }}
              data-testid={`submit-reply-btn-${comment.id}`}
            >
              <Send size={12} />
              <span>{submittingReply ? 'Enviando...' : 'Responder'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista de Respostas (Thread de 1 nível) */}
      {showReplies && replies.length > 0 && (
        <div
          style={{
            marginTop: '14px',
            marginLeft: '26px',
            paddingLeft: '18px',
            borderLeft: threadBorder,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
          data-testid={`replies-list-${comment.id}`}
        >
          {replies.map((reply) => {
            const replyAuthor = reply.user;
            const replyBadge = getRoleBadge(replyAuthor?.role);
            const replyInitials = replyAuthor?.name
              ? replyAuthor.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
              : 'U';

            return (
              <div
                key={reply.id}
                style={{
                  display: 'flex',
                  gap: '10px',
                  backgroundColor: replyItemBg,
                  border: replyItemBorder,
                  borderRadius: '8px',
                  padding: '10px 12px'
                }}
                data-testid={`reply-item-${reply.id}`}
              >
                {/* Avatar da Resposta */}
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: avatarBg,
                  color: avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {replyInitials}
                </div>

                {/* Conteúdo da Resposta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: authorColor }}>
                        {replyAuthor?.name || 'Usuário'}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        backgroundColor: replyBadge.bg,
                        color: replyBadge.text,
                        padding: '1px 6px',
                        borderRadius: '3px'
                      }}>
                        {replyBadge.label}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {formatToBrasilia(reply.created_at)}
                      </span>
                    </div>

                    {/* Ação de Excluir Resposta */}
                    {canDeleteComment(reply) && (
                      <button
                        type="button"
                        onClick={() => onDeleteRequest(reply)}
                        className="table-action-btn btn-danger"
                        title="Excluir resposta"
                        style={{ padding: '3px' }}
                        data-testid={`delete-reply-btn-${reply.id}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>

                  <p style={{
                    fontSize: '13px',
                    color: contentColor,
                    margin: '4px 0 0 0',
                    lineHeight: '1.45',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {reply.content}
                  </p>

                  {/* Botão de Responder na Resposta (marca o autor no input de resposta) */}
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleStartReply(replyAuthor?.name)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'none',
                        border: 'none',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: subColor,
                        cursor: 'pointer',
                        borderRadius: '4px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = subColor)}
                      data-testid={`reply-to-user-btn-${reply.id}`}
                    >
                      <Reply size={11} />
                      <span>Responder</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
