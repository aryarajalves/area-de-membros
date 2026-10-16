import React from 'react';
import { Bell, Copy, Trash2, Users, MessageSquareText, ShieldAlert } from 'lucide-react';

export default function FunnelNodeInternalNotify({
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
  const notifyTarget = data.notify_target || 'admins';
  const message = data.message || '🔔 Alerta: O aluno {aluno} ({email}) avançou para uma etapa importante do funil!';

  const handleTargetChange = (e) => {
    onUpdateData(node.id, { ...data, notify_target: e.target.value });
  };

  const handleMessageChange = (e) => {
    onUpdateData(node.id, { ...data, message: e.target.value });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '310px',
        backgroundColor: '#1c080e',
        border: isSelected ? '2px solid #f43f5e' : '1px solid rgba(244, 63, 94, 0.45)',
        borderRadius: '14px',
        boxShadow: isSelected
          ? '0 10px 30px rgba(244, 63, 94, 0.45)'
          : '0 10px 25px rgba(0, 0, 0, 0.7)',
        color: '#f8fafc',
        padding: '14px',
        userSelect: 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid={`funnel-node-internal-notify-${node.id}`}
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
          backgroundColor: isTargetActive ? '#fb7185' : '#e11d48',
          border: '2px solid #0f172a',
          boxShadow: isTargetActive ? '0 0 12px #fb7185' : '0 0 8px rgba(244, 63, 94, 0.6)',
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
          backgroundColor: '#f43f5e',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #f43f5e',
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
          borderBottom: '1px solid rgba(244, 63, 94, 0.35)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fb7185',
            }}
          >
            <Bell size={14} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fb7185', letterSpacing: '0.04em' }}>
            NOTIFICAÇÃO INTERNA
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#f43f5e',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
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
        Envia um alerta interno para os administradores quando o aluno alcançar este ponto.
      </p>

      {/* Destinatário */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <Users size={12} color="#f43f5e" />
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Quem notificar:</label>
        </div>
        <select
          value={notifyTarget}
          onChange={handleTargetChange}
          data-testid={`internal-notify-target-select-${node.id}`}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            backgroundColor: '#0a0204',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fecdd3',
            fontSize: '0.75rem',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="admins">👥 Todos os Administradores e Equipe</option>
          <option value="creator">👤 Somente o Criador do Funil</option>
        </select>
      </div>

      {/* Mensagem do Alerta */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <MessageSquareText size={12} color="#f43f5e" />
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Texto do Alerta:</label>
        </div>
        <textarea
          rows={3}
          value={message}
          onChange={handleMessageChange}
          placeholder="Ex: O aluno {aluno} chegou ao final da jornada!"
          data-testid={`internal-notify-message-input-${node.id}`}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            backgroundColor: '#0a0204',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#fecdd3',
            fontSize: '0.75rem',
            outline: 'none',
            resize: 'vertical',
            lineHeight: 1.35,
          }}
        />
      </div>

      {/* Resumo */}
      <div
        style={{
          padding: '6px 8px',
          backgroundColor: 'rgba(244, 63, 94, 0.08)',
          borderLeft: '3px solid #f43f5e',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <ShieldAlert size={12} color="#fb7185" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.68rem', color: '#fecdd3' }}>
          Gera DM e notificação no sino com tags: <code style={{ color: '#fda4af' }}>{'{aluno}'}</code>, <code style={{ color: '#fda4af' }}>{'{email}'}</code>
        </span>
      </div>
    </div>
  );
}
