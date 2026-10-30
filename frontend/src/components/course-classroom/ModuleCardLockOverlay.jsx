import React from 'react';
import { Lock, Trophy } from 'lucide-react';

export function formatUnlockDate(availableAt, releaseDays, lockedReason, requiredTier) {
  if (lockedReason === 'elo' || requiredTier) {
    return `Exige Elo ${requiredTier || 'Superior'}`;
  }
  if (availableAt) {
    try {
      const d = new Date(availableAt);
      return `Liberado em ${d.toLocaleDateString('pt-BR')}`;
    } catch {
      // fallback
    }
  }
  if (releaseDays) {
    return `Liberado em ${releaseDays} dias`;
  }
  return 'Conteúdo programado';
}

export default function ModuleCardLockOverlay({
  isLocked,
  availableAt,
  releaseDays,
  lockedReason,
  requiredTier,
  requiredTierColor
}) {
  if (!isLocked) return null;

  const isElo = lockedReason === 'elo' || Boolean(requiredTier);
  const label = formatUnlockDate(availableAt, releaseDays, lockedReason, requiredTier);
  const accentColor = isElo ? (requiredTierColor || '#f59e0b') : '#eab308';

  return (
    <div
      data-testid="module-locked-badge"
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: isElo ? 'rgba(7, 10, 20, 0.84)' : 'rgba(5, 8, 15, 0.72)',
        backdropFilter: 'blur(3.5px)',
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '16px',
        textAlign: 'center'
      }}
    >
      <div
        data-testid={isElo ? 'module-elo-lock-icon' : 'module-drip-lock-icon'}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          backgroundColor: isElo ? `${accentColor}26` : 'rgba(234, 179, 8, 0.18)',
          border: `1.5px solid ${accentColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: accentColor,
          boxShadow: isElo ? `0 0 14px ${accentColor}44` : 'none'
        }}
      >
        {isElo ? <Trophy size={19} /> : <Lock size={18} />}
      </div>

      <span
        style={{
          fontSize: '11px',
          fontWeight: 800,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '0.6px'
        }}
      >
        {isElo ? 'Recompensa de Elo' : 'Bloqueado'}
      </span>

      <span
        style={{
          fontSize: '11.5px',
          fontWeight: 600,
          color: '#e2e8f0',
          lineHeight: 1.3
        }}
      >
        {label}
      </span>
    </div>
  );
}

