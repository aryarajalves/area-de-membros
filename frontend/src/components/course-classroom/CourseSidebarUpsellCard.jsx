import React, { useState } from 'react';
import { Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { clickUpsellOffer } from '../course-management/courseUpsellApi';

export default function CourseSidebarUpsellCard({
  offer,
  courseId,
  isLightBg = false,
  onOfferClick = null
}) {
  const [clicking, setClicking] = useState(false);

  if (!offer) return null;

  const handleClick = async (e) => {
    e.stopPropagation();
    if (clicking) return;

    setClicking(true);
    try {
      if (offer.id) {
        await clickUpsellOffer(offer.id);
      }
    } catch (err) {
      // Ignora erro no rastreamento para não bloquear a navegação do aluno
    } finally {
      setClicking(false);
    }

    if (onOfferClick) {
      onOfferClick(offer);
    }

    const destinationUrl = offer.button_url || offer.target_action_url || '';
    if (destinationUrl) {
      window.open(destinationUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const bgStyle = isLightBg
    ? 'linear-gradient(145deg, #f8fafc 0%, #edf2f7 100%)'
    : 'linear-gradient(145deg, #142038 0%, #0c1424 100%)';
  const borderColor = isLightBg
    ? 'rgba(2, 132, 199, 0.35)'
    : 'rgba(56, 189, 248, 0.45)';
  const titleColor = isLightBg ? '#0f172a' : '#ffffff';
  const descColor = isLightBg ? '#475569' : '#94a3b8';

  return (
    <div
      data-testid="sidebar-upsell-card"
      style={{
        background: bgStyle,
        border: `1.5px solid ${borderColor}`,
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Badge Topo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Sparkles size={12} color="#38bdf8" />
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 800,
            letterSpacing: '0.6px',
            color: '#38bdf8',
            textTransform: 'uppercase'
          }}
        >
          Próximo Passo na Jornada
        </span>
      </div>

      {/* Imagem / Banner Opcional */}
      {offer.media_type === 'image' && offer.media_url && (
        <div
          style={{
            width: '100%',
            height: '76px',
            borderRadius: '8px',
            overflow: 'hidden',
            background: '#020617',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <img
            src={offer.media_url}
            alt={offer.title}
            data-testid="sidebar-upsell-image"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}

      {/* Título da Oferta */}
      <div
        data-testid="sidebar-upsell-title"
        style={{
          fontSize: '13px',
          fontWeight: 700,
          color: titleColor,
          lineHeight: '1.3'
        }}
      >
        {offer.title}
      </div>

      {/* Descrição Curta */}
      {offer.description && (
        <p
          data-testid="sidebar-upsell-desc"
          style={{
            fontSize: '11.5px',
            color: descColor,
            margin: 0,
            lineHeight: '1.35',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {offer.description}
        </p>
      )}

      {/* Botão de Ação CTA */}
      <button
        type="button"
        onClick={handleClick}
        disabled={clicking}
        data-testid="sidebar-upsell-action-btn"
        style={{
          marginTop: '2px',
          padding: '7px 12px',
          borderRadius: '7px',
          background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
          border: 'none',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxShadow: '0 2px 10px rgba(37, 99, 235, 0.4)',
          transition: 'all 0.15s ease'
        }}
      >
        <span>{offer.button_text || 'Quero Conhecer'}</span>
        <ArrowRight size={13} />
      </button>
    </div>
  );
}
