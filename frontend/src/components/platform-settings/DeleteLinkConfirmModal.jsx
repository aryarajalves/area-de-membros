import React from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

export default function DeleteLinkConfirmModal({
  isOpen,
  linkTitle,
  onClose,
  onConfirm,
  loading = false,
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
      data-testid="delete-link-confirm-modal-backdrop"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
        }}
        data-testid="delete-link-confirm-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: '0 0 2px 0' }}>
              Excluir Link da Barra Lateral?
            </h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Esta ação removerá o link para todos os membros.
            </span>
          </div>
        </div>

        <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 22px 0' }}>
          Tem certeza que deseja remover o link <strong style={{ color: '#ffffff' }}>"{linkTitle}"</strong>? Ele deixará de ser exibido na seção de links da barra lateral para alunos e instrutores.
        </p>

        {/* Rodapé com 1 botão de fechar/cancelar + 1 de ação */}
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
              transition: 'all 0.2s ease',
            }}
            data-testid="cancel-delete-link-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '9px 18px',
              backgroundColor: '#dc2626',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
              transition: 'all 0.2s ease',
            }}
            data-testid="confirm-delete-link-btn"
          >
            {loading ? <Loader2 size={15} className="spin-animation" /> : <Trash2 size={15} />}
            {loading ? 'Excluindo...' : 'Sim, Excluir Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
