import React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

export default function IntroductionDeleteModal({
  isOpen,
  isDeleting,
  onCancel,
  onConfirm,
  title = 'Excluir Apresentação?',
  description = 'Tem certeza de que deseja excluir permanentemente esta apresentação e todos os seus comentários? Essa ação é irreversível.',
}) {
  if (!isOpen) return null;

  return (
    <div
      className="intro-delete-modal-overlay"
      data-testid="intro-confirm-delete-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="intro-delete-modal-card"
        data-testid="intro-delete-confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="delete-modal-icon-wrapper">
          <div className="delete-modal-icon-glow">
            <Trash2 size={28} className="delete-trash-icon" />
          </div>
        </div>

        <h3 id="delete-modal-title" className="delete-modal-title">
          {title}
        </h3>

        <p className="delete-modal-desc">
          {description}
        </p>

        <div className="delete-modal-actions">
          <button
            type="button"
            className="delete-modal-cancel-btn"
            onClick={onCancel}
            disabled={isDeleting}
            data-testid="cancel-delete-post-btn"
          >
            Cancelar
          </button>

          <button
            type="button"
            className="delete-modal-confirm-btn"
            onClick={onConfirm}
            disabled={isDeleting}
            data-testid="confirm-delete-post-btn"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <span>Sim, Excluir</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
