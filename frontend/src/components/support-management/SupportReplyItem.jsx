import React from 'react';
import { Trash2, Star, CheckCircle, ZoomIn } from 'lucide-react';
import { getInitials, formatTimeAgo } from './SupportTopicCard';

export default function SupportReplyItem({
  reply,
  currentUser,
  topicAuthorId,
  onDeleteReply,
  onToggleSolution,
  onImageClick,
}) {
  const canDeleteReply =
    currentUser?.id === reply.author.id ||
    ['superadmin', 'admin'].includes(currentUser?.role);

  const canManageSolution =
    currentUser?.id === topicAuthorId ||
    ['superadmin', 'admin'].includes(currentUser?.role);

  const isSolution = Boolean(reply.is_solution);

  return (
    <div
      style={{
        padding: '16px 18px',
        backgroundColor: isSolution
          ? 'rgba(234, 179, 8, 0.08)'
          : reply.is_instructor_reply
          ? 'rgba(56, 189, 248, 0.05)'
          : 'rgba(30, 41, 59, 0.35)',
        border: isSolution
          ? '1px solid rgba(234, 179, 8, 0.4)'
          : `1px solid ${reply.is_instructor_reply ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)'}`,
        borderRadius: '12px',
        boxShadow: isSolution ? '0 0 15px rgba(234, 179, 8, 0.12)' : 'none',
        transition: 'all 0.2s ease',
      }}
      data-testid={`reply-item-${reply.id}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: isSolution ? '#eab308' : reply.is_instructor_reply ? '#0284c7' : '#475569',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '12px',
            }}
          >
            {getInitials(reply.author.name)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
                {reply.author.name}
              </span>
              {reply.is_instructor_reply && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  Instrutor
                </span>
              )}
              {isSolution && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(234, 179, 8, 0.2)',
                    color: '#facc15',
                    border: '1px solid rgba(234, 179, 8, 0.4)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  data-testid={`solution-badge-${reply.id}`}
                >
                  <Star size={11} fill="#facc15" />
                  Solução Oficial
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              {formatTimeAgo(reply.created_at)}
            </span>
          </div>
        </div>

        {/* Botões de Ação na Resposta */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {canManageSolution && onToggleSolution && (
            <button
              type="button"
              onClick={() => onToggleSolution(reply.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: isSolution ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: isSolution ? '#facc15' : '#94a3b8',
                border: isSolution ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              data-testid={`toggle-solution-btn-${reply.id}`}
              title={isSolution ? 'Desmarcar como solução oficial' : 'Marcar esta resposta como Solução Oficial'}
            >
              <Star size={12} fill={isSolution ? '#facc15' : 'none'} color={isSolution ? '#facc15' : '#94a3b8'} />
              <span>{isSolution ? 'Solução' : 'Marcar Solução'}</span>
            </button>
          )}

          {canDeleteReply && (
            <button
              type="button"
              onClick={() => onDeleteReply(reply)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444';
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              data-testid={`delete-reply-btn-${reply.id}`}
              title="Excluir resposta"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6', margin: '0 0 8px 0', whiteSpace: 'pre-wrap' }}>
        {reply.content}
      </p>

      {reply.image_url && (
        <div
          data-testid={`reply-attached-image-${reply.id}`}
          style={{
            marginTop: '8px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            cursor: onImageClick ? 'pointer' : 'default',
            display: 'inline-block',
            maxWidth: '100%',
          }}
          onClick={() => onImageClick && onImageClick(reply.image_url, 'Anexo da resposta')}
          title="Clique para ampliar a imagem"
        >
          <img
            src={reply.image_url}
            alt="Anexo da resposta"
            style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', backgroundColor: '#020617', display: 'block' }}
          />
          {onImageClick && (
            <div
              style={{
                position: 'absolute',
                bottom: '6px',
                right: '6px',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: '#fff',
                padding: '3px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ZoomIn size={12} /> Ampliar
            </div>
          )}
        </div>
      )}
    </div>
  );
}
