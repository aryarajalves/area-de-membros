import React from 'react';
import { Globe, Copy, Trash2, Send, Link as LinkIcon } from 'lucide-react';

export default function FunnelNodeWebhook({
  node,
  isSelected,
  onUpdateData,
  onDeleteNode,
  onDuplicateNode,
  onStartConnect,
  onConnectTarget,
  isTargetActive = false,
}) {
  const data = node.data || {};
  const method = (data.method || 'POST').toUpperCase();
  const url = data.url || '';

  const handleMethodChange = (m) => {
    onUpdateData(node.id, { ...data, method: m });
  };

  const handleUrlChange = (e) => {
    onUpdateData(node.id, { ...data, url: e.target.value });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '310px',
        backgroundColor: '#07161c',
        border: isSelected ? '2px solid #06b6d4' : '1px solid rgba(6, 182, 212, 0.45)',
        borderRadius: '14px',
        boxShadow: isSelected
          ? '0 10px 30px rgba(6, 182, 212, 0.45)'
          : '0 10px 25px rgba(0, 0, 0, 0.7)',
        color: '#f8fafc',
        padding: '14px',
        userSelect: 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid={`funnel-node-webhook-${node.id}`}
    >
      {/* Port de Entrada */}
      <div
        data-testid={`node-input-handle-${node.id}`}
        onClick={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'input');
        }}
        style={{
          position: 'absolute',
          left: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: isTargetActive ? '#22d3ee' : '#0891b2',
          border: '2px solid #0f172a',
          boxShadow: isTargetActive ? '0 0 12px #22d3ee' : '0 0 8px rgba(6, 182, 212, 0.6)',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Conectar entrada deste nó"
      />

      {/* Port de Saída */}
      <div
        data-testid={`node-output-handle-${node.id}`}
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#06b6d4',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #06b6d4',
          cursor: 'grab',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Clique ou arraste para conectar ao próximo passo"
      />

      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          borderBottom: '1px solid rgba(6, 182, 212, 0.35)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#22d3ee',
            }}
          >
            <Globe size={14} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#22d3ee', letterSpacing: '0.04em' }}>
            WEBHOOK EXTERNO
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#06b6d4',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(6, 182, 212, 0.4)',
              borderRadius: '10px',
              padding: '2px 6px',
            }}
          >
            AÇÃO
          </span>
          {onDuplicateNode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicateNode(node.id);
              }}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
              title="Duplicar nó"
            >
              <Copy size={13} />
            </button>
          )}
          {onDeleteNode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteNode(node.id);
              }}
              style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px' }}
              title="Excluir nó"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: '0 0 10px 0', lineHeight: 1.4 }}>
        Envia os dados do aluno para qualquer URL externa (n8n, Make, Zapier ou CRM).
      </p>

      {/* Seletor de Método HTTP */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['POST', 'GET'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleMethodChange(m)}
              data-testid={`webhook-method-${m.toLowerCase()}-${node.id}`}
              style={{
                flex: 1,
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                border: method === m ? '1.5px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: method === m ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                color: method === m ? '#cffafe' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Input de URL */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <LinkIcon size={12} color="#06b6d4" />
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>URL de Destino:</label>
        </div>
        <input
          type="url"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://seu-n8n.com/webhook/..."
          data-testid={`webhook-url-input-${node.id}`}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            backgroundColor: '#040b0e',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            color: '#cffafe',
            fontSize: '0.75rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Resumo do Payload */}
      <div
        style={{
          padding: '6px 8px',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          borderLeft: '3px solid #06b6d4',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Send size={12} color="#22d3ee" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.68rem', color: '#cffafe' }}>
          Envia JSON: <code style={{ color: '#67e8f9' }}>{'{ id, nome, email, telefone }'}</code>
        </span>
      </div>
    </div>
  );
}
