import React, { useState } from 'react';
import {
  FileText,
  ExternalLink,
  MessageSquare,
  Play,
  Volume2,
} from 'lucide-react';

function formatMediaDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} às ${hours}:${mins}`;
  } catch {
    return '';
  }
}

export default function ChatMediaCardItem({ item, onSelectMedia }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      data-testid={`media-item-${item.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#111827',
        border: `1px solid ${isHovered ? 'rgba(56, 189, 248, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
        transform: isHovered ? 'translateY(-2px)' : 'none',
        boxShadow: isHovered ? '0 10px 20px rgba(0, 0, 0, 0.4)' : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Área da Mídia */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '140px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
        }}
      >
        {item.media_type === 'image' && (
          <img
            src={item.media_url}
            alt="Mídia"
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 0.3s ease',
            }}
          />
        )}

        {item.media_type === 'video' && (
          <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video src={item.media_url} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <Play size={16} fill="#ffffff" />
              </div>
            </div>
          </div>
        )}

        {item.media_type === 'audio' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <Volume2 size={20} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#c7d2fe', fontWeight: 500 }}>Áudio gravado</span>
          </div>
        )}

        {item.media_type === 'file' && (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #4c0519 0%, #0f172a 100%)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
              <FileText size={20} />
            </div>
            <span style={{ fontSize: '0.72rem', color: '#fecdd3', fontWeight: 500 }}>Documento</span>
          </div>
        )}

        {/* Hover Action Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: isHovered ? 1 : 0,
            pointerEvents: isHovered ? 'auto' : 'none',
            transition: 'opacity 0.2s ease',
          }}
        >
          <button
            type="button"
            onClick={() => onSelectMedia(item)}
            data-testid={`jump-to-msg-btn-${item.id}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <MessageSquare size={13} />
            <span>Ver no Chat</span>
          </button>
          <a
            href={item.media_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 500,
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              textDecoration: 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <ExternalLink size={12} />
            <span>Abrir Link</span>
          </a>
        </div>
      </div>

      {/* Info Footer */}
      <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
        {item.message ? (
          <p title={item.message} style={{ margin: 0, fontSize: '0.75rem', fontWeight: 500, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.message}
          </p>
        ) : (
          <span style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#64748b' }}>Sem legenda</span>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
          <span style={{ maxWidth: '90px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#cbd5e1' }}>
            {item.user?.name || 'Usuário'}
          </span>
          <span>{formatMediaDate(item.created_at)}</span>
        </div>
      </div>
    </div>
  );
}
