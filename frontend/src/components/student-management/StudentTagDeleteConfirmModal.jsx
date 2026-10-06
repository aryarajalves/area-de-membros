import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function StudentTagDeleteConfirmModal({
  isOpen,
  tag,
  onClose,
  onConfirm,
  deleting = false,
}) {
  if (!isOpen || !tag) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '20px',
      }}
      data-testid="student-tag-delete-modal-backdrop"
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
        data-testid="student-tag-delete-confirm-modal"
      >
        {/* Ícone de Alerta */}
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <AlertTriangle size={28} />
        </div>

        {/* Título */}
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 700 }}>
          Excluir Etiqueta?
        </h3>

        {/* Mensagem e detalhes */}
        <p style={{ margin: '0 0 14px 0', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5 }}>
          Tem certeza de que deseja excluir a etiqueta{' '}
          <strong style={{ color: tag.color || '#f8fafc' }}>
            &ldquo;{tag.name}&rdquo;
          </strong>
          ?
        </p>

        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '20px',
            fontSize: '0.78rem',
            color: '#94a3b8',
            lineHeight: 1.4,
            textAlign: 'left',
          }}
        >
          Esta ação desvinculará a etiqueta de{' '}
          <strong style={{ color: '#f1f5f9' }}>
            {tag.student_count || 0} {tag.student_count === 1 ? 'aluno' : 'alunos'}
          </strong>
          . Os alunos continuarão normalmente com suas contas e acessos na plataforma.
        </div>

        {/* Botões de Ação (Apenas 1 botão de cancelar além do botão de confirmação) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer',
              opacity: deleting ? 0.6 : 1,
              transition: 'all 0.15s ease',
            }}
            data-testid="cancel-delete-tag-btn"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            style={{
              padding: '10px 22px',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              opacity: deleting ? 0.7 : 1,
              transition: 'all 0.15s ease',
            }}
            data-testid="confirm-delete-tag-btn"
          >
            {deleting ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
            {deleting ? 'Excluindo...' : 'Sim, Excluir'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
