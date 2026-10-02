import React, { useState } from 'react';
import { Check, Copy, AlertTriangle, KeyRound, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function TokenCreatedModal({ isOpen, tokenData, onClose }) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  if (!isOpen || !tokenData) return null;

  const handleCopy = async () => {
    let success = false;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(tokenData.raw_token);
        success = true;
      } catch {
        success = false;
      }
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = tokenData.raw_token;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        textArea.remove();
      } catch {
        success = false;
      }
    }

    if (success) {
      setCopied(true);
      addToast('Chave de API copiada para a área de transferência!', 'success');
      setTimeout(() => setCopied(false), 2500);
    } else {
      addToast('Falha ao copiar automaticamente. Selecione e copie manualmente.', 'error');
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      data-testid="token-created-modal"
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          padding: '26px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Chave de API Gerada!
            </h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Identificador: <strong style={{ color: '#38bdf8' }}>{tokenData.name}</strong>
            </span>
          </div>
        </div>

        {/* Alerta de Cópia Única */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '18px',
          }}
        >
          <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '12.5px', color: '#fbbf24', margin: 0, lineHeight: 1.5 }}>
            <strong>Copie esta chave agora.</strong> Por razões de segurança, ela não será exibida novamente após você fechar este aviso.
          </p>
        </div>

        {/* Caixa com o Token Bruto */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>
            Sua Chave Secreta de API:
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#020617',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '10px',
              padding: '10px 14px',
              gap: '10px',
            }}
          >
            <code
              style={{
                fontFamily: 'monospace',
                fontSize: '13px',
                color: '#38bdf8',
                wordBreak: 'break-all',
                flex: 1,
              }}
              data-testid="raw-api-token-display"
            >
              {tokenData.raw_token}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                backgroundColor: copied ? '#10b981' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}
              data-testid="copy-raw-token-btn"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Instrução rápida de uso */}
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            marginBottom: '22px',
            fontSize: '12px',
            color: '#94a3b8',
            lineHeight: 1.5,
          }}
        >
          <span style={{ fontWeight: 600, color: '#cbd5e1', display: 'block', marginBottom: '4px' }}>
            Como utilizar no n8n / Make / Postman:
          </span>
          Envie o cabeçalho HTTP:
          <code style={{ display: 'block', backgroundColor: '#020617', padding: '6px 8px', borderRadius: '6px', marginTop: '4px', color: '#f8fafc', fontFamily: 'monospace' }}>
            Authorization: Bearer {tokenData.raw_token.slice(0, 16)}...
          </code>
        </div>

        {/* Botão de Concluir */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 22px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '9px',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            data-testid="close-token-created-modal-btn"
          >
            Já salvei, fechar
          </button>
        </div>
      </div>
    </div>
  );
}
