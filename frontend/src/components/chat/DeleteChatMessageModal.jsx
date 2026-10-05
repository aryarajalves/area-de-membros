import React from 'react';
import { Trash2, AlertCircle } from 'lucide-react';

export default function DeleteChatMessageModal({
  isOpen,
  loading = false,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      data-testid="delete-chat-modal-overlay"
      onClick={(e) => {
        // Regra UX: Não fecha ao clicar fora do painel
        e.stopPropagation();
      }}
    >
      <div
        className="modal-content confirm-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-chat-modal-title"
        data-testid="delete-chat-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '420px',
          width: '90%',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            border: '1px solid rgba(239, 68, 68, 0.25)',
          }}
        >
          <Trash2 size={28} />
        </div>

        <h3
          id="delete-chat-modal-title"
          data-testid="delete-chat-modal-title"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#ffffff',
            marginBottom: '8px',
          }}
        >
          Excluir Mensagem?
        </h3>

        <p
          data-testid="delete-chat-modal-desc"
          style={{
            fontSize: '0.9rem',
            color: '#94a3b8',
            lineHeight: 1.5,
            marginBottom: '24px',
          }}
        >
          Esta ação é irreversível. A mensagem será removida permanentemente do histórico da conversa para todos os participantes.
        </p>

        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={loading}
            data-testid="cancel-delete-chat-btn"
            style={{
              padding: '10px 18px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '0.875rem',
              transition: 'background 0.2s',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="confirm-danger-btn"
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-delete-chat-btn"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px 0 rgba(239, 68, 68, 0.39)',
            }}
          >
            {loading ? 'Excluindo...' : 'Sim, Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
}
