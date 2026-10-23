import React from 'react';
import { Sparkles, ExternalLink, X, ArrowRight, Play } from 'lucide-react';

export default function CourseUpsellModal({
  isOpen,
  offer,
  targetActionUrl,
  onDismiss = () => {},
  onCtaClick = () => {}
}) {
  if (!isOpen || !offer) return null;

  const handleCta = () => {
    onCtaClick(offer);
    const destination = targetActionUrl || offer.button_url;
    if (destination) {
      window.open(destination, '_blank', 'noopener,noreferrer');
    }
  };

  const isVideo = offer.media_type === 'video';

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="course-upsell-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        data-testid="course-upsell-modal-content"
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: 'linear-gradient(180deg, #090d16 0%, #0f172a 100%)',
          border: '1.5px solid rgba(56, 189, 248, 0.45)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 30px rgba(56, 189, 248, 0.15)',
          color: '#f8fafc',
          position: 'relative'
        }}
      >
        {/* Botão de Fechar no Topo */}
        <button
          type="button"
          onClick={onDismiss}
          data-testid="close-upsell-btn"
          aria-label="Fechar"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <X size={16} />
        </button>

        {/* Badge de Marco de Aprendizado */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', background: 'rgba(56, 189, 248, 0.14)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38bdf8', fontSize: '11.5px', fontWeight: 700, marginBottom: '14px' }}>
          <Sparkles size={14} />
          Parabéns! Você alcançou {offer.progress_pct}% do curso
        </div>

        {/* Título Principal */}
        <h3
          data-testid="upsell-modal-title"
          style={{
            margin: '0 0 10px',
            fontSize: '20px',
            fontWeight: 800,
            lineHeight: 1.3,
            color: '#f8fafc',
            paddingRight: '36px'
          }}
        >
          {offer.title}
        </h3>

        {/* Mídia (Imagem ou Vídeo) */}
        <div
          data-testid="upsell-media-container"
          style={{
            margin: '14px 0',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: '#020617',
            maxHeight: '280px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isVideo ? (
            offer.media_url.includes('youtube.com') || offer.media_url.includes('youtu.be') || offer.media_url.includes('vimeo.com') ? (
              <iframe
                src={offer.media_url}
                title={offer.title}
                data-testid="upsell-video-iframe"
                style={{ width: '100%', height: '260px', border: 'none' }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={offer.media_url}
                controls
                autoPlay
                data-testid="upsell-native-video"
                style={{ width: '100%', maxHeight: '260px', objectFit: 'contain' }}
              />
            )
          ) : (
            <img
              src={offer.media_url}
              alt={offer.title}
              data-testid="upsell-banner-image"
              style={{
                width: '100%',
                maxHeight: '260px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
          )}
        </div>

        {/* Descrição / Pitch */}
        {offer.description && (
          <p
            data-testid="upsell-modal-description"
            style={{
              fontSize: '13px',
              lineHeight: 1.6,
              color: '#cbd5e1',
              margin: '0 0 18px',
              whiteSpace: 'pre-wrap'
            }}
          >
            {offer.description}
          </p>
        )}

        {/* Rodapé de Ações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={handleCta}
            data-testid="upsell-cta-btn"
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 18px rgba(37, 99, 235, 0.45)',
              transition: 'transform 0.15s ease'
            }}
          >
            <span>{offer.button_text || 'Quero Conhecer'}</span>
            <ExternalLink size={15} />
          </button>

          <button
            type="button"
            onClick={onDismiss}
            data-testid="upsell-continue-studies-btn"
            style={{
              width: '100%',
              padding: '9px 16px',
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>Continuar estudando minha aula</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
