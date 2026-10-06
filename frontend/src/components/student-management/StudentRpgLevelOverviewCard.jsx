import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';
import { calculateStudentLevel, getTierBadgeStyle } from '../../utils/gamificationLevelUtils';

export default function StudentRpgLevelOverviewCard({
  totalPoints = 0,
  onOpenLadder,
  isLightBg = false,
}) {
  const levelInfo = calculateStudentLevel(totalPoints);
  const tierStyle = getTierBadgeStyle(levelInfo.level_tier, isLightBg);

  return (
    <div
      style={{
        borderRadius: '14px',
        backgroundColor: tierStyle.bg,
        border: tierStyle.border,
        boxShadow: tierStyle.glow,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        minHeight: 'fit-content',
        width: '100%',
        boxSizing: 'border-box',
      }}
      data-testid="student-rpg-overview-card"
    >
      {/* Topo do Card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.3)',
              border: `2px solid ${tierStyle.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              boxShadow: `0 0 12px ${tierStyle.color}40`,
              flexShrink: 0,
            }}
          >
            {levelInfo.level_badge.split(' ')[0]}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: tierStyle.color,
                }}
              >
                ELO {levelInfo.level_tier.toUpperCase()}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  backgroundColor: isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                  color: isLightBg ? '#64748b' : '#94a3b8',
                  fontWeight: 700,
                }}
              >
                Divisão {levelInfo.level_sub}
              </span>
            </div>

            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: isLightBg ? '#0f172a' : '#f8fafc',
                marginTop: '1px',
              }}
            >
              Nível {levelInfo.level} • {levelInfo.level_title}
            </div>
          </div>
        </div>

        {onOpenLadder && (
          <button
            type="button"
            onClick={onOpenLadder}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
              border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLightBg ? '#0f172a' : '#f8fafc',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            title="Ver escada completa de 20 níveis e patentes"
            data-testid="open-rpg-ladder-btn"
          >
            <Sparkles size={13} color={tierStyle.color} />
            <span>Ver 20 Níveis</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Barra de Progresso de XP */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem' }}>
          <span style={{ color: isLightBg ? '#64748b' : '#94a3b8', fontWeight: 600 }}>
            {levelInfo.is_max_level ? (
              <strong style={{ color: '#fbbf24' }}>🌟 Nível Máximo Atingido!</strong>
            ) : (
              <>
                Progresso: <strong>{levelInfo.points_in_level}</strong> / <strong>{levelInfo.points_needed_for_level} XP</strong> no nível
              </>
            )}
          </span>

          <span style={{ color: tierStyle.color, fontWeight: 800 }}>
            {levelInfo.is_max_level ? '100%' : `${levelInfo.level_progress_percent}%`}
          </span>
        </div>

        <div
          style={{
            width: '100%',
            height: '8px',
            borderRadius: '999px',
            backgroundColor: isLightBg ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.35)',
            overflow: 'hidden',
            border: isLightBg ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <div
            style={{
              width: `${levelInfo.level_progress_percent}%`,
              height: '100%',
              borderRadius: '999px',
              backgroundColor: tierStyle.color,
              boxShadow: `0 0 10px ${tierStyle.color}`,
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {!levelInfo.is_max_level && (
          <div style={{ marginTop: '6px', fontSize: '0.72rem', color: isLightBg ? '#64748b' : '#94a3b8' }}>
            Faltam <strong>{levelInfo.points_to_next_level} pts</strong> para alcançar o <strong>Nível {levelInfo.level + 1}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
