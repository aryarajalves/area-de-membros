import React from 'react';
import { Download, FileText, FileSpreadsheet, FileArchive, File, ExternalLink, Paperclip } from 'lucide-react';
import { formatFileSize, getFileIcon } from './LessonAttachmentsManager';

export default function LessonAttachmentsList({
  attachments = [],
  isLightBg = false
}) {
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  const iconBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)';
  const titleColor = isLightBg ? '#1e293b' : '#f8fafc';
  const descColor = isLightBg ? '#475569' : '#cbd5e1';
  const tagBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)';
  const tagColor = isLightBg ? '#64748b' : '#94a3b8';

  if (!attachments || attachments.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '40px 16px',
        backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
        borderRadius: '8px',
        border: isLightBg ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.12)',
        color: isLightBg ? '#64748b' : '#94a3b8'
      }} data-testid="empty-attachments-state">
        <Paperclip size={32} color={isLightBg ? '#94a3b8' : '#64748b'} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
        <p style={{ fontSize: '13.5px', fontWeight: 600, color: isLightBg ? '#334155' : '#f8fafc', margin: '0 0 4px 0' }}>
          Nenhum material complementar anexado
        </p>
        <p style={{ fontSize: '12.5px', margin: 0 }}>
          Esta aula não possui documentos ou arquivos complementares para download.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} data-testid="lesson-attachments-list">
      {attachments.map((att, idx) => (
        <div
          key={att.id || idx}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            backgroundColor: cardBg,
            border: cardBorder,
            borderRadius: '8px',
            backdropFilter: isLightBg ? 'none' : 'blur(8px)',
            transition: 'all 0.15s ease'
          }}
          data-testid={`attachment-item-${att.id || idx}`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {getFileIcon(att.file_type)}
            </div>

            <div style={{ minWidth: 0 }}>
              <h4 style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: titleColor,
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {att.title || 'Documento Anexo'}
              </h4>
              {att.description && (
                <p style={{
                  fontSize: '12px',
                  color: descColor,
                  margin: '3px 0 0 0',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-wrap'
                }} data-testid={`attachment-description-${att.id || idx}`}>
                  {att.description}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: tagColor,
                  backgroundColor: tagBg,
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  {att.file_type || 'Arquivo'}
                </span>
                {att.file_size_bytes > 0 && (
                  <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    {formatFileSize(att.file_size_bytes)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <a
            href={att.file_url}
            target="_blank"
            rel="noopener noreferrer"
            download={att.title || 'documento'}
            className="primary-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '7px 14px',
              textDecoration: 'none',
              flexShrink: 0
            }}
            data-testid={`access-attachment-btn-${att.id || idx}`}
          >
            <ExternalLink size={14} />
            <span>Acessar</span>
          </a>
        </div>
      ))}
    </div>
  );
}
