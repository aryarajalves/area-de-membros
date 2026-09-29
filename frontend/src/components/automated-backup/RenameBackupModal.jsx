import React, { useState, useEffect } from 'react';
import { Edit3, X, Check } from 'lucide-react';

export default function RenameBackupModal({
  isOpen,
  backup,
  onClose,
  onConfirm,
  loading,
}) {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (backup && isOpen) {
      // Remove sufixos como .dump.gz para edição mais amigável
      const cleanName = backup.filename.replace(/(\.dump|\.gz|\.dump\.gz)$/i, '');
      setNewName(cleanName);
    }
  }, [backup, isOpen]);

  if (!isOpen || !backup) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onConfirm(backup.id, newName.trim());
  };

  return (
    <div
      className="modal-overlay"
      data-testid="rename-backup-modal-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        data-testid="rename-backup-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit3 size={20} color="#0284c7" />
            <h3 style={{ margin: 0 }}>Renomear Backup</h3>
          </div>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            disabled={loading}
            data-testid="close-rename-backup-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
            Digite o novo nome para o arquivo de backup selecionado.
          </p>

          <div className="form-group">
            <label htmlFor="backup-rename-input">Novo Nome</label>
            <input
              id="backup-rename-input"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={loading}
              data-testid="backup-rename-input"
              autoFocus
              required
            />
            <small className="help-text">
              * A extensão <code>.dump.gz</code> será preservada automaticamente.
            </small>
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
              data-testid="cancel-rename-backup-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={loading || !newName.trim()}
              data-testid="submit-rename-backup-btn"
            >
              <Check size={16} />
              <span>{loading ? 'Salvando...' : 'Salvar Novo Nome'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
