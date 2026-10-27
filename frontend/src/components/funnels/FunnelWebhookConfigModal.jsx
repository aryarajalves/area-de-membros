import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Globe, Check, AlertCircle, Code, Plus } from 'lucide-react';

const DYNAMIC_VARIABLES = [
  { label: 'Nome', tag: '{{nome}}' },
  { label: 'E-mail', tag: '{{email}}' },
  { label: 'Telefone', tag: '{{telefone}}' },
  { label: 'ID Aluno', tag: '{{id}}' },
  { label: 'ID Funil', tag: '{{funnel_id}}' },
  { label: 'Timestamp', tag: '{{timestamp}}' },
];

export default function FunnelWebhookConfigModal({
  isOpen,
  onClose,
  onSave,
  nodeData = {},
}) {
  const [payloadType, setPayloadType] = useState(nodeData.payload_type || 'default');
  const [customJson, setCustomJson] = useState(
    nodeData.custom_json ||
      JSON.stringify(
        {
          event: 'lead_funnel',
          lead: {
            nome: '{{nome}}',
            email: '{{email}}',
            telefone: '{{telefone}}',
          },
          origem: 'Area de Membros',
        },
        null,
        2
      )
  );
  const [customHeaders, setCustomHeaders] = useState(nodeData.custom_headers || '');
  const [jsonError, setJsonError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPayloadType(nodeData.payload_type || 'default');
      setCustomJson(
        nodeData.custom_json ||
          JSON.stringify(
            {
              event: 'lead_funnel',
              lead: {
                nome: '{{nome}}',
                email: '{{email}}',
                telefone: '{{telefone}}',
              },
              origem: 'Area de Membros',
            },
            null,
            2
          )
      );
      setCustomHeaders(nodeData.custom_headers || '');
      validateJson(nodeData.custom_json);
    }
  }, [isOpen, nodeData]);

  const validateJson = (text) => {
    if (!text || !text.trim()) {
      setJsonError(null);
      return true;
    }
    try {
      // Substitui tags temporariamente para validar sintaxe de JSON
      const sanitized = text.replace(/\{\{[^}]+\}\}/g, '"mock"');
      JSON.parse(sanitized);
      setJsonError(null);
      return true;
    } catch (err) {
      setJsonError(err.message);
      return false;
    }
  };

  const handleJsonChange = (e) => {
    const val = e.target.value;
    setCustomJson(val);
    validateJson(val);
  };

  const insertVariable = (tag) => {
    setCustomJson((prev) => `${prev}\n  ${tag}`);
  };

  const handleSave = () => {
    if (payloadType === 'custom' && jsonError) {
      return;
    }
    onSave({
      payload_type: payloadType,
      custom_json: customJson,
      custom_headers: customHeaders.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        data-testid="webhook-config-modal"
        style={{
          background: 'linear-gradient(145deg, #09131d, #04090f)',
          border: '1px solid rgba(6, 182, 212, 0.4)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '640px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 20px rgba(6, 182, 212, 0.2)',
          color: '#f8fafc',
          overflow: 'hidden',
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22d3ee',
              }}
            >
              <Code size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#22d3ee' }}>
                Configurar Payload do Webhook (JSON)
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Construa seu payload personalizado com variáveis dinâmicas (estilo ManyChat)
              </span>
            </div>
          </div>
          <button
            type="button"
            data-testid="close-webhook-modal-btn"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Seletor de Tipo de Payload */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '8px' }}>
              Tipo de Corpo da Requisição (Body):
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                data-testid="payload-type-default"
                onClick={() => setPayloadType('default')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: payloadType === 'default' ? '1.5px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: payloadType === 'default' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: payloadType === 'default' ? '#cffafe' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>📦 Padrão (Full Payload)</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                  Envia JSON com todos os dados do aluno
                </div>
              </button>

              <button
                type="button"
                data-testid="payload-type-custom"
                onClick={() => setPayloadType('custom')}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: payloadType === 'custom' ? '1.5px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: payloadType === 'custom' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  color: payloadType === 'custom' ? '#cffafe' : '#94a3b8',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>✨ JSON Personalizado (ManyChat)</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>
                  Você define o JSON exato e as chaves
                </div>
              </button>
            </div>
          </div>

          {/* Editor de JSON (quando custom) */}
          {payloadType === 'custom' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0' }}>
                  Estrutura JSON do Body:
                </label>
                {jsonError ? (
                  <span style={{ fontSize: '0.72rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} /> JSON Inválido
                  </span>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={12} /> JSON Válido
                  </span>
                )}
              </div>

              {/* Pílulas de Variáveis */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', alignSelf: 'center', marginRight: '4px' }}>
                  Inserir variável:
                </span>
                {DYNAMIC_VARIABLES.map((v) => (
                  <button
                    key={v.tag}
                    type="button"
                    data-testid={`btn-insert-var-${v.tag}`}
                    onClick={() => insertVariable(v.tag)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '6px',
                      background: 'rgba(6, 182, 212, 0.12)',
                      border: '1px solid rgba(6, 182, 212, 0.3)',
                      color: '#22d3ee',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Plus size={10} />
                    {v.label}
                  </button>
                ))}
              </div>

              <textarea
                data-testid="custom-json-textarea"
                value={customJson}
                onChange={handleJsonChange}
                rows={9}
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  backgroundColor: '#020617',
                  border: jsonError ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(6, 182, 212, 0.4)',
                  borderRadius: '8px',
                  color: '#cffafe',
                  padding: '10px 12px',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Headers Customizados */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
              Headers Customizados (Opcional):
            </label>
            <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '6px' }}>
              Exemplo: <code>Authorization: Bearer seu_token</code> (um por linha)
            </span>
            <textarea
              data-testid="custom-headers-textarea"
              value={customHeaders}
              onChange={(e) => setCustomHeaders(e.target.value)}
              placeholder="Authorization: Bearer seu_token&#10;x-api-key: 12345"
              rows={2}
              style={{
                width: '100%',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                backgroundColor: '#020617',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                color: '#e2e8f0',
                padding: '8px 10px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            data-testid="save-webhook-config-btn"
            onClick={handleSave}
            disabled={payloadType === 'custom' && Boolean(jsonError)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: payloadType === 'custom' && Boolean(jsonError) ? 'not-allowed' : 'pointer',
              opacity: payloadType === 'custom' && Boolean(jsonError) ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Check size={14} />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
