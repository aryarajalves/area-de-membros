import React from 'react';
import { X, ZoomIn } from 'lucide-react';

export default function SupportImageLightboxModal({ isOpen, imageUrl, title, onClose }) {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px',
      }}
      data-testid="support-image-lightbox-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          position: 'relative',
          maxWidth: '92vw',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="support-image-lightbox-content"
      >
        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '-46px',
            right: 0,
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: '50%',
            color: '#ffffff',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.2s ease',
          }}
          data-testid="close-lightbox-btn"
          title="Fechar visualização da imagem"
        >
          <X size={20} />
        </button>

        {/* Imagem Ampliada */}
        <img
          src={imageUrl}
          alt={title || 'Visualização ampliada'}
          style={{
            maxWidth: '100%',
            maxHeight: '82vh',
            objectFit: 'contain',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: '#020617',
          }}
          data-testid="lightbox-image"
        />

        {title && (
          <span style={{ marginTop: '10px', fontSize: '0.85rem', color: '#cbd5e1', textAlign: 'center' }}>
            {title}
          </span>
        )}
      </div>
    </div>
  );
}
