import React, { useState, useEffect } from 'react';
import { PlayCircle, Video as VideoIcon, Sparkles } from 'lucide-react';

function getEmbedUrl(videoUrl) {
  if (!videoUrl) return null;
  const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export default function TutorialVideoPreview({
  selectedFile,
  videoUrl,
  videoType = 'upload',
}) {
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setBlobUrl(null);
    }
  }, [selectedFile]);

  const hasSource = Boolean(selectedFile || videoUrl);
  if (!hasSource) return null;

  const embedUrl = videoType === 'url' && videoUrl ? getEmbedUrl(videoUrl) : null;
  const effectiveDirectSrc = blobUrl || (videoType === 'upload' ? videoUrl : !embedUrl ? videoUrl : null);

  return (
    <div
      className="tutorial-video-preview-wrapper"
      data-testid="tutorial-video-preview-container"
      style={{
        marginTop: '12px',
        padding: '12px',
        borderRadius: '10px',
        background: 'rgba(15, 23, 42, 0.65)',
        border: '1px solid rgba(59, 130, 246, 0.25)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          paddingBottom: '6px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <span
          style={{
            fontSize: '12.5px',
            color: '#93c5fd',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <PlayCircle size={15} color="#3b82f6" />
          <span>Renderização do Vídeo</span>
        </span>
        {selectedFile && (
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
          </span>
        )}
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#020617',
          maxHeight: '210px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title="Pré-visualização do Tutorial"
            style={{
              width: '100%',
              height: '200px',
              border: 'none',
              borderRadius: '8px',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            data-testid="tutorial-video-preview-iframe"
          />
        ) : effectiveDirectSrc ? (
          <video
            controls
            src={effectiveDirectSrc}
            preload="metadata"
            style={{
              width: '100%',
              maxHeight: '200px',
              borderRadius: '8px',
              backgroundColor: '#000',
              outline: 'none',
            }}
            data-testid="tutorial-video-preview-player"
          >
            Seu navegador não suporta a reprodução deste formato de vídeo.
          </video>
        ) : null}
      </div>
    </div>
  );
}
