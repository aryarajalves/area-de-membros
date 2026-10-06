import React from 'react';
import { Mic, Copy, Trash2, Link as LinkIcon, Radio } from 'lucide-react';

export default function FunnelNodeAudio({
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

  const handleUpdate = (field, value) => {
    onUpdateData(node.id, { ...data, [field]: value });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '290px',
        backgroundColor: '#0a1a14',
        border: isSelected ? '2px solid #10b981' : '1px solid rgba(16, 185, 129, 0.4)',
        borderRadius: '14px',
        boxShadow: isSelected ? '0 10px 30px rgba(16, 185, 129, 0.3)' : '0 12px 30px rgba(0, 0, 0, 0.65)',
        color: '#f8fafc',
        padding: '14px',
        userSelect: 'none',
      }}
      data-testid={`funnel-node-audio-${node.id}`}
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
            backgroundColor: isTargetActive ? '#10b981' : '#10b981',
            border: isTargetActive ? '2px solid #ffffff' : '2px solid #0f172a',
            boxShadow: isTargetActive ? '0 0 14px #10b981' : '0 0 8px rgba(16, 185, 129, 0.6)',
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
          backgroundColor: '#10b981',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #10b981',
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
          <div style={{ color: '#10b981' }}>
            <Mic size={16} />
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em' }}>ÁUDIO</span>
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

      {/* Campo URL do Áudio */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <LinkIcon size={11} />
          <span>URL do Arquivo de Áudio (MP3 / WebM)</span>
        </div>
        <input
          type="text"
          value={data.audio_url || ''}
          onChange={(e) => handleUpdate('audio_url', e.target.value)}
          placeholder="https://exemplo.com/audio.mp3"
          style={{
            width: '100%',
            backgroundColor: '#020617',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: '#f8fafc',
            padding: '6px 8px',
            fontSize: '0.75rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          data-testid={`node-audio-url-input-${node.id}`}
        />
      </div>

      {/* Toggle Áudio de Voz (Gravado na hora) */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#cbd5e1',
          padding: '6px 8px',
          borderRadius: '6px',
          backgroundColor: '#020617',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Radio size={13} color="#10b981" />
          <span>Simular gravado na hora</span>
        </div>
        <input
          type="checkbox"
          checked={data.is_voice_note ?? true}
          onChange={(e) => handleUpdate('is_voice_note', e.target.checked)}
          style={{ accentColor: '#10b981', cursor: 'pointer' }}
        />
      </label>
    </div>
  );
}
