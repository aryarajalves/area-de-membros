import React from 'react';

export default function TutorialModalFooter({
  uploading,
  uploadProgress,
  uploadStats,
  saving,
  isEditing,
  isBusy,
  onClose,
}) {
  return (
    <div
      className="modal-actions tutorial-modal-actions"
      data-testid="tutorial-modal-actions"
      style={{
        flexShrink: 0,
        margin: 0,
        padding: '16px 24px',
        background: '#0b1329',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderBottomLeftRadius: '16px',
        borderBottomRightRadius: '16px',
        zIndex: 20,
      }}
    >
      {uploading && (
        <div style={{ width: '100%' }} data-testid="upload-progress-container">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
              fontSize: '12px',
            }}
          >
            <span style={{ color: '#93c5fd', fontWeight: 500 }}>
              {uploadProgress < 100
                ? `Enviando arquivo de vídeo (${uploadProgress}%)...`
                : 'Processando e salvando na nuvem...'}
            </span>
            <span style={{ color: '#60a5fa', fontWeight: 700 }} data-testid="upload-progress-percent">
              {uploadProgress}%
            </span>
          </div>
          <div
            style={{
              width: '100%',
              height: '7px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '999px',
              overflow: 'hidden',
            }}
          >
            <div
              data-testid="upload-progress-bar"
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
                borderRadius: '999px',
                transition: 'width 0.25s ease',
              }}
            />
          </div>
          {uploadStats && (
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>
              {uploadStats}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
        <button
          type="button"
          onClick={onClose}
          className="cancel-btn"
          disabled={isBusy}
          data-testid="cancel-tutorial-btn"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="primary-btn"
          disabled={isBusy}
          data-testid="submit-tutorial-btn"
        >
          {uploading
            ? uploadProgress < 100
              ? `Enviando Vídeo (${uploadProgress}%)...`
              : 'Processando na Nuvem...'
            : saving
            ? 'Salvando...'
            : isEditing
            ? 'Salvar Alterações'
            : 'Criar Tutorial'}
        </button>
      </div>
    </div>
  );
}
