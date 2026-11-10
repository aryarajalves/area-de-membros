import React, { useState } from 'react';
import { Video, Image as ImageIcon, ExternalLink, Play, Maximize2, X } from 'lucide-react';

export default function IntroductionMediaEmbed({
  mediaType = 'none',
  mediaUrl,
  videoEmbedUrl,
  title = 'Mídia da apresentação',
}) {
  const [zoomOpen, setZoomOpen] = useState(false);

  // Sem mídia
  if (mediaType === 'none' && !mediaUrl && !videoEmbedUrl) {
    return null;
  }

  // Embeds de Vídeo Externos (YouTube, Loom, Vimeo)
  if (['youtube', 'loom', 'vimeo'].includes(mediaType) || videoEmbedUrl) {
    const embedSrc = videoEmbedUrl || mediaUrl;
    if (!embedSrc) return null;

    return (
      <div className="intro-media-embed-container" data-testid="intro-media-embed-video">
        <div className="intro-media-responsive-video">
          <iframe
            src={embedSrc}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="intro-video-iframe"
          />
        </div>
      </div>
    );
  }

  // Vídeo em arquivo direto (MP4, WebM)
  if (mediaType === 'video' && mediaUrl) {
    return (
      <div className="intro-media-embed-container" data-testid="intro-media-embed-local-video">
        <video
          src={mediaUrl}
          controls
          preload="metadata"
          className="intro-native-video-player"
          data-testid="intro-native-video"
        >
          Seu navegador não suporta a reprodução deste vídeo.
        </video>
      </div>
    );
  }

  // Foto / Imagem
  if (mediaType === 'image' && mediaUrl) {
    return (
      <>
        <div className="intro-media-image-wrapper" data-testid="intro-media-embed-image">
          <img
            src={mediaUrl}
            alt={title}
            className="intro-media-preview-img"
            onClick={() => setZoomOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setZoomOpen(true);
            }}
          />
          <button
            type="button"
            className="intro-media-zoom-btn"
            onClick={() => setZoomOpen(true)}
            title="Ampliar imagem"
            aria-label="Ampliar imagem"
          >
            <Maximize2 size={16} />
          </button>
        </div>

        {/* Modal de Zoom Lightbox */}
        {zoomOpen && (
          <div
            className="intro-lightbox-backdrop"
            onClick={() => setZoomOpen(false)}
            data-testid="intro-lightbox-backdrop"
          >
            <button
              type="button"
              className="intro-lightbox-close-btn"
              onClick={() => setZoomOpen(false)}
              aria-label="Fechar zoom"
            >
              <X size={24} />
            </button>
            <img
              src={mediaUrl}
              alt={title}
              className="intro-lightbox-full-img"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    );
  }

  return null;
}
