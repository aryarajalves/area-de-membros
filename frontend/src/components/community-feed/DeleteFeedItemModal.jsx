import React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteFeedItemModal({
  isOpen,
  title = 'Excluir Publicação',
  message = 'Tem certeza que deseja excluir esta publicação? Esta ação é irreversível.',
  isDeleting = false,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="feed-modal-backdrop"
      data-testid="delete-feed-modal-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="feed-modal-container"
        data-testid="delete-feed-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="feed-modal-icon-wrapper">
          <AlertTriangle size={28} className="feed-modal-alert-icon" />
        </div>

        <h3 className="feed-modal-title" data-testid="delete-feed-modal-title">
          {title}
        </h3>

        <p className="feed-modal-message" data-testid="delete-feed-modal-message">
          {message}
        </p>

        <div className="feed-modal-actions">
          <button
            type="button"
            className="feed-modal-cancel-btn"
            onClick={onClose}
            disabled={isDeleting}
            data-testid="delete-feed-modal-cancel-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="feed-modal-confirm-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            data-testid="delete-feed-modal-confirm-btn"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="feed-spinner" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Excluir
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
