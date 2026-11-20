import React from 'react';
import { Share, MoreVertical, PlusSquare, Smartphone } from 'lucide-react';

export default function PwaInstallInstructionsModal({ isOpen, isIos, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      data-testid="pwa-instructions-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-instructions-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        data-testid="pwa-instructions-modal"
        style={{
          width: '100%',
          maxWidth: '400px',
          borderRadius: '18px',
          background: 'linear-gradient(160deg, rgba(15, 23, 42, 0.96) 0%, rgba(9, 13, 22, 0.98) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.32)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.55)',
          padding: '22px',
          color: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              backgroundColor: 'rgba(56, 189, 248, 0.16)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
              flexShrink: 0,
            }}
          >
            <Smartphone size={20} />
          </div>
          <div>
            <h3 id="pwa-instructions-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
              Adicionar à Tela Inicial
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
              {isIos ? 'Siga estes 2 passos no Safari (iPhone/iPad):' : 'Siga estes 2 passos no navegador:'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              1
            </span>
            <div style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.35, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {isIos ? (
                <>
                  Toque no botão <strong>Compartilhar</strong> <Share size={15} color="#38bdf8" /> na barra do Safari.
                </>
              ) : (
                <>
                  Toque no <strong>Menu</strong> <MoreVertical size={15} color="#38bdf8" /> no canto do navegador.
                </>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              2
            </span>
            <div style={{ fontSize: '0.86rem', color: '#e2e8f0', lineHeight: 1.35, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {isIos ? (
                <>
                  Selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare size={15} color="#38bdf8" />.
                </>
              ) : (
                <>
                  Selecione <strong>Adicionar à tela inicial</strong> <PlusSquare size={15} color="#38bdf8" />.
                </>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          data-testid="pwa-modal-close-btn"
          style={{
            width: '100%',
            padding: '10px 16px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            color: '#ffffff',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
