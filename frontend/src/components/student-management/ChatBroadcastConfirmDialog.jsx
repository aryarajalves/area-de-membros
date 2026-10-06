import React from 'react';
import { Send, RefreshCw, Check } from 'lucide-react';

export default function ChatBroadcastConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  totalRecipients,
  sending,
}) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '20px',
      }}
      data-testid="broadcast-confirm-dialog-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
          padding: '26px',
          color: '#f8fafc',
          textAlign: 'center',
        }}
        data-testid="broadcast-confirm-dialog"
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            color: '#a78bfa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}
        >
          <Send size={26} />
        </div>

        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 700 }}>
          Confirmar Disparo em Massa?
        </h3>

        <p style={{ margin: '0 0 20px 0', fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5 }}>
          A mensagem será enviada individualmente no privado de <strong>{totalRecipients} alunos</strong> com intervalo de <strong>1 segundo</strong> entre cada envio.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="cancel-confirm-broadcast-btn"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={sending}
            style={{
              padding: '9px 24px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: sending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
            }}
            data-testid="confirm-and-send-broadcast-btn"
          >
            {sending ? <RefreshCw size={16} className="spin" /> : <Check size={16} />}
            {sending ? 'Disparando...' : 'Confirmar e Disparar'}
          </button>
        </div>
      </div>
    </div>
  );
}
