import React from 'react';
import { calculateStudentLevel, getTierBadgeStyle } from '../../utils/gamificationLevelUtils';

export default function StudentRpgLevelBadge({
  totalPoints = 0,
  onClick,
  isLightBg = false,
  studentId,
  showProgressBar = true,
  compact = false,
}) {
  const levelInfo = calculateStudentLevel(totalPoints);
  const tierStyle = getTierBadgeStyle(levelInfo.level_tier, isLightBg);

  const tooltipText = levelInfo.is_max_level
    ? `${levelInfo.level_title} (Nível Máximo alcançado!) - ${totalPoints} pts`
    : `${levelInfo.level_title}: ${levelInfo.points_in_level}/${levelInfo.points_needed_for_level} XP (${levelInfo.level_progress_percent}%) • Faltam ${levelInfo.points_to_next_level} pts para o próximo nível`;

  if (compact) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '2px 8px',
          borderRadius: '6px',
          backgroundColor: tierStyle.bg,
          border: tierStyle.border,
          color: tierStyle.color,
          fontSize: '0.72rem',
          fontWeight: 700,
          boxShadow: tierStyle.glow,
          letterSpacing: '0.2px',
          flexShrink: 0,
        }}
        title={tooltipText}
        data-testid={`student-rpg-badge-compact-${studentId || 'item'}`}
      >
        <span>{levelInfo.level_badge}</span>
      </span>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '4px',
        cursor: onClick ? 'pointer' : 'default',
        padding: '5px 10px',
        borderRadius: '8px',
        backgroundColor: tierStyle.bg,
        border: tierStyle.border,
        boxShadow: tierStyle.glow,
        transition: 'all 0.2s ease',
        minWidth: '130px',
        flexShrink: 0,
      }}
      title={tooltipText}
      data-testid={`student-rpg-badge-${studentId || 'card'}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{ fontSize: '0.85rem' }}>{levelInfo.level_badge.split(' ')[0]}</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: tierStyle.color }}>
            Nv. {levelInfo.level}
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isLightBg ? '#475569' : '#cbd5e1' }}>
            {levelInfo.level_title}
          </span>
        </div>

        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: tierStyle.color }}>
          {levelInfo.is_max_level ? 'MAX' : `${levelInfo.level_progress_percent}%`}
        </span>
      </div>

      {showProgressBar && (
        <div
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '999px',
            backgroundColor: isLightBg ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.12)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${levelInfo.level_progress_percent}%`,
              height: '100%',
              borderRadius: '999px',
              backgroundColor: tierStyle.color,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      )}
    </div>
  );
}
