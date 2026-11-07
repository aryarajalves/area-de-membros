import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';

export default function TutorInputBar({
  onSendMessage,
  loading = false,
  canAsk = true,
  remainingQuestions = 3,
  totalLimit = 3,
  isSubscriber = false,
  isLightBg = false,
  isInMaintenance = false
}) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const isUnlimited = isSubscriber || totalLimit === -1;

  const handleSend = () => {
    if (!text.trim() || loading || !canAsk || isInMaintenance) return;
    onSendMessage(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div
      data-testid="tutor-input-bar-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 14px',
        borderRadius: '12px',
        backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
        marginTop: '10px'
      }}
    >
      {/* Topo da barra: Badge de cota restante ou status de assinante */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={12} color={isInMaintenance ? '#f59e0b' : (isUnlimited ? '#10b981' : '#a855f7')} />
          <span style={{ fontWeight: 600, color: isInMaintenance ? '#f59e0b' : (isUnlimited ? '#10b981' : (isLightBg ? '#475569' : '#cbd5e1')) }}>
            {isInMaintenance
              ? '🛠️ Envio de dúvidas temporariamente pausado para manutenção'
              : (isUnlimited
                ? '✨ Tutor IA Ilimitado Ativo'
                : `🎯 ${remainingQuestions} de ${totalLimit} perguntas gratuitas restantes neste mês`)}
          </span>
        </div>
        {!isInMaintenance && (
          <span style={{ color: isLightBg ? '#94a3b8' : '#64748b', fontSize: '11px' }}>
            Ctrl + Enter para enviar
          </span>
        )}
      </div>

      {/* Área de Digitação + Botão de Envio */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
        <textarea
          ref={textareaRef}
          rows={1}
          disabled={!canAsk || loading || isInMaintenance}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            isInMaintenance
              ? 'O envio de dúvidas está temporariamente em manutenção preventiva...'
              : (canAsk
                ? 'Tire uma dúvida sobre o que o instrutor falou nesta aula...'
                : 'Limite gratuito atingido. Desbloqueie o Tutor IA para continuar.')
          }
          data-testid="input-tutor-message"
          style={{
            flex: 1,
            resize: 'none',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: isLightBg ? '#0f172a' : '#f8fafc',
            fontSize: '13.5px',
            lineHeight: 1.5,
            maxHeight: '120px',
            padding: '6px 0',
            fontFamily: 'inherit'
          }}
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || loading || !canAsk}
          data-testid="btn-send-tutor-message"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: (!text.trim() || loading || !canAsk)
              ? (isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)')
              : '#7c3aed',
            color: '#ffffff',
            border: 'none',
            cursor: (!text.trim() || loading || !canAsk) ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            flexShrink: 0
          }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}
