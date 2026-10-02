import React from 'react';
import { Heart, MessageSquare, CheckCircle2, HelpCircle, Star, ZoomIn } from 'lucide-react';
import { getInitials, formatTimeAgo } from './SupportTopicCard';

export default function SupportTopicOriginalPost({
  topic,
  currentUser,
  onToggleLike,
  onToggleStatus,
  onImageClick,
}) {
  if (!topic) return null;

  const isAuthor = currentUser?.id === topic.author.id;
  const isManager = ['superadmin', 'admin'].includes(currentUser?.role);
  const canManageStatus = isAuthor || isManager;
  const isResolved = topic.status === 'resolved';

  return (
    <div
      style={{
        backgroundColor: 'rgba(30, 41, 59, 0.4)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '20px',
      }}
      data-testid="support-topic-original-post"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: isResolved ? '#10b981' : '#0284c7',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '15px',
            }}
          >
            {getInitials(topic.author.name)}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>
                {topic.author.name}
              </span>
              {['admin', 'superadmin'].includes(topic.author.role) && (
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
              {isResolved && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.18)',
                    color: '#34d399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  data-testid="detail-resolved-badge"
                >
                  <CheckCircle2 size={11} />
                  Resolvida
                </span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              {formatTimeAgo(topic.created_at)}
            </span>
          </div>
        </div>

        {/* Botão de Alternar Status (Resolvida / Em Aberto) */}
        {canManageStatus && (
          <button
            type="button"
            onClick={onToggleStatus}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: isResolved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isResolved ? '#34d399' : '#fbbf24',
              border: `1px solid ${isResolved ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            data-testid="toggle-topic-status-btn"
            title={isResolved ? 'Clique para reabrir esta dúvida' : 'Clique para marcar como dúvida resolvida'}
          >
            <CheckCircle2 size={13} />
            <span>{isResolved ? '✓ Resolvida (Reabrir)' : 'Marcar como Resolvida'}</span>
          </button>
        )}
      </div>

      <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: '0 0 12px 0' }}>
        {topic.title}
      </h1>

      <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.6', margin: '0 0 16px 0', whiteSpace: 'pre-wrap' }}>
        {topic.content}
      </p>

      {/* Imagem anexa com clique para Lightbox */}
      {topic.image_url && (
        <div
          style={{
            marginBottom: '16px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            cursor: 'pointer',
            display: 'inline-block',
            maxWidth: '100%',
          }}
          onClick={() => onImageClick && onImageClick(topic.image_url, topic.title)}
          title="Clique para ver a imagem em tela cheia"
          data-testid="topic-attached-image"
        >
          <img
            src={topic.image_url}
            alt="Imagem da dúvida"
            style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', backgroundColor: '#020617', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '8px',
              right: '8px',
              backgroundColor: 'rgba(0,0,0,0.65)',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <ZoomIn size={13} /> Clique para ampliar
          </div>
        </div>
      )}

      {/* Barra de Ações do Tópico */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <button
          type="button"
          onClick={onToggleLike}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: topic.liked_by_me ? '#ef4444' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            padding: '6px 10px',
            borderRadius: '8px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = topic.liked_by_me ? '#ef4444' : '#94a3b8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          data-testid="detail-like-btn"
        >
          <Heart size={18} fill={topic.liked_by_me ? '#ef4444' : 'none'} color={topic.liked_by_me ? '#ef4444' : '#94a3b8'} />
          <span>{topic.likes_count || 0} curtidas</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '13px', fontWeight: 600 }}>
          <MessageSquare size={18} />
          <span>{topic.replies?.length || 0} respostas</span>
        </div>
      </div>
    </div>
  );
}
