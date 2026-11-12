import React from 'react';
import { X, ChevronLeft, ChevronRight, Image } from 'lucide-react';

export default function FeedMediaReorderGrid({
  mediaUrls = [],
  mediaType = 'none',
  mediaThumbnailUrl = null,
  isUploading = false,
  thumbnailInputRef,
  onRemoveMedia,
  onMoveMedia,
  onRemoveThumbnail,
}) {
  if (!mediaUrls || mediaUrls.length === 0) return null;

  return (
    <div className="feed-create-media-preview" data-testid="feed-create-media-preview">
      {mediaType === 'video' ? (
        <div className="feed-video-preview-wrapper" data-testid="feed-video-preview-wrapper">
          <div className="feed-media-preview-item video">
            <video
              src={mediaUrls[0]}
              poster={mediaThumbnailUrl || undefined}
              className="feed-preview-video-thumb"
            />
            <span className="feed-media-preview-badge">Vídeo</span>
            <button
              type="button"
              className="feed-media-preview-remove"
              onClick={() => onRemoveMedia(0)}
              title="Remover vídeo"
              data-testid="feed-remove-media-btn"
            >
              <X size={14} />
            </button>
          </div>

          {/* Capa / Thumbnail do Vídeo */}
          {mediaThumbnailUrl ? (
            <div className="feed-media-preview-item thumbnail" data-testid="feed-thumbnail-preview-item">
              <img src={mediaThumbnailUrl} alt="Capa do Vídeo" />
              <span className="feed-media-preview-badge thumb">Capa</span>
              <button
                type="button"
                className="feed-media-preview-remove"
                onClick={onRemoveThumbnail}
                title="Remover capa"
                data-testid="feed-remove-thumbnail-btn"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="feed-add-thumb-card"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={isUploading}
              title="Definir imagem de capa para o vídeo"
              data-testid="feed-add-thumbnail-btn"
            >
              <Image size={18} className="feed-add-thumb-icon" />
              <span>+ Capa / Thumbnail</span>
            </button>
          )}
        </div>
      ) : (
        mediaUrls.map((url, idx) => (
          <div key={idx} className="feed-media-preview-item" data-testid={`feed-media-item-${idx}`}>
            <img src={url} alt={`Mídia ${idx + 1}`} />
            
            {/* Enumeração da posição da mídia */}
            <span className="feed-media-position-badge" title={`Posição ${idx + 1} de ${mediaUrls.length}`}>
              #{idx + 1}
            </span>

            {/* Ações de Reordenação e Remoção */}
            <div className="feed-media-reorder-actions">
              {idx > 0 && (
                <button
                  type="button"
                  className="feed-media-reorder-btn move-left"
                  onClick={() => onMoveMedia(idx, idx - 1)}
                  title="Mover para esquerda / antes"
                  data-testid={`feed-move-media-prev-${idx}`}
                >
                  <ChevronLeft size={13} />
                </button>
              )}
              {idx < mediaUrls.length - 1 && (
                <button
                  type="button"
                  className="feed-media-reorder-btn move-right"
                  onClick={() => onMoveMedia(idx, idx + 1)}
                  title="Mover para direita / depois"
                  data-testid={`feed-move-media-next-${idx}`}
                >
                  <ChevronRight size={13} />
                </button>
              )}
              <button
                type="button"
                className="feed-media-preview-remove"
                onClick={() => onRemoveMedia(idx)}
                title="Remover foto"
                data-testid={`feed-remove-media-btn-${idx}`}
              >
                <X size={13} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
