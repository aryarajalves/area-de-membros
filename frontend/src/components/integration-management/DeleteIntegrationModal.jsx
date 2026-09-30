import React from 'react';
import { Trash2 } from 'lucide-react';

export default function DeleteIntegrationModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px',
      }}
      data-testid="delete-confirm-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#f8fafc',
          padding: '24px',
          textAlign: 'center',
        }}
        role="dialog"
        aria-modal="true"
        data-testid="delete-confirm-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          <Trash2 size={24} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 700 }}>
          Excluir Integração?
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: '0.86rem', color: '#94a3b8' }}>
          Tem certeza que deseja apagar esta integração? Todo o histórico de logs e disparos associados será removido permanentemente.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 18px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            data-testid="cancel-delete-integration-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: '9px 20px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="confirm-delete-integration-btn"
          >
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}
