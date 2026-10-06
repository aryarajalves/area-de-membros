import React from 'react';
import { Video, Mic, FileText, X } from 'lucide-react';

export default function ChatAttachedMediaPreview({ attachedMedia, onRemove }) {
  if (!attachedMedia) return null;

  return (
    <div
      data-testid="chat-attached-media-preview"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 12px',
        marginBottom: '8px',
        backgroundColor: '#1e293b',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '8px',
        width: 'fit-content',
        maxWidth: '100%',
      }}
    >
      {attachedMedia.type === 'image' ? (
        <img
          src={attachedMedia.url}
          alt="Anexo"
          style={{
            width: '42px',
            height: '42px',
            objectFit: 'cover',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />
      ) : attachedMedia.type === 'video' ? (
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '6px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#3b82f6',
          }}
        >
          <Video size={20} />
        </div>
      ) : attachedMedia.type === 'audio' ? (
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981',
          }}
        >
          <Mic size={20} />
        </div>
      ) : (
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '6px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
          }}
        >
          <FileText size={20} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, marginRight: '8px' }}>
        <span
          style={{
            fontSize: '0.8125rem',
            color: '#f8fafc',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '220px',
          }}
        >
          {attachedMedia.name}
        </span>
        <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
          {attachedMedia.type === 'image'
            ? 'Imagem anexada'
            : attachedMedia.type === 'video'
            ? 'Vídeo anexado'
            : attachedMedia.type === 'audio'
            ? 'Áudio anexado'
            : 'Documento anexado'}
        </span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        title="Remover anexo"
        data-testid="chat-remove-media-btn"
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
      >
        <X size={16} />
      </button>
    </div>
  );
}
