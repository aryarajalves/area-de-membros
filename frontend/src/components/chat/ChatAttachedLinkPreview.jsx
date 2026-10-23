import React from 'react';
import { PlayCircle, BookOpen, Compass, Link2, X } from 'lucide-react';

export default function ChatAttachedLinkPreview({ attachedLink, onRemove }) {
  if (!attachedLink) return null;

  const url = attachedLink.url || '';
  let Icon = Link2;
  let iconColor = '#38bdf8';
  let iconBg = 'rgba(56, 189, 248, 0.15)';
  let typeLabel = 'Link vinculado';

  let courseMeta = attachedLink.courseTitle || null;
  let moduleMeta = attachedLink.moduleTitle || null;
  if (url.startsWith('internal://lesson/')) {
    Icon = PlayCircle;
    iconColor = '#22c55e';
    iconBg = 'rgba(34, 197, 94, 0.15)';
    if (!courseMeta || !moduleMeta) {
      try {
        const urlObj = new URL(url.replace('internal://', 'http://internal/'));
        courseMeta = courseMeta || urlObj.searchParams.get('course') || urlObj.searchParams.get('c');
        moduleMeta = moduleMeta || urlObj.searchParams.get('module') || urlObj.searchParams.get('m');
      } catch {
        // ignore
      }
    }
    const contextPrefix = [courseMeta, moduleMeta].filter(Boolean).join(' › ');
    typeLabel = contextPrefix ? `Aula vinculada • ${contextPrefix}` : 'Aula vinculada';
  } else if (url.startsWith('internal://course/')) {
    Icon = BookOpen;
    iconColor = '#38bdf8';
    iconBg = 'rgba(56, 189, 248, 0.15)';
    typeLabel = 'Curso vinculado';
  } else if (url.startsWith('internal://tab/')) {
    Icon = Compass;
    iconColor = '#a855f7';
    iconBg = 'rgba(168, 85, 247, 0.15)';
    typeLabel = 'Aba da plataforma vinculada';
  }

  return (
    <div
      data-testid="chat-attached-link-preview"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '8px 12px',
        marginBottom: '8px',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '10px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
        width: 'fit-content',
        maxWidth: '100%',
        boxSizing: 'border-box',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: iconColor,
            flexShrink: 0,
          }}
        >
          <Icon size={18} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span
            data-testid="attached-link-label"
            style={{
              fontSize: '0.84rem',
              color: '#f8fafc',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '360px',
            }}
          >
            {attachedLink.label}
          </span>
          <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
            {typeLabel}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        data-testid="chat-attached-link-remove-btn"
        title="Remover link anexado"
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ef4444';
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#94a3b8';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
