import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function FunnelDeleteConfirmModal({
  isOpen,
  funnelName = '',
  onClose,
  onConfirm,
  deleting = false,
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
      data-testid="funnel-delete-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)',
          padding: '26px',
          color: '#f8fafc',
          textAlign: 'center',
        }}
        data-testid="funnel-delete-modal"
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <AlertTriangle size={26} />
        </div>

        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 700 }}>
          Excluir Funil de Mensagens?
        </h3>

        <p style={{ margin: '0 0 22px 0', fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
          Tem certeza que deseja excluir o funil <strong>"{funnelName}"</strong>? Todos os nós e histórico de execuções deste fluxo serão removidos permanentemente.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="cancel-delete-funnel-btn"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            style={{
              padding: '9px 22px',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            data-testid="confirm-delete-funnel-btn"
          >
            <Trash2 size={16} />
            <span>{deleting ? 'Excluindo...' : 'Sim, Excluir Funil'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
