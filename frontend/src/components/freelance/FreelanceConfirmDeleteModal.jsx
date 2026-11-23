import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function FreelanceConfirmDeleteModal({
  job,
  loading = false,
  onCancel,
  onConfirm,
}) {
  if (!job) return null;

  return (
    <div
      data-testid="freelance-delete-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        data-testid="freelance-delete-modal"
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#0c1322',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          padding: '22px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.65)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <AlertTriangle size={22} color="#f87171" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#ffffff' }}>
            Excluir Oportunidade
          </h3>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          Tem certeza que deseja excluir a vaga <strong>&ldquo;{job.title}&rdquo;</strong>? Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            data-testid="cancel-delete-freelance-btn"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirm(job.id)}
            disabled={loading}
            data-testid="confirm-delete-freelance-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            <span>Excluir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
