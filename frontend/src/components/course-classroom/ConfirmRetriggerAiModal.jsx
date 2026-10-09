import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function ConfirmRetriggerAiModal({
  isOpen,
  onConfirm,
  onClose,
  loading = false,
  isLightBg = false
}) {
  if (!isOpen) return null;

  const modalBg = isLightBg ? '#ffffff' : '#0a0f1d';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(59, 130, 246, 0.3)';

  return (
    <div
      className="custom-modal-overlay"
      data-testid="confirm-retrigger-ai-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200
      }}
      onClick={(e) => {
        // Regra UX: NÃO deve fechar ao clicar fora do painel central
        e.stopPropagation();
      }}
    >
      <div
        className="table-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-retrigger-ai-title"
        data-testid="confirm-retrigger-ai-modal"
        style={{
          maxWidth: '430px',
          width: '92%',
          padding: '28px 24px',
          borderRadius: '14px',
          backgroundColor: modalBg,
          border: `1px solid ${borderColor}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 25px rgba(37, 99, 235, 0.15)',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#60a5fa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <RefreshCw size={26} className={loading ? 'animate-spin' : ''} />
        </div>

        <h3
          id="confirm-retrigger-ai-title"
          data-testid="confirm-retrigger-ai-title"
          style={{ fontSize: '18px', fontWeight: 700, color: textColor, marginBottom: '8px' }}
        >
          Re-gerar Transcrição com IA?
        </h3>

        <p
          data-testid="confirm-retrigger-ai-message"
          style={{ fontSize: '13.5px', color: subTextColor, lineHeight: 1.55, marginBottom: '24px' }}
        >
          Esta ação irá reprocessar o áudio do vídeo com a IA (Whisper + GPT), recalculando a transcrição, minutagem dos capítulos e o resumo inteligente. Deseja continuar?
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            className="secondary-btn"
            style={!isLightBg ? { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.16)' } : undefined}
            onClick={onClose}
            disabled={loading}
            data-testid="cancel-retrigger-ai-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="primary-btn"
            style={{
              backgroundColor: '#3b82f6',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-retrigger-ai-btn"
          >
            {loading ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Iniciando...</span>
              </>
            ) : (
              'Sim, Re-gerar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
