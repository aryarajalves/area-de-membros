import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function BackupConfirmModal({
  isOpen,
  title,
  message,
  loading,
  isDanger = true,
  confirmBtnText = 'Confirmar',
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      data-testid="backup-confirm-modal-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content confirm-delete-modal"
        role="dialog"
        aria-modal="true"
        data-testid="backup-confirm-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="confirm-delete-icon-wrapper"
          style={
            !isDanger
              ? { backgroundColor: '#e0f2fe', borderColor: '#bae6fd', color: '#0284c7' }
              : {}
          }
        >
          {isDanger ? <AlertTriangle size={32} /> : <RotateCw size={32} />}
        </div>

        <h3 className="confirm-delete-title">{title}</h3>
        <p className="confirm-delete-message">{message}</p>

        <div className="confirm-delete-actions">
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={loading}
            data-testid="cancel-backup-modal-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="confirm-danger-btn"
            style={
              !isDanger
                ? { backgroundColor: '#0284c7', boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)' }
                : {}
            }
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-backup-modal-btn"
          >
            {loading ? 'Processando...' : confirmBtnText}
          </button>
        </div>
      </div>
    </div>
  );
}
