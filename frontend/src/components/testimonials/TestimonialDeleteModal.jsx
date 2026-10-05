import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function TestimonialDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  deleting = false
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }}
      data-testid="testimonial-delete-modal-overlay"
    >
      <div
        className="modal-container"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#0d1527',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#f8fafc',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
        data-testid="testimonial-delete-modal"
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            color: '#ef4444'
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
          Excluir Depoimento?
        </h3>
        <p style={{ margin: '0 0 24px 0', fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
          Esta ação não pode ser desfeita. O depoimento será removido definitivamente da plataforma.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            style={{
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontWeight: 600
            }}
            data-testid="cancel-delete-testimonial-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: '#ef4444',
              border: 'none',
              color: '#ffffff',
              cursor: deleting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
            data-testid="confirm-delete-testimonial-btn"
          >
            <Trash2 size={16} />
            <span>{deleting ? 'Excluindo...' : 'Sim, Excluir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
