import React from 'react';
import { Copy, Loader2 } from 'lucide-react';

export default function FunnelDuplicateConfirmModal({
  isOpen,
  funnelName = '',
  onClose,
  onConfirm,
  duplicating = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '20px',
      }}
      data-testid="funnel-duplicate-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          padding: '26px',
          color: '#f8fafc',
          textAlign: 'center',
        }}
        data-testid="funnel-duplicate-modal"
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            color: '#a78bfa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            border: '1px solid rgba(139, 92, 246, 0.3)',
          }}
        >
          <Copy size={24} />
        </div>

        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 700 }}>
          Duplicar Funil de Mensagens?
        </h3>

        <p style={{ margin: '0 0 22px 0', fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
          Deseja criar uma cópia idêntica do funil <strong>"{funnelName}"</strong> com todos os seus nós, mensagens, mídias e conexões?
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={duplicating}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: duplicating ? 'not-allowed' : 'pointer',
            }}
            data-testid="cancel-duplicate-funnel-btn"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={duplicating}
            style={{
              padding: '9px 22px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: duplicating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
            }}
            data-testid="confirm-duplicate-funnel-btn"
          >
            {duplicating ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Duplicando...</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Sim, Duplicar Funil</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
