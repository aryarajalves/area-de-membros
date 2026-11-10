import React, { useState, useEffect, useRef } from 'react';
import { X, FileText, Loader2, Edit3, Check } from 'lucide-react';

export default function RenameAttachmentModal({
  isOpen,
  attachment,
  loading = false,
  onConfirm,
  onCancel
}) {
  const [newTitle, setNewTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && attachment) {
      setNewTitle(attachment.title || '');
      setErrorMsg('');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, attachment]);

  if (!isOpen || !attachment) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const clean = newTitle.trim();
    if (!clean) {
      setErrorMsg('O nome do material complementar não pode ser vazio.');
      return;
    }
    setErrorMsg('');
    onConfirm(clean);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !loading) {
      onCancel();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      data-testid="rename-attachment-modal-backdrop"
      onKeyDown={handleKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-attachment-title"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '14px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInScale 0.2s ease-out'
        }}
        data-testid="rename-attachment-modal"
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa'
              }}
            >
              <Edit3 size={18} />
            </div>
            <div>
              <h3
                id="rename-attachment-title"
                style={{
                  margin: 0,
                  fontSize: '15.5px',
                  fontWeight: 600,
                  color: '#f8fafc'
                }}
              >
                Renomear Material Complementar
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                Altere o nome visível do anexo para os alunos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.15s ease'
            }}
            data-testid="close-rename-modal-btn"
            aria-label="Fechar modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ padding: '22px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="attachment-new-title-input"
              style={{
                display: 'block',
                fontSize: '12.5px',
                fontWeight: 500,
                color: '#cbd5e1',
                marginBottom: '8px'
              }}
            >
              Nome do Arquivo
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="attachment-new-title-input"
                ref={inputRef}
                type="text"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                disabled={loading}
                placeholder="Ex: Apostila de Previsões Astrológicas.pdf"
                maxLength={200}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.6)',
                  border: errorMsg ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                data-testid="rename-attachment-input"
              />
            </div>
            {errorMsg && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#ef4444',
                  margin: '6px 0 0 0'
                }}
                data-testid="rename-attachment-error"
              >
                {errorMsg}
              </p>
            )}
          </div>

          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <FileText size={16} color="#60a5fa" />
            <div style={{ fontSize: '11.5px', color: '#94a3b8', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Extensão: <strong style={{ color: '#cbd5e1' }}>{attachment.file_type ? attachment.file_type.toUpperCase() : 'ARQUIVO'}</strong>
            </div>
          </div>

          {/* Rodapé de Ações */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px'
            }}
          >
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="secondary-btn"
              style={{
                padding: '9px 16px',
                fontSize: '13px',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              data-testid="cancel-rename-modal-btn"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || !newTitle.trim()}
              className="primary-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 18px',
                fontSize: '13px',
                borderRadius: '8px',
                cursor: (loading || !newTitle.trim()) ? 'not-allowed' : 'pointer',
                opacity: (!newTitle.trim() && !loading) ? 0.6 : 1
              }}
              data-testid="confirm-rename-modal-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
