import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteTokenConfirmModal({
  isOpen,
  tokenName,
  loading,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      data-testid="delete-token-confirm-modal"
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Revogar Chave de API?
            </h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Esta ação invalidará a integração imediatamente.
            </span>
          </div>
        </div>

        <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 22px 0' }}>
          Tem certeza de que deseja revogar e excluir a chave <strong>"{tokenName}"</strong>? Qualquer sistema externo, webhook ou script que a utilize perderá o acesso.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '9px 18px',
              backgroundColor: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="cancel-delete-token-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '9px 20px',
              backgroundColor: '#ef4444',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
            }}
            data-testid="confirm-delete-token-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spin-animation" />
                <span>Revogando...</span>
              </>
            ) : (
              <span>Sim, Revogar Chave</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
