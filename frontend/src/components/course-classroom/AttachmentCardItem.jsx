import React from 'react';
import { ExternalLink, Trash2, Edit2, Brain } from 'lucide-react';
import { formatFileSize, getFileIcon } from './LessonAttachmentsManager';

export default function AttachmentCardItem({
  attachment: att,
  index: idx,
  isLightBg = false,
  isManager = false,
  onRename,
  onDelete
}) {
  const isHtml = att.file_type?.toLowerCase() === 'html' || (att.file_url || '').toLowerCase().includes('.html');
  const isMindmap = isHtml || (att.title || '').toLowerCase().includes('mapa mental');

  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  const iconBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)';
  const titleColor = isLightBg ? '#1e293b' : '#f8fafc';
  const descColor = isLightBg ? '#475569' : '#cbd5e1';
  const tagBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)';
  const tagColor = isLightBg ? '#64748b' : '#94a3b8';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        backgroundColor: isMindmap ? (isLightBg ? '#faf5ff' : 'rgba(168, 85, 247, 0.05)') : cardBg,
        border: isMindmap ? '1px solid rgba(168, 85, 247, 0.35)' : cardBorder,
        borderRadius: '8px',
        backdropFilter: isLightBg ? 'none' : 'blur(8px)',
        transition: 'all 0.15s ease'
      }}
      data-testid={`attachment-item-${att.id || idx}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: isMindmap ? 'rgba(168, 85, 247, 0.15)' : iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {isMindmap ? <Brain size={20} color="#a855f7" /> : getFileIcon(att.file_type)}
        </div>

        <div style={{ minWidth: 0 }}>
          <h4
            style={{
              fontSize: '13.5px',
              fontWeight: 600,
              color: titleColor,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {att.title || 'Documento Anexo'}
          </h4>
          {att.description && (
            <p
              style={{
                fontSize: '12px',
                color: descColor,
                margin: '3px 0 0 0',
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap'
              }}
              data-testid={`attachment-description-${att.id || idx}`}
            >
              {att.description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                color: isMindmap ? '#a855f7' : tagColor,
                backgroundColor: isMindmap ? 'rgba(168, 85, 247, 0.12)' : tagBg,
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              {isMindmap ? 'MAPA MENTAL IA' : (att.file_type || 'Arquivo')}
            </span>
            {att.file_size_bytes > 0 && (
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                {formatFileSize(att.file_size_bytes)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <a
          href={att.file_url}
          target="_blank"
          rel="noopener noreferrer"
          download={isHtml ? undefined : (att.title || 'documento')}
          className="primary-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '7px 14px',
            textDecoration: 'none',
            background: isMindmap ? 'linear-gradient(135deg, #9333ea 0%, #7c3aed 100%)' : undefined,
            border: isMindmap ? '1px solid rgba(168, 85, 247, 0.5)' : undefined,
            boxShadow: isMindmap ? '0 2px 8px rgba(147, 51, 234, 0.3)' : undefined
          }}
          data-testid={`access-attachment-btn-${att.id || idx}`}
        >
          <ExternalLink size={14} />
          <span>{isMindmap ? 'Visualizar Mapa Mental ↗' : (isHtml ? 'Abrir em Nova Aba ↗' : 'Acessar')}</span>
        </a>

        {isManager && att.id && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => onRename && onRename(att)}
              className="secondary-btn"
              style={{
                padding: '7px 10px',
                fontSize: '12px',
                color: '#60a5fa',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                backgroundColor: 'rgba(59, 130, 246, 0.08)'
              }}
              title="Renomear material complementar"
              data-testid={`rename-attachment-btn-${att.id}`}
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete && onDelete(att)}
              className="secondary-btn"
              style={{
                padding: '7px 10px',
                fontSize: '12px',
                color: '#ef4444',
                borderColor: 'rgba(239, 68, 68, 0.3)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)'
              }}
              title="Excluir documento anexo"
              data-testid={`delete-attachment-btn-${att.id}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
