import React from 'react';
import { Swords, Trophy, Plus, X, Sparkles } from 'lucide-react';

export const RPG_LEVEL_OPTIONS = [
  { level: 2, title: 'Nível 2 (Bronze II)' },
  { level: 3, title: 'Nível 3 (Bronze III)' },
  { level: 4, title: 'Nível 4 (Bronze IV)' },
  { level: 5, title: 'Nível 5 (Prata I) - Elo Prata' },
  { level: 6, title: 'Nível 6 (Prata II)' },
  { level: 7, title: 'Nível 7 (Prata III)' },
  { level: 8, title: 'Nível 8 (Prata IV)' },
  { level: 9, title: 'Nível 9 (Ouro I) - Elo Ouro' },
  { level: 10, title: 'Nível 10 (Ouro II)' },
  { level: 11, title: 'Nível 11 (Ouro III)' },
  { level: 12, title: 'Nível 12 (Ouro IV)' },
  { level: 13, title: 'Nível 13 (Diamante I) - Elo Diamante' },
  { level: 14, title: 'Nível 14 (Diamante II)' },
  { level: 15, title: 'Nível 15 (Diamante III)' },
  { level: 16, title: 'Nível 16 (Diamante IV)' },
  { level: 17, title: 'Nível 17 (Lenda I) - Elo Lenda' },
  { level: 18, title: 'Nível 18 (Lenda II)' },
  { level: 19, title: 'Nível 19 (Lenda III)' },
  { level: 20, title: 'Nível 20 (Lenda Suprema)' },
];

export default function FunnelTriggerLevelUpConfig({
  nodeId,
  data = {},
  onUpdateData,
}) {
  const criterionType = data.criterion_type || (data.target_level === 'any' ? 'any' : (data.target_levels || data.target_level ? 'specific' : 'any'));
  const isAnyLevel = criterionType === 'any';

  // Obter lista normalizada de níveis específicos
  const targetLevels = React.useMemo(() => {
    if (Array.isArray(data.target_levels)) {
      return data.target_levels.map((lvl) => Number(lvl)).filter((n) => !isNaN(n));
    }
    if (data.target_level && data.target_level !== 'any') {
      const parsed = Number(data.target_level);
      return !isNaN(parsed) ? [parsed] : [2];
    }
    return [2];
  }, [data.target_levels, data.target_level]);

  const handleModeChange = (mode) => {
    if (mode === 'any') {
      onUpdateData(nodeId, {
        ...data,
        criterion_type: 'any',
        target_level: 'any',
      });
    } else {
      const initialLevels = targetLevels.length > 0 ? targetLevels : [2];
      onUpdateData(nodeId, {
        ...data,
        criterion_type: 'specific',
        target_levels: initialLevels,
        target_level: initialLevels[0],
      });
    }
  };

  const handleAddLevel = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    if (!targetLevels.includes(val)) {
      const updated = [...targetLevels, val].sort((a, b) => a - b);
      onUpdateData(nodeId, {
        ...data,
        criterion_type: 'specific',
        target_levels: updated,
        target_level: updated[0],
      });
    }
    e.target.value = '';
  };

  const handleRemoveLevel = (lvlToRemove) => {
    const updated = targetLevels.filter((lvl) => lvl !== lvlToRemove);
    onUpdateData(nodeId, {
      ...data,
      criterion_type: 'specific',
      target_levels: updated,
      target_level: updated.length > 0 ? updated[0] : null,
    });
  };

  const handleAddMilestones = () => {
    const milestones = [5, 10, 15, 20];
    const combined = Array.from(new Set([...targetLevels, ...milestones])).sort((a, b) => a - b);
    onUpdateData(nodeId, {
      ...data,
      criterion_type: 'specific',
      target_levels: combined,
      target_level: combined[0],
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ fontSize: '0.74rem', color: '#cbd5e1', margin: 0, lineHeight: 1.4 }}>
        Dispara quando o aluno acumular XP e <strong>subir de nível</strong> no sistema de RPG.
      </p>

      {/* Alternador de Modo: Qualquer Nível vs Níveis Específicos */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.7rem',
            fontWeight: 700,
            color: '#c084fc',
            marginBottom: '5px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Critério de Disparo:
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => handleModeChange('any')}
            onMouseDown={(e) => e.stopPropagation()}
            data-testid={`btn-mode-any-level-${nodeId}`}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: isAnyLevel ? '1.5px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: isAnyLevel ? 'rgba(192, 132, 252, 0.25)' : 'rgba(255, 255, 255, 0.03)',
              color: isAnyLevel ? '#f3e8ff' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            Qualquer Nível
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('specific')}
            onMouseDown={(e) => e.stopPropagation()}
            data-testid={`btn-mode-specific-level-${nodeId}`}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: !isAnyLevel ? '1.5px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: !isAnyLevel ? 'rgba(192, 132, 252, 0.25)' : 'rgba(255, 255, 255, 0.03)',
              color: !isAnyLevel ? '#f3e8ff' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            Níveis Específicos
          </button>
        </div>
      </div>

      {/* Seleção de Múltiplos Níveis Específicos */}
      {!isAnyLevel && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                color: '#d8b4fe',
              }}
            >
              Escolha os Níveis Alvo:
            </label>
            <button
              type="button"
              onClick={handleAddMilestones}
              onMouseDown={(e) => e.stopPropagation()}
              title="Adicionar marcos de elo 5, 10, 15 e 20"
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.67rem',
                cursor: 'pointer',
                fontWeight: 600,
                padding: 0,
              }}
            >
              + Marcos (5, 10, 15, 20)
            </button>
          </div>

          {/* Dropdown para adicionar níveis */}
          <select
            defaultValue=""
            onChange={handleAddLevel}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            data-testid={`select-specific-level-${nodeId}`}
            style={{
              width: '100%',
              padding: '7px 10px',
              borderRadius: '6px',
              backgroundColor: '#020617',
              border: '1px solid rgba(192, 132, 252, 0.4)',
              color: '#f3e8ff',
              fontSize: '0.75rem',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="" disabled>
              + Adicionar nível para disparar...
            </option>
            {RPG_LEVEL_OPTIONS.map((opt) => (
              <option
                key={opt.level}
                value={opt.level}
                disabled={targetLevels.includes(opt.level)}
              >
                {opt.title} {targetLevels.includes(opt.level) ? '✓ (Já selecionado)' : ''}
              </option>
            ))}
          </select>

          {/* Chips dos Níveis Selecionados */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              padding: '6px',
              backgroundColor: '#020617',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              minHeight: '34px',
              alignItems: 'center',
            }}
            data-testid={`selected-levels-container-${nodeId}`}
          >
            {targetLevels.length === 0 ? (
              <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontStyle: 'italic', paddingLeft: '4px' }}>
                Nenhum nível selecionado. Adicione no campo acima.
              </span>
            ) : (
              targetLevels.map((lvl) => {
                const opt = RPG_LEVEL_OPTIONS.find((o) => o.level === lvl);
                return (
                  <span
                    key={lvl}
                    data-testid={`level-chip-${lvl}-${nodeId}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      backgroundColor: 'rgba(192, 132, 252, 0.2)',
                      border: '1px solid rgba(192, 132, 252, 0.45)',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: '#f3e8ff',
                    }}
                  >
                    <span>{opt ? opt.title : `Nível ${lvl}`}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLevel(lvl)}
                      onMouseDown={(e) => e.stopPropagation()}
                      data-testid={`btn-remove-level-${lvl}-${nodeId}`}
                      title={`Remover Nível ${lvl}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#fca5a5',
                        cursor: 'pointer',
                        padding: '0 2px',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                      }}
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Resumo do Gatilho */}
      <div
        style={{
          padding: '8px 10px',
          backgroundColor: '#020617',
          borderLeft: '3px solid #c084fc',
          borderRadius: '0 6px 6px 0',
          border: '1px solid rgba(192, 132, 252, 0.25)',
          borderLeftWidth: '3px',
          borderLeftColor: '#c084fc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
        data-testid={`level-up-trigger-summary-${nodeId}`}
      >
        <Trophy size={14} color="#c084fc" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', color: '#f3e8ff' }}>
          {isAnyLevel ? (
            <span>Ativa em <strong>qualquer subida de nível</strong></span>
          ) : targetLevels.length > 0 ? (
            <span>
              Ativa ao atingir: <strong>{targetLevels.map((lvl) => `Nível ${lvl}`).join(', ')}</strong> ({targetLevels.length} {targetLevels.length === 1 ? 'nível' : 'níveis'})
            </span>
          ) : (
            <span style={{ color: '#f87171' }}>⚠️ Selecione pelo menos 1 nível específico acima</span>
          )}
        </span>
      </div>
    </div>
  );
}
