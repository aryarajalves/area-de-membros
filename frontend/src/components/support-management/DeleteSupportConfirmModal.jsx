import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteSupportConfirmModal({
  isOpen,
  title = 'Confirmar exclusão',
  message = 'Tem certeza que deseja apagar este item? Esta ação não pode ser desfeita.',
  confirmText = 'Sim, apagar',
  cancelText = 'Cancelar',
  loading = false,
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      data-testid="delete-support-confirm-modal"
    >
      <div
        className="modal-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444',
            marginBottom: '16px',
          }}
        >
          <AlertTriangle size={24} />
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
          {title}
        </h3>

        <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '24px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
            data-testid="cancel-delete-support-btn"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: '#dc2626',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            data-testid="confirm-delete-support-btn"
          >
            {loading ? <Loader2 size={16} className="spin-animation" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
