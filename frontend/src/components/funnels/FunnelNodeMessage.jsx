import React from 'react';
import { MessageSquare, Copy, Trash2, Plus, Sparkles } from 'lucide-react';

export default function FunnelNodeMessage({
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
  const buttons = data.buttons || [];

  const handleTextChange = (e) => {
    onUpdateData(node.id, { ...data, text: e.target.value });
  };

  const handleAddButton = () => {
    if (buttons.length >= 3) return;
    const newButtons = [
      ...buttons,
      { id: `btn_${Date.now()}`, text: `Opção ${buttons.length + 1}`, url: '', action_type: 'url' },
    ];
    onUpdateData(node.id, { ...data, buttons: newButtons });
  };

  const handleUpdateButton = (index, field, value) => {
    const updated = buttons.map((b, i) => (i === index ? { ...b, [field]: value } : b));
    onUpdateData(node.id, { ...data, buttons: updated });
  };

  const handleRemoveButton = (index) => {
    const updated = buttons.filter((_, i) => i !== index);
    onUpdateData(node.id, { ...data, buttons: updated });
  };

  const toggleCommercialHours = () => {
    onUpdateData(node.id, { ...data, only_business_hours: !data.only_business_hours });
  };

  const toggleInMemory = () => {
    onUpdateData(node.id, { ...data, in_memory: !data.in_memory });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '320px',
        backgroundColor: '#0b1329',
        border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.4)',
        borderRadius: '14px',
        boxShadow: isSelected ? '0 10px 30px rgba(56, 189, 248, 0.3)' : '0 12px 30px rgba(0, 0, 0, 0.65)',
        color: '#f8fafc',
        padding: '14px',
        userSelect: 'none',
      }}
      data-testid={`funnel-node-message-${node.id}`}
    >
      {/* Port de Entrada (esquerda) */}
      {!data.is_start && (
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            if (onStartConnect) onStartConnect(node.id, e, node, 'input');
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
            if (onConnectTarget) onConnectTarget(node.id, 'input');
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onConnectTarget) onConnectTarget(node.id, 'input');
          }}
          style={{
            position: 'absolute',
            left: '-8px',
            top: '50%',
            transform: isTargetActive ? 'translateY(-50%) scale(1.45)' : 'translateY(-50%)',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: isTargetActive ? '#10b981' : '#3b82f6',
            border: isTargetActive ? '2px solid #ffffff' : '2px solid #0f172a',
            boxShadow: isTargetActive ? '0 0 14px #10b981' : '0 0 8px rgba(59, 130, 246, 0.6)',
            cursor: 'crosshair',
            zIndex: 10,
            transition: 'all 0.15s ease',
          }}
          title="Ponto de entrada (arraste ou solte para conectar)"
          data-testid={`node-input-handle-${node.id}`}
        />
      )}

      {/* Port de Saída (direita) */}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (onStartConnect) onStartConnect(node.id, e, node, 'output');
        }}
        onMouseUp={(e) => {
          e.stopPropagation();
          if (onConnectTarget) onConnectTarget(node.id, 'output');
        }}
        style={{
          position: 'absolute',
          right: '-8px',
          top: '50%',
          transform: isTargetActive ? 'translateY(-50%) scale(1.3)' : 'translateY(-50%)',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: '#38bdf8',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #38bdf8',
          cursor: 'grab',
          zIndex: 10,
          transition: 'all 0.15s ease',
        }}
        title="Clique ou arraste até outro nó para conectar"
        data-testid={`node-output-handle-${node.id}`}
      />

      {/* Header do Nó */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '10px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ color: '#38bdf8' }}>
            <MessageSquare size={16} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em' }}>MENSAGEM</span>
          {data.is_start && (
            <span
              style={{
                fontSize: '0.65rem',
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 700,
              }}
            >
              ▶ INÍCIO
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onDuplicateNode(node.id)}
            title="Duplicar Nó"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '3px' }}
          >
            <Copy size={13} />
          </button>
          {!data.is_start && (
            <button
              onClick={() => onDeleteNode(node.id)}
              title="Excluir Nó"
              style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '3px' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Rótulo da Versão */}
      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#38bdf8', marginBottom: '6px' }}>
        VERSÃO 1 (PRINCIPAL)
      </div>

      {/* Textarea */}
      <textarea
        value={data.text || ''}
        onChange={handleTextChange}
        placeholder="Digite a mensagem do funil..."
        rows={4}
        style={{
          width: '100%',
          backgroundColor: '#020617',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '8px',
          color: '#f8fafc',
          padding: '8px 10px',
          fontSize: '0.8rem',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
        data-testid={`node-text-input-${node.id}`}
      />

      {/* Dica de Spintax */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.68rem', color: '#94a3b8', marginTop: '6px' }}>
        <Sparkles size={11} color="#f59e0b" />
        <span>Suporta Spintax: <code>{'{Oi|Olá}'}</code> e <code>{'{aluno}'}</code></span>
      </div>

      {/* Seção de Botões Interativos */}
      <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
          BOTÕES INTERATIVOS ({buttons.length}/3)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {buttons.map((btn, idx) => (
            <div key={btn.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="text"
                placeholder="Texto do botão"
                value={btn.text || ''}
                onChange={(e) => handleUpdateButton(idx, 'text', e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: '#020617',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  padding: '5px 8px',
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveButton(idx)}
                style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {buttons.length < 3 && (
            <button
              type="button"
              onClick={handleAddButton}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                padding: '6px',
                borderRadius: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px dashed rgba(56, 189, 248, 0.4)',
                color: '#38bdf8',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: '4px',
              }}
              data-testid={`add-button-to-node-${node.id}`}
            >
              <Plus size={12} />
              <span>+ Adicionar Botão</span>
            </button>
          )}
        </div>
      </div>

      {/* Switches de Configuração */}
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px' }}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#cbd5e1', cursor: 'pointer' }}>
          <span>APENAS HORÁRIO COMERCIAL?</span>
          <input
            type="checkbox"
            checked={!!data.only_business_hours}
            onChange={toggleCommercialHours}
            style={{ accentColor: '#8b5cf6', cursor: 'pointer' }}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#cbd5e1', cursor: 'pointer' }}>
          <span>DISPARAR NA MEMÓRIA?</span>
          <input
            type="checkbox"
            checked={data.in_memory ?? true}
            onChange={toggleInMemory}
            style={{ accentColor: '#38bdf8', cursor: 'pointer' }}
          />
        </label>
      </div>
    </div>
  );
}
