import React from 'react';
import { Swords, Copy, Trash2, Award, Sparkles } from 'lucide-react';

export default function FunnelNodeGamificationXp({
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
  const xpAmount = data.xp_amount !== undefined ? data.xp_amount : 50;
  const reason = data.reason || 'Recompensa por Conquista no Funil';

  const handleSelectPreset = (amount) => {
    onUpdateData(node.id, { ...data, xp_amount: amount });
  };

  const handleCustomXp = (e) => {
    const val = parseInt(e.target.value, 10);
    onUpdateData(node.id, { ...data, xp_amount: isNaN(val) ? 0 : val });
  };

  const handleReasonChange = (e) => {
    onUpdateData(node.id, { ...data, reason: e.target.value });
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '310px',
        backgroundColor: '#1b1305',
        border: isSelected ? '2px solid #f59e0b' : '1px solid rgba(245, 158, 11, 0.45)',
        borderRadius: '14px',
        boxShadow: isSelected
          ? '0 10px 30px rgba(245, 158, 11, 0.45)'
          : '0 10px 25px rgba(0, 0, 0, 0.7)',
        color: '#f8fafc',
        padding: '14px',
        userSelect: 'none',
        transition: 'border 0.2s ease, box-shadow 0.2s ease',
      }}
      data-testid={`funnel-node-gamification-xp-${node.id}`}
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
          backgroundColor: isTargetActive ? '#fbbf24' : '#d97706',
          border: '2px solid #0f172a',
          boxShadow: isTargetActive ? '0 0 12px #fbbf24' : '0 0 8px rgba(245, 158, 11, 0.6)',
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
          backgroundColor: '#f59e0b',
          border: '2px solid #0f172a',
          boxShadow: '0 0 10px #f59e0b',
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
          borderBottom: '1px solid rgba(245, 158, 11, 0.35)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
            }}
          >
            <Swords size={14} />
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fbbf24', letterSpacing: '0.04em' }}>
            RECOMPENSA EM XP
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              color: '#f59e0b',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
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
        Credita pontos de XP no perfil do aluno para impulsionar seu nível RPG e ranking.
      </p>

      {/* Presets de XP */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
          {[25, 50, 100, 250].map((pts) => {
            const isAct = xpAmount === pts;
            return (
              <button
                key={pts}
                type="button"
                onClick={() => handleSelectPreset(pts)}
                data-testid={`xp-preset-btn-${pts}-${node.id}`}
                style={{
                  padding: '6px 4px',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isAct ? '1.5px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: isAct ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.03)',
                  color: isAct ? '#fef3c7' : '#94a3b8',
                  textAlign: 'center',
                }}
              >
                +{pts} XP
              </button>
            );
          })}
        </div>
      </div>

      {/* Quantidade Personalizada */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min="1"
            max="10000"
            value={xpAmount}
            onChange={handleCustomXp}
            data-testid={`xp-amount-input-${node.id}`}
            style={{
              width: '85px',
              padding: '6px 8px',
              borderRadius: '6px',
              backgroundColor: '#0a0701',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fef3c7',
              fontSize: '0.78rem',
              fontWeight: 700,
              outline: 'none',
              textAlign: 'center',
            }}
          />
          <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>pontos de XP</span>
        </div>
      </div>

      {/* Motivo / Descrição */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px' }}>
          <Award size={12} color="#f59e0b" />
          <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>Motivo da Conquista:</label>
        </div>
        <input
          type="text"
          value={reason}
          onChange={handleReasonChange}
          placeholder="Ex: Concluiu o Desafio de 7 Dias"
          data-testid={`xp-reason-input-${node.id}`}
          style={{
            width: '100%',
            padding: '7px 10px',
            borderRadius: '6px',
            backgroundColor: '#0a0701',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fef3c7',
            fontSize: '0.75rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Resumo */}
      <div
        style={{
          padding: '6px 8px',
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          borderLeft: '3px solid #f59e0b',
          borderRadius: '0 6px 6px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Sparkles size={12} color="#fbbf24" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.68rem', color: '#fef3c7' }}>
          Adiciona <strong>+{xpAmount} XP</strong> ao aluno ({reason})
        </span>
      </div>
    </div>
  );
}
