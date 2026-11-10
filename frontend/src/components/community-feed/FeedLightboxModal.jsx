import React, { useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FeedLightboxModal({
  isOpen,
  mediaUrls = [],
  initialIndex = 0,
  mediaType = 'image',
  thumbnailUrl = null,
  onClose,
}) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaUrls.length - 1));
  }, [mediaUrls.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < mediaUrls.length - 1 ? prev + 1 : 0));
  }, [mediaUrls.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || !mediaUrls || mediaUrls.length === 0) return null;

  const currentUrl = mediaUrls[currentIndex] || mediaUrls[0];
  const isVideo = mediaType === 'video' || currentUrl.match(/\.(mp4|webm|mov|m4v)$/i);
  const isMulti = mediaUrls.length > 1;

  return (
    <div
      className="feed-lightbox-backdrop"
      data-testid="feed-lightbox-modal"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="feed-lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="feed-lightbox-close-btn"
          onClick={onClose}
          title="Fechar (Esc)"
          data-testid="feed-lightbox-close-btn"
        >
          <X size={24} />
        </button>

        {isMulti && (
          <div className="feed-lightbox-counter" data-testid="feed-lightbox-counter">
            {currentIndex + 1} / {mediaUrls.length}
          </div>
        )}

        <div className="feed-lightbox-media-wrapper">
          {isVideo ? (
            <video
              src={currentUrl}
              poster={thumbnailUrl || undefined}
              controls
              autoPlay
              className="feed-lightbox-video"
              data-testid="feed-lightbox-video"
            />
          ) : (
            <img
              src={currentUrl}
              alt={`Mídia ampliada ${currentIndex + 1}`}
              className="feed-lightbox-image"
              data-testid="feed-lightbox-image"
            />
          )}
        </div>

        {isMulti && (
          <>
            <button
              type="button"
              className="feed-lightbox-nav-btn prev"
              onClick={handlePrev}
              title="Anterior"
              data-testid="feed-lightbox-prev-btn"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              type="button"
              className="feed-lightbox-nav-btn next"
              onClick={handleNext}
              title="Próxima"
              data-testid="feed-lightbox-next-btn"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
