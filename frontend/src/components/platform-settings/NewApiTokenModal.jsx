import React, { useState } from 'react';
import { KeyRound, X, Loader2, Calendar } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function NewApiTokenModal({ isOpen, onClose, onTokenCreated }) {
  const [name, setName] = useState('');
  const [expirationOption, setExpirationOption] = useState('never'); // 'never', '30', '90', '365'
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Informe um nome identificador para a chave de API.', 'error');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('auth_token');
    const expirationDays = expirationOption === 'never' ? null : parseInt(expirationOption, 10);

    try {
      const res = await fetch('/api/v1/api-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          expiration_days: expirationDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Erro ao gerar chave de API.');
      }

      addToast('Chave de API gerada com sucesso!', 'success');
      setName('');
      setExpirationOption('never');
      onTokenCreated(data);
    } catch (err) {
      addToast(err.message || 'Falha ao gerar chave de API.', 'error');
    } finally {
      setLoading(false);
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
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      data-testid="new-api-token-modal"
    >
      <div
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(2, 132, 199, 0.18)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <KeyRound size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Gerar Nova Chave de API
              </h2>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Para integrações com automações, n8n, Make ou Webhooks externos.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            data-testid="close-new-token-modal-btn"
            title="Cancelar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label
              htmlFor="api-token-name"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}
            >
              Nome / Identificador da Chave *
            </label>
            <input
              id="api-token-name"
              type="text"
              placeholder="Ex: n8n Produção, CRM Vendas, Webhook Hotmart..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 14px',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '10px',
                color: '#f8fafc',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              data-testid="api-token-name-input"
              required
            />
          </div>

          <div>
            <label
              htmlFor="api-token-expiration"
              style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}
            >
              Prazo de Validade
            </label>
            <div style={{ position: 'relative' }}>
              <select
                id="api-token-expiration"
                value={expirationOption}
                onChange={(e) => setExpirationOption(e.target.value)}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: '10px',
                  color: '#f8fafc',
                  fontSize: '13.5px',
                  outline: 'none',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
                data-testid="api-token-expiration-select"
              >
                <option value="never">Nunca expira (Recomendado para integrações fixas)</option>
                <option value="30">30 dias</option>
                <option value="90">90 dias</option>
                <option value="365">1 ano (365 dias)</option>
              </select>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', margin: '6px 0 0 0' }}>
              Tokens sem expiração continuam ativos permanentemente até que você os revogue manualmente.
            </p>
          </div>

          {/* Rodapé de Ações */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 18px',
                backgroundColor: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '9px',
                color: '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              data-testid="cancel-create-token-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 20px',
                backgroundColor: '#0284c7',
                border: 'none',
                borderRadius: '9px',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
              }}
              data-testid="confirm-create-token-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="spin-animation" />
                  <span>Gerando...</span>
                </>
              ) : (
                <span>Gerar Chave</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
