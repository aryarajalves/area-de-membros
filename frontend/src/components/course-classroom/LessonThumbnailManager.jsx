import React, { useState } from 'react';
import { Image as ImageIcon, Upload, Trash2, CheckCircle2, Info } from 'lucide-react';
import { UploadProgressModal, FileDeleteConfirmModal } from '../common/FeedbackModals';

export default function LessonThumbnailManager({
  thumbnailUrl,
  onChange,
  onUploadThumbnail,
  isLightBg = false
}) {
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const textColor = isLightBg ? '#1e293b' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação de formato
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      alert('Formato de imagem inválido. Utilize JPG, PNG ou WEBP.');
      return;
    }

    // Validação de tamanho (máximo 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('A imagem de capa excede o limite máximo permitido de 5 MB.');
      return;
    }

    setUploading(true);
    try {
      const url = await onUploadThumbnail(file);
      if (url) {
        onChange(url);
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmRemove = () => {
    onChange('');
    setShowDeleteConfirm(false);
  };

  return (
    <div style={{
      border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      padding: '14px',
      backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)'
    }} data-testid="lesson-thumbnail-manager">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ImageIcon size={16} color="#38bdf8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
            Capa do Vídeo da Aula (Thumbnail / Poster)
          </span>
        </div>
      </div>

      {/* Dimensões e Requisitos Técnicos */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        backgroundColor: isLightBg ? '#eff6ff' : 'rgba(56, 189, 248, 0.1)',
        border: isLightBg ? '1px solid #bfdbfe' : '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '6px',
        padding: '8px 10px',
        marginBottom: '12px',
        fontSize: '11.5px',
        color: isLightBg ? '#1e40af' : '#bae6fd'
      }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
        <span>
          <strong>Tamanho recomendado:</strong> 1280 × 720 pixels (Proporção 16:9).
          Formatos: JPG, PNG ou WEBP (máx. 5 MB). Exibida como capa antes do vídeo iniciar.
        </span>
      </div>

      {thumbnailUrl ? (
        <div style={{
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)',
          backgroundColor: '#0f172a',
          aspectRatio: '16 / 9',
          maxHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img
            src={thumbnailUrl}
            alt="Capa da aula"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            data-testid="lesson-thumbnail-preview"
          />
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '6px'
          }}>
            <button
              type="button"
              onClick={handleRemove}
              className="secondary-btn"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.9)',
                color: '#ffffff',
                border: 'none',
                padding: '4px 8px',
                fontSize: '11.5px',
                gap: '4px'
              }}
              data-testid="remove-lesson-thumbnail-btn"
              title="Remover capa"
            >
              <Trash2 size={13} />
              <span>Remover Capa</span>
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          border: isLightBg ? '2px dashed #cbd5e1' : '2px dashed rgba(255, 255, 255, 0.18)',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center',
          backgroundColor: isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.5)'
        }}>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="lesson-thumbnail-file-input"
            data-testid="lesson-thumbnail-file-input"
          />
          <label
            htmlFor="lesson-thumbnail-file-input"
            className="secondary-btn"
            style={{
              display: 'inline-flex',
              cursor: uploading ? 'wait' : 'pointer',
              fontSize: '12.5px',
              padding: '8px 16px',
              gap: '6px'
            }}
          >
            <Upload size={14} />
            <span>{uploading ? 'Enviando capa...' : 'Fazer Upload da Capa'}</span>
          </label>
          <p style={{ fontSize: '11px', color: subTextColor, margin: '8px 0 0 0' }}>
            Nenhuma imagem selecionada. Deixe em branco para usar o primeiro frame do vídeo.
          </p>
        </div>
      )}

      {/* Modal de Progresso de Upload da Capa */}
      <UploadProgressModal
        isOpen={uploading}
        title="Enviando capa da aula..."
        subtitle="Aguarde o envio seguro para o Backblaze B2 ser concluído."
      />

      {/* Modal de Confirmação de Remoção da Capa */}
      <FileDeleteConfirmModal
        isOpen={showDeleteConfirm}
        title="Remover Capa da Aula?"
        message="Tem certeza que deseja remover a imagem de capa desta aula?"
        onConfirm={handleConfirmRemove}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
