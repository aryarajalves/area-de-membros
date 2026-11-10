import React, { useRef } from 'react';
import { Maximize2, Play } from 'lucide-react';

export default function FeedVideoPlayer({ videoUrl, thumbnailUrl, onOpenLightbox }) {
  const videoRef = useRef(null);

  if (!videoUrl) return null;

  return (
    <div className="feed-video-player-container" data-testid="feed-video-player">
      <video
        ref={videoRef}
        src={videoUrl}
        poster={thumbnailUrl || undefined}
        controls
        preload="metadata"
        className="feed-video-element"
        data-testid="feed-video-element"
      />
      <button
        type="button"
        className="feed-video-zoom-btn"
        onClick={() => onOpenLightbox?.(0)}
        title="Ver vídeo em tela cheia"
        data-testid="feed-video-zoom-btn"
      >
        <Maximize2 size={14} />
      </button>
    </div>
  );
}
