import React from 'react';
import { Upload, X, Image } from 'lucide-react';

export default function CourseModalMediaTab({
  thumbnailUrl,
  coverImageUrl,
  setCoverImageUrl,
  uploading,
  onUploadThumbnail,
  onUploadCoverImage,
  onPromptDeleteThumbnail,
  onPromptDeleteCover
}) {
  return (
    <div data-testid="course-modal-tab-panel-media">
      {/* Upload de Capa Principal (Card do Curso) */}
      <div className="form-group">
        <label>Imagem de Capa do Card (Thumbnail do Curso)</label>
        <div className="thumbnail-size-notice" style={{ marginBottom: '10px' }}>
          <strong>Dimensões recomendadas:</strong> 1280 × 720 pixels (Proporção 16:9).<br />
          <strong>Formatos aceitos:</strong> JPG, PNG, WEBP (Até 5 MB).
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label className="primary-btn" style={{ cursor: 'pointer', padding: '8px 14px', fontSize: '13px' }}>
            <Upload size={16} />
            <span>{uploading ? 'Enviando imagem...' : 'Escolher do Computador'}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={onUploadThumbnail}
              style={{ display: 'none' }}
              disabled={uploading}
              data-testid="upload-thumbnail-input"
            />
          </label>

          {thumbnailUrl && (
            <button
              type="button"
              className="secondary-btn"
              onClick={onPromptDeleteThumbnail}
              style={{ padding: '8px 12px', fontSize: '12px', color: '#ef4444' }}
              data-testid="remove-course-thumbnail-btn"
            >
              <X size={14} /> Remover Capa
            </button>
          )}
        </div>

        {thumbnailUrl && (
          <div className="thumbnail-preview-box" style={{ marginTop: '12px' }}>
            <img src={thumbnailUrl} alt="Pré-visualização da Capa" data-testid="thumbnail-preview-img" />
          </div>
        )}
      </div>

      {/* Imagem de Banner Hero do Topo (Opcional - Estilo Netflix) */}
      {setCoverImageUrl && (
        <div className="form-group" style={{ marginTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Image size={15} style={{ color: '#2563eb' }} />
            <span>Banner Hero de Fundo do Curso (Estilo Netflix - Opcional)</span>
          </label>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
            Imagem panorâmica exibida no topo da sala de aula com degradê cinemático. Se não informada, usará a capa principal.
          </p>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '8px' }}>
            {onUploadCoverImage && (
              <label className="secondary-btn" style={{ cursor: 'pointer', padding: '7px 12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={14} />
                <span>Enviar Banner do PC</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onUploadCoverImage}
                  style={{ display: 'none' }}
                  disabled={uploading}
                  data-testid="upload-cover-input"
                />
              </label>
            )}

            {coverImageUrl && (
              <button
                type="button"
                className="secondary-btn"
                onClick={onPromptDeleteCover}
                style={{ padding: '7px 10px', fontSize: '12px', color: '#ef4444' }}
                data-testid="remove-course-cover-btn"
              >
                <X size={14} /> Remover Banner
              </button>
            )}
          </div>

          {coverImageUrl && (
            <div className="thumbnail-preview-box" style={{ marginTop: '8px', maxHeight: '130px', overflow: 'hidden' }}>
              <img src={coverImageUrl} alt="Pré-visualização do Banner Hero" style={{ width: '100%', objectFit: 'cover' }} data-testid="cover-preview-img" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
