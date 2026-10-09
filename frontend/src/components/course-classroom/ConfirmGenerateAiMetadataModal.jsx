import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function ConfirmGenerateAiMetadataModal({
  isOpen,
  onConfirm,
  onClose,
  loading = false,
  isLightBg = false,
  title = "Gerar Título e Descrição com IA?",
  message = "A Inteligência Artificial analisará a transcrição completa desta aula para criar um novo título conciso e uma descrição pedagógica detalhada. O título e a descrição atuais serão substituídos pelo conteúdo gerado. Deseja continuar?"
}) {
  if (!isOpen) return null;

  const modalBg = isLightBg ? '#ffffff' : '#0a0f1d';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(168, 85, 247, 0.35)';

  return (
    <div
      className="custom-modal-overlay"
      data-testid="confirm-generate-ai-metadata-overlay"
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
        aria-labelledby="confirm-generate-ai-metadata-title"
        data-testid="confirm-generate-ai-metadata-modal"
        style={{
          maxWidth: '440px',
          width: '92%',
          padding: '28px 24px',
          borderRadius: '14px',
          backgroundColor: modalBg,
          border: `1px solid ${borderColor}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 25px rgba(168, 85, 247, 0.18)',
          textAlign: 'center'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            border: '1px solid rgba(168, 85, 247, 0.45)',
            color: '#c084fc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          {loading ? (
            <Loader2 size={26} className="animate-spin" />
          ) : (
            <Sparkles size={26} />
          )}
        </div>

        <h3
          id="confirm-generate-ai-metadata-title"
          data-testid="confirm-generate-ai-metadata-title"
          style={{ fontSize: '18px', fontWeight: 700, color: textColor, marginBottom: '8px' }}
        >
          {title}
        </h3>

        <p
          data-testid="confirm-generate-ai-metadata-message"
          style={{ fontSize: '13.5px', color: subTextColor, lineHeight: 1.55, marginBottom: '24px' }}
        >
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            className="secondary-btn"
            style={!isLightBg ? { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.16)' } : undefined}
            onClick={onClose}
            disabled={loading}
            data-testid="cancel-generate-ai-metadata-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="primary-btn"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-generate-ai-metadata-btn"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Gerando com IA...</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>Sim, Gerar com IA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
