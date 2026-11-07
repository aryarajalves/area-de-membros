import React, { useState } from 'react';
import { ThumbsDown, X, Send, Loader2 } from 'lucide-react';

export default function TutorFeedbackModal({
  isOpen,
  messageId,
  onClose,
  onSubmitFeedback,
  isLightBg = false
}) {
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setSubmitting(true);
      await onSubmitFeedback({
        messageId,
        rating: 'dislike',
        feedbackText: feedbackText.trim() || null
      });
      setFeedbackText('');
      onClose();
    } catch (err) {
      console.error('Erro ao enviar feedback:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const modalBg = isLightBg ? '#ffffff' : '#0f172a';
  const inputBg = isLightBg ? '#f8fafc' : '#1e293b';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';

  return (
    <div
      data-testid="tutor-feedback-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        data-testid="tutor-feedback-modal-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: modalBg,
          borderRadius: '14px',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out'
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '18px 20px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ThumbsDown size={18} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textColor }}>
                Como podemos melhorar esta resposta?
              </h4>
              <span style={{ fontSize: '11.5px', color: subTextColor }}>
                Ajude o Tutor IA a ser mais preciso nas próximas dúvidas
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            data-testid="btn-close-feedback-modal"
            style={{
              background: 'none',
              border: 'none',
              color: subTextColor,
              cursor: submitting ? 'not-allowed' : 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo do formulário */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label
              htmlFor="tutor-feedback-input"
              style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: textColor, marginBottom: '6px' }}
            >
              O que ficou incorreto, incompleto ou confuso?
            </label>
            <textarea
              id="tutor-feedback-input"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              maxLength={1500}
              rows={4}
              placeholder="Ex: O minuto indicado não correspondeu ao trecho do vídeo, ou a explicação sobre o aspecto planetário ficou incompleta..."
              data-testid="textarea-feedback-reason"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: inputBg,
                border: `1px solid ${borderColor}`,
                color: textColor,
                fontSize: '13px',
                lineHeight: 1.5,
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '11px', color: subTextColor }}>
                Opcional: Você pode enviar com ou sem justificativa.
              </span>
              <span style={{ fontSize: '11px', color: subTextColor }}>
                {feedbackText.length}/1500
              </span>
            </div>
          </div>

          {/* Rodapé com botões de ação */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              data-testid="btn-cancel-feedback"
              style={{
                padding: '8px 14px',
                borderRadius: '7px',
                backgroundColor: 'transparent',
                border: `1px solid ${borderColor}`,
                color: subTextColor,
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              data-testid="btn-submit-feedback"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '7px',
                backgroundColor: '#f97316',
                border: 'none',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 10px rgba(249, 115, 22, 0.35)'
              }}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              <span>{submitting ? 'Enviando...' : 'Enviar Avaliação'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
