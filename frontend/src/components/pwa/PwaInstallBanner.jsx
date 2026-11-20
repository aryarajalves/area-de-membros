import React from 'react';
import { Smartphone, Download } from 'lucide-react';

export default function PwaInstallBanner({ onInstall, onDismiss }) {
  return (
    <div
      data-testid="pwa-install-banner"
      role="region"
      aria-label="Instalar atalho do aplicativo"
      style={{
        margin: '12px 16px 4px',
        padding: '12px 14px',
        borderRadius: '14px',
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.22) 0%, rgba(15, 23, 42, 0.88) 100%)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(2, 6, 23, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        color: '#f8fafc',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 220px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(56, 189, 248, 0.18)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8',
            flexShrink: 0,
          }}
        >
          <Smartphone size={18} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.25 }}>
            Acesse mais rápido pelo celular
          </div>
          <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.3 }}>
            Adicione um atalho na tela inicial sem precisar da loja de apps.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onDismiss}
          data-testid="pwa-banner-dismiss-btn"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            color: '#cbd5e1',
            borderRadius: '9px',
            padding: '7px 12px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Agora não
        </button>
        <button
          type="button"
          onClick={onInstall}
          data-testid="pwa-banner-install-btn"
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #0284c7 100%)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            color: '#ffffff',
            borderRadius: '9px',
            padding: '7px 14px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
          }}
        >
          <Download size={14} />
          <span>Instalar Atalho</span>
        </button>
      </div>
    </div>
  );
}
