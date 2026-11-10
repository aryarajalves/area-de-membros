import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export default function FeedMediaCarousel({ mediaUrls = [], onOpenLightbox }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!mediaUrls || mediaUrls.length === 0) return null;

  const total = mediaUrls.length;

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  };

  const handleDotClick = (idx, e) => {
    e.stopPropagation();
    setCurrentIndex(idx);
  };

  const currentUrl = mediaUrls[currentIndex];

  return (
    <div
      className="feed-carousel-container"
      data-testid="feed-media-carousel"
      onClick={() => onOpenLightbox?.(currentIndex)}
    >
      <div className="feed-carousel-slide">
        <img
          src={currentUrl}
          alt={`Slide ${currentIndex + 1}`}
          className="feed-carousel-image"
          loading="lazy"
        />

        {/* Badge contador de slides */}
        <div className="feed-carousel-counter" data-testid="feed-carousel-counter">
          {currentIndex + 1} / {total}
        </div>

        {/* Botão de zoom / fullscreen */}
        <button
          type="button"
          className="feed-carousel-zoom-btn"
          title="Ver em tela cheia"
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox?.(currentIndex);
          }}
          data-testid="feed-carousel-zoom-btn"
        >
          <Maximize2 size={14} />
        </button>

        {/* Setas de navegação */}
        {total > 1 && (
          <>
            <button
              type="button"
              className="feed-carousel-arrow prev"
              onClick={handlePrev}
              title="Imagem anterior"
              data-testid="feed-carousel-prev-btn"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className="feed-carousel-arrow next"
              onClick={handleNext}
              title="Próxima imagem"
              data-testid="feed-carousel-next-btn"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Indicadores de bolinha (dots) */}
      {total > 1 && (
        <div className="feed-carousel-dots" data-testid="feed-carousel-dots">
          {mediaUrls.map((_, idx) => (
            <button
              key={idx}
              type="button"
              className={`feed-carousel-dot ${idx === currentIndex ? 'active' : ''}`}
              onClick={(e) => handleDotClick(idx, e)}
              title={`Ir para imagem ${idx + 1}`}
              data-testid={`feed-carousel-dot-${idx}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
