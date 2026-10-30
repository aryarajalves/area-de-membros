import React from 'react';
import { Clock, Calendar, Zap, Trophy, Shield } from 'lucide-react';

const ELO_OPTIONS = [
  { value: null, label: 'Livre (Todos os alunos)', color: '#94a3b8', badge: 'Livre' },
  { value: 'Bronze', label: 'Bronze', color: '#cd7f32', badge: '🛡️ Bronze' },
  { value: 'Prata', label: 'Prata', color: '#94a3b8', badge: '⚔️ Prata' },
  { value: 'Ouro', label: 'Ouro', color: '#f59e0b', badge: '👑 Ouro' },
  { value: 'Diamante', label: 'Diamante', color: '#38bdf8', badge: '💎 Diamante' },
  { value: 'Lenda', label: 'Lenda', color: '#ec4899', badge: '🔥 Lenda' }
];

export default function ModuleDripSettings({
  releaseType,
  setReleaseType,
  releaseDays,
  setReleaseDays,
  releaseDate,
  setReleaseDate,
  requiredTier = null,
  setRequiredTier,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  isLightBg = false
}) {
  return (
    <div
      style={{
        padding: '14px',
        borderRadius: '10px',
        backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(15, 23, 42, 0.65)',
        border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
      data-testid="module-drip-settings-container"
    >
      {/* SEÇÃO 1: REQUISITO DE ELO RPG (RECOMPENSA PEDAGÓGICA) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Trophy size={16} style={{ color: '#facc15' }} />
          <label style={{ fontSize: '13px', fontWeight: 700, color: textColor, margin: 0 }}>
            Recompensa Pedagógica por Elo (Opcional)
          </label>
        </div>
        <p style={{ fontSize: '12px', color: subTextColor, margin: '0 0 8px 0', lineHeight: 1.4 }}>
          Exija um Elo mínimo no ranking da comunidade para desbloquear este módulo como recompensa exclusiva.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
          {ELO_OPTIONS.map((elo) => {
            const isSelected = requiredTier === elo.value;
            return (
              <button
                key={String(elo.value)}
                type="button"
                onClick={() => setRequiredTier?.(elo.value)}
                data-testid={`elo-tier-option-${elo.value || 'none'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '7px 4px',
                  borderRadius: '7px',
                  border: isSelected
                    ? `2px solid ${elo.color}`
                    : (isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.08)'),
                  backgroundColor: isSelected
                    ? `${elo.color}22`
                    : (isLightBg ? '#ffffff' : 'rgba(30, 41, 59, 0.5)'),
                  color: isSelected ? elo.color : textColor,
                  fontSize: '11px',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{elo.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.08)', margin: '2px 0' }} />

      {/* SEÇÃO 2: LIBERAÇÃO PROGRAMADA (DRIP CONTENT) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Clock size={16} style={{ color: '#eab308' }} />
          <label style={{ fontSize: '13px', fontWeight: 700, color: textColor, margin: 0 }}>
            Liberação Programada de Conteúdo (Drip Content)
          </label>
        </div>

        <p style={{ fontSize: '12px', color: subTextColor, margin: '0 0 8px 0', lineHeight: 1.4 }}>
          Configure o momento em que as aulas ficarão disponíveis para visualização.
        </p>

        {/* Opções de Liberação */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setReleaseType('immediate')}
            data-testid="drip-type-immediate"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 6px',
              borderRadius: '8px',
              border: releaseType === 'immediate'
                ? '2px solid #eab308'
                : (isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
              backgroundColor: releaseType === 'immediate'
                ? (isLightBg ? '#fef9c3' : 'rgba(234, 179, 8, 0.15)')
                : (isLightBg ? '#ffffff' : 'rgba(30, 41, 59, 0.5)'),
              color: releaseType === 'immediate' ? '#eab308' : textColor,
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <Zap size={16} />
            <span>Imediato</span>
          </button>

          <button
            type="button"
            onClick={() => setReleaseType('days_after')}
            data-testid="drip-type-days-after"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 6px',
              borderRadius: '8px',
              border: releaseType === 'days_after'
                ? '2px solid #eab308'
                : (isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
              backgroundColor: releaseType === 'days_after'
                ? (isLightBg ? '#fef9c3' : 'rgba(234, 179, 8, 0.15)')
                : (isLightBg ? '#ffffff' : 'rgba(30, 41, 59, 0.5)'),
              color: releaseType === 'days_after' ? '#eab308' : textColor,
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <Clock size={16} />
            <span>Dias após Entrada</span>
          </button>

          <button
            type="button"
            onClick={() => setReleaseType('specific_date')}
            data-testid="drip-type-specific-date"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 6px',
              borderRadius: '8px',
              border: releaseType === 'specific_date'
                ? '2px solid #eab308'
                : (isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
              backgroundColor: releaseType === 'specific_date'
                ? (isLightBg ? '#fef9c3' : 'rgba(234, 179, 8, 0.15)')
                : (isLightBg ? '#ffffff' : 'rgba(30, 41, 59, 0.5)'),
              color: releaseType === 'specific_date' ? '#eab308' : textColor,
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
          >
            <Calendar size={16} />
            <span>Data Fixa</span>
          </button>
        </div>

        {/* Configuração Condicional */}
        {releaseType === 'days_after' && (
          <div style={{ marginTop: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
              Liberar quantos dias após a matrícula do aluno?
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="number"
                min={1}
                max={365}
                value={releaseDays}
                onChange={(e) => setReleaseDays(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="form-control-modern"
                data-testid="drip-release-days-input"
                style={{ width: '120px' }}
              />
              <span style={{ fontSize: '12px', color: subTextColor }}>dias após a inscrição</span>
            </div>
          </div>
        )}

        {releaseType === 'specific_date' && (
          <div style={{ marginTop: '8px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: textColor, marginBottom: '4px' }}>
              Data e Hora de Liberação:
            </label>
            <input
              type="datetime-local"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="form-control-modern"
              data-testid="drip-release-date-input"
              style={{ maxWidth: '240px' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
