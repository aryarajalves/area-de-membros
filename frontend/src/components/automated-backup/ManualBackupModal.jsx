import React, { useState, useEffect } from 'react';
import { Database, X, Play } from 'lucide-react';

export default function ManualBackupModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
}) {
  const [backupName, setBackupName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBackupName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(backupName.trim());
  };

  return (
    <div
      className="modal-overlay"
      data-testid="manual-backup-modal-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        data-testid="manual-backup-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={20} color="#0284c7" />
            <h3 style={{ margin: 0 }}>Fazer Backup Manual</h3>
          </div>
          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            disabled={loading}
            data-testid="close-manual-backup-modal-btn"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b', lineHeight: 1.5 }}>
            Informe um nome para identificar o seu backup ou deixe em branco para usar o prefixo padrão (<code>vturb_backup</code>).
          </p>

          <div className="form-group">
            <label htmlFor="backup-custom-name">Nome do Backup (Opcional)</label>
            <input
              id="backup-custom-name"
              type="text"
              placeholder="ex: backup_antes_da_migracao"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              disabled={loading}
              data-testid="backup-custom-name-input"
              autoFocus
            />
            <small className="help-text">
              * A data e hora da criação serão adicionadas automaticamente ao final do arquivo gerado (.dump.gz).
            </small>
          </div>

          <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
              data-testid="cancel-manual-backup-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="primary-btn"
              disabled={loading}
              data-testid="submit-manual-backup-btn"
            >
              <Play size={16} fill="currentColor" />
              <span>{loading ? 'Gerando Backup...' : 'Iniciar Backup'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
