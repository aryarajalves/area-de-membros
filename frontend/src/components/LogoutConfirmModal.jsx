import React from 'react';
import { LogOut } from 'lucide-react';

export default function LogoutConfirmModal({
  isOpen,
  onConfirm,
  onClose,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      data-testid="logout-modal-overlay"
      onClick={(e) => {
        // Regra obrigatória: NÃO deve fechar ao clicar fora do painel central
        e.stopPropagation();
      }}
    >
      <div
        className="modal-content confirm-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        data-testid="logout-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="confirm-delete-icon-wrapper"
          style={{ backgroundColor: '#fee2e2', borderColor: '#fecaca', color: '#ef4444' }}
        >
          <LogOut size={30} />
        </div>

        <h3 id="logout-modal-title" className="confirm-delete-title" data-testid="logout-modal-title">
          Encerrar Sessão
        </h3>

        <p className="confirm-delete-message" data-testid="logout-modal-message">
          Tem certeza que deseja sair do sistema? Você precisará informar suas credenciais novamente para acessar o painel.
        </p>

        <div className="confirm-delete-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={loading}
            data-testid="cancel-logout-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="confirm-danger-btn"
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-logout-btn"
          >
            {loading ? 'Saindo...' : 'Sim, Sair'}
          </button>
        </div>
      </div>
    </div>
  );
}
