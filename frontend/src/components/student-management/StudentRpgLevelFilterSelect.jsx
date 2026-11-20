import React from 'react';
import { Trophy } from 'lucide-react';
import { RPG_LEVELS } from '../../utils/gamificationLevelUtils';

const RPG_TIER_OPTIONS = [
  { value: 'tier:Bronze', label: '🛡️ Elo Bronze (I a IV)' },
  { value: 'tier:Prata', label: '⚔️ Elo Prata (I a IV)' },
  { value: 'tier:Ouro', label: '👑 Elo Ouro (I a IV)' },
  { value: 'tier:Diamante', label: '💎 Elo Diamante (I a IV)' },
  { value: 'tier:Lenda', label: '🔥 Elo Lenda (I a Suprema)' },
];

export default function StudentRpgLevelFilterSelect({
  rpgLevel = '',
  setRpgLevel,
  inputBg,
  inputBorder,
  textColor,
}) {
  if (!setRpgLevel) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Trophy size={15} style={{ color: '#eab308' }} />
      <select
        value={rpgLevel}
        onChange={(e) => setRpgLevel(e.target.value)}
        style={{
          padding: '7px 12px',
          borderRadius: '7px',
          backgroundColor: inputBg,
          border: rpgLevel ? '1px solid #eab308' : inputBorder,
          color: textColor,
          fontSize: '0.85rem',
          outline: 'none',
          cursor: 'pointer',
        }}
        data-testid="filter-rpg-level-select"
        aria-label="Filtrar por nível"
        title="Filtrar alunos por Elo ou Nível RPG"
      >
        <option value="" style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
          Nível: Todos
        </option>
        <optgroup label="Por Elo (Divisão)" style={{ backgroundColor: '#090d16', color: '#94a3b8' }}>
          {RPG_TIER_OPTIONS.map((tier) => (
            <option key={tier.value} value={tier.value} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
              {tier.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Por Nível Específico" style={{ backgroundColor: '#090d16', color: '#94a3b8' }}>
          {RPG_LEVELS.map((lvl) => (
            <option key={lvl.level} value={String(lvl.level)} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>
              Nv. {lvl.level} — {lvl.badge}
            </option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}
