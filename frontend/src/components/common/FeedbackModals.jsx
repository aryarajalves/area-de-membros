import React from 'react';
import { UploadCloud, Loader2, AlertTriangle, Check } from 'lucide-react';

/**
 * Modal centralizado de carregamento exibido durante o envio de arquivos para o Backblaze B2.
 * Atende às regras de UX: backdrop escuro, não fecha ao clicar fora, z-index superior.
 */
export function UploadProgressModal({
  isOpen,
  title = 'Enviando Arquivo...',
  message,
  subtitle,
  progress = null
}) {
  if (!isOpen) return null;
  const displayMessage = subtitle || message || 'Aguarde enquanto a mídia é transferida para a nuvem no Backblaze B2. Não feche nem recarregue a página.';
  const hasPercent = typeof progress === 'number' && progress >= 0;

  return (
    <div
      className="custom-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300
      }}
      data-testid="upload-progress-modal"
    >
      <div
        className="table-card"
        style={{
          maxWidth: '420px',
          width: '90%',
          padding: '28px 24px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          position: 'relative'
        }}>
          <UploadCloud size={28} />
          <Loader2
            size={56}
            className="spin-animation"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: '#3b82f6',
              opacity: 0.85
            }}
          />
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
          {title}
        </h3>

        <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', margin: '0 0 14px 0' }}>
          {displayMessage}
        </p>

        {hasPercent && (
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#2563eb', marginBottom: '8px' }} data-testid="upload-progress-percent">
            {progress}% concluído
          </div>
        )}

        {/* Barra de Progresso Visual Animada ou Porcentagem Real */}
        <div style={{
          width: '100%',
          height: '7px',
          backgroundColor: '#e2e8f0',
          borderRadius: '9999px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <div
            style={hasPercent ? {
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
              height: '100%',
              backgroundColor: '#2563eb',
              borderRadius: '9999px',
              transition: 'width 0.25s ease'
            } : {
              width: '45%',
              height: '100%',
              backgroundColor: '#2563eb',
              borderRadius: '9999px',
              animation: 'indeterminate-progress 1.5s infinite linear'
            }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Modal centralizado de confirmação antes de deletar arquivos ou mídias.
 * Atende às regras de UX: backdrop escuro, não fecha ao clicar fora, apenas 1 botão cancelar e 1 botão confirmar.
 */
export function FileDeleteConfirmModal({
  isOpen,
  title = 'Excluir Arquivo?',
  message = 'Tem certeza que deseja excluir permanentemente este arquivo? Esta ação não pode ser desfeita.',
  onConfirm,
  onCancel,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div
      className="custom-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300
      }}
      data-testid="file-delete-confirm-modal"
    >
      <div
        className="table-card"
        style={{
          maxWidth: '420px',
          width: '90%',
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#fee2e2',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <AlertTriangle size={24} />
        </div>

        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
          {title}
        </h3>

        <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', marginBottom: '20px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            className="secondary-btn"
            onClick={onCancel}
            disabled={loading}
            data-testid="cancel-file-delete-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="primary-btn"
            style={{ backgroundColor: '#ef4444' }}
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-file-delete-btn"
          >
            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal centralizado de confirmação para ações como Marcar como Resolvido ou Reabrir.
 * Atende às regras de UX: backdrop escuro translúcido, não fecha ao clicar fora, apenas 1 botão cancelar e 1 botão confirmar.
 */
export function ActionConfirmModal({
  isOpen,
  title = 'Confirmar Ação?',
  message = 'Deseja confirmar esta operação?',
  confirmLabel = 'Confirmar',
  confirmColor = '#16a34a',
  onConfirm,
  onCancel,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div
      className="custom-modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300
      }}
      data-testid="action-confirm-modal"
    >
      <div
        className="table-card"
        style={{
          maxWidth: '440px',
          width: '90%',
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#dcfce7',
          color: confirmColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px'
        }}>
          <Check size={24} />
        </div>

        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
          {title}
        </h3>

        <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: '1.5', marginBottom: '20px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            className="secondary-btn"
            onClick={onCancel}
            disabled={loading}
            data-testid="cancel-action-confirm-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="primary-btn"
            style={{ backgroundColor: confirmColor, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-action-btn"
          >
            {loading ? 'Processando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
