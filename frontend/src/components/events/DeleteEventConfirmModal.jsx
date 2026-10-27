import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

export default function DeleteEventConfirmModal({
  isOpen,
  eventTitle,
  onConfirm,
  onCancel,
  isDeleting = false
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-event-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px'
      }}
      onClick={(e) => e.stopPropagation()} // NÃO fecha ao clicar no fundo
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #131b2e, #0b1120)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          padding: '28px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(239, 68, 68, 0.15)',
          color: '#f8fafc',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            color: '#ef4444'
          }}
        >
          <AlertTriangle size={28} />
        </div>

        <h3
          id="delete-event-modal-title"
          style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px', color: '#fff' }}
        >
          Excluir Evento
        </h3>

        <p style={{ fontSize: '0.92rem', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5' }}>
          Tem certeza de que deseja excluir o evento{' '}
          <strong style={{ color: '#f8fafc' }}>"{eventTitle}"</strong>?
          <br />
          Esta ação é irreversível e o evento não aparecerá mais para os alunos.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            type="button"
            data-testid="cancel-delete-event-btn"
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#e2e8f0',
              fontWeight: '600',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            data-testid="confirm-delete-event-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              flex: 1,
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              border: 'none',
              color: '#ffffff',
              fontWeight: '600',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)',
              opacity: isDeleting ? 0.7 : 1,
              transition: 'all 0.2s ease'
            }}
          >
            <Trash2 size={16} />
            {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
