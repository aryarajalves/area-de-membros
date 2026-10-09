import React from 'react';
import { PlayCircle, Trash2 } from 'lucide-react';

/**
 * Utilitário para extrair ID do YouTube ou Vimeo para renderização em iframe,
 * caso o gestor insira link externo.
 */
function getEmbedUrl(url = '') {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`;
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  return null;
}

export default function LessonVideoPreviewPlayer({
  videoUrl,
  onRemove,
  isLightBg = false
}) {
  if (!videoUrl) return null;

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div
      data-testid="lesson-video-preview-container"
      style={{
        marginTop: '12px',
        borderRadius: '10px',
        overflow: 'hidden',
        border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.14)',
        backgroundColor: isLightBg ? '#f8fafc' : '#080c14',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)'
      }}
    >
      {/* Barra superior de identificação do vídeo anexado */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)',
          borderBottom: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <PlayCircle size={15} color="#38bdf8" />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: isLightBg ? '#0f172a' : '#f8fafc',
              letterSpacing: '0.01em'
            }}
          >
            Vídeo Anexado à Aula
          </span>
        </div>

        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="table-action-btn"
            data-testid="remove-video-btn"
            style={{
              border: 'none',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '4px 10px',
              borderRadius: '6px',
              transition: 'background-color 0.2s'
            }}
            title="Remover vídeo anexado desta aula"
          >
            <Trash2 size={12} />
            <span>Remover Vídeo</span>
          </button>
        )}
      </div>

      {/* Área de renderização direta do vídeo */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          backgroundColor: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Vídeo da Aula"
            data-testid="lesson-video-preview-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        ) : (
          <video
            src={videoUrl}
            controls
            preload="metadata"
            playsInline
            data-testid="lesson-video-preview-player"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
      </div>
    </div>
  );
}
