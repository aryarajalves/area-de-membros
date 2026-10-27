import React from 'react';
import { Headphones, FileText, Trash2, Send, Loader2 } from 'lucide-react';

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function ChatAudioCaptionModal({
  recordedUrl,
  recordedDuration = 0,
  caption,
  setCaption,
  onCancel,
  onConfirmSend,
  sending = false,
}) {
  if (!recordedUrl) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '16px',
      }}
      data-testid="chat-audio-caption-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(139, 92, 246, 0.15)',
          padding: '22px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: '#f8fafc',
        }}
        data-testid="chat-audio-caption-modal"
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Headphones size={18} style={{ color: '#c084fc' }} />
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f8fafc' }}>
              Revisar Áudio
            </span>
          </div>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '12px',
              backgroundColor: 'rgba(139, 92, 246, 0.18)',
              color: '#e9d5ff',
              border: '1px solid rgba(139, 92, 246, 0.35)',
            }}
          >
            {formatDuration(recordedDuration)}
          </span>
        </div>

        {/* Player de Prévia do Áudio */}
        <div
          style={{
            padding: '12px',
            borderRadius: '12px',
            backgroundColor: '#070b14',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <audio
            controls
            src={recordedUrl}
            style={{ width: '100%', height: '36px' }}
            data-testid="audio-preview-player"
          />
        </div>

        {/* Campo de Legenda Opcional */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#94a3b8' }}>
            <FileText size={13} />
            <span>Legenda (opcional):</span>
          </div>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sending) onConfirmSend();
              }
            }}
            placeholder="Escreva uma mensagem ou legenda para acompanhar este áudio..."
            rows={3}
            data-testid="audio-caption-input"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              fontSize: '0.82rem',
              outline: 'none',
              resize: 'none',
              lineHeight: '1.4',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Botões de Ação */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '4px',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            data-testid="chat-caption-cancel-btn"
            title="Descartar áudio"
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '11px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: sending ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Trash2 size={16} />
            <span>Descartar</span>
          </button>

          <button
            type="button"
            onClick={onConfirmSend}
            disabled={sending}
            data-testid="chat-send-audio-btn"
            title="Enviar áudio com legenda"
            style={{
              flex: 1.4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              backgroundColor: '#10b981',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: sending ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s ease',
            }}
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Enviar Áudio</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
