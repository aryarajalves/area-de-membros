import React, { useState } from 'react';
import { Send, Loader2, Sparkles, X, MessageSquarePlus } from 'lucide-react';

export default function NewCommentBox({
  currentUser,
  newComment,
  setNewComment,
  onSubmit,
  submitting,
  isLightBg = false,
  getRoleBadge
}) {
  const [isFocused, setIsFocused] = useState(false);

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';

  const cardBg = isLightBg
    ? '#ffffff'
    : 'linear-gradient(180deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.6) 100%)';

  const cardBorder = isFocused
    ? '1px solid #3b82f6'
    : (isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)');

  const cardShadow = isFocused
    ? '0 0 0 3px rgba(59, 130, 246, 0.18), 0 8px 20px rgba(0, 0, 0, 0.25)'
    : (isLightBg ? '0 2px 8px rgba(0, 0, 0, 0.04)' : '0 4px 16px rgba(0, 0, 0, 0.2)');

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : (currentUser?.email ? currentUser.email[0].toUpperCase() : 'U');

  const roleBadge = getRoleBadge ? getRoleBadge(currentUser?.role) : null;

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!submitting && newComment.trim()) {
        onSubmit(e);
      }
    }
  };

  return (
    <form onSubmit={onSubmit} style={{ marginBottom: '28px' }} data-testid="new-comment-form">
      <div
        className="comment-box-card"
        style={{
          background: cardBg,
          border: cardBorder,
          boxShadow: cardShadow,
          borderRadius: '14px',
          padding: '16px 18px',
          backdropFilter: isLightBg ? 'none' : 'blur(10px)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Cabeçalho do Card: Identificação do Usuário */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12.5px',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                flexShrink: 0
              }}
            >
              {initials}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 600, color: textColor }}>
                {currentUser?.name || 'Seu Comentário'}
              </span>

              {roleBadge && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '6px',
                    backgroundColor: roleBadge.bg,
                    color: roleBadge.text,
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px'
                  }}
                >
                  {roleBadge.label}
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11.5px',
              color: subTextColor,
              opacity: 0.85
            }}
          >
            <MessageSquarePlus size={13} style={{ color: '#3b82f6' }} />
            <span>Comunidade da Aula</span>
          </div>
        </div>

        {/* Textarea elegante e integrado */}
        <textarea
          rows={isFocused || newComment.length > 0 ? 4 : 3}
          placeholder="Deixe sua dúvida, feedback ou comentário sobre esta aula..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="form-control-modern"
          style={{
            width: '100%',
            resize: 'vertical',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            padding: '4px 2px',
            fontSize: '13.5px',
            lineHeight: 1.6,
            color: textColor,
            fontFamily: 'inherit',
            minHeight: '75px',
            boxSizing: 'border-box'
          }}
          data-testid="comment-input"
        />

        {/* Barra Inferior com Dicas e Botões */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: isLightBg ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.07)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: subTextColor }}>
            {newComment.length > 0 ? (
              <span>{newComment.length} caracteres</span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <kbd style={{
                  padding: '2px 5px',
                  borderRadius: '4px',
                  backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: textColor
                }}>Ctrl</kbd> + <kbd style={{
                  padding: '2px 5px',
                  borderRadius: '4px',
                  backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: textColor
                }}>Enter</kbd> para enviar
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {newComment.length > 0 && !submitting && (
              <button
                type="button"
                onClick={() => setNewComment('')}
                className="secondary-btn"
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: subTextColor,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                data-testid="cancel-comment-btn"
              >
                <X size={13} />
                <span>Limpar</span>
              </button>
            )}

            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="primary-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 18px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                cursor: submitting || !newComment.trim() ? 'not-allowed' : 'pointer',
                opacity: submitting || !newComment.trim() ? 0.55 : 1,
                boxShadow: submitting || !newComment.trim() ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.15s ease'
              }}
              data-testid="submit-comment-btn"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Publicando...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Comentar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
