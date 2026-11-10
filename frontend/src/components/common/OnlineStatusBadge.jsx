import React from 'react';

/**
 * Formata um timestamp ISO em texto humanizado de última visualização.
 */
export function formatLastSeen(lastSeenAt) {
  if (!lastSeenAt) return 'Offline';
  try {
    const d = new Date(lastSeenAt);
    if (isNaN(d.getTime())) return 'Offline';

    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 2) return 'Visto há instantes';
    if (diffMin < 60) return `Visto há ${diffMin} min`;
    if (diffHours < 24) return `Visto há ${diffHours}h`;
    if (diffDays === 1) {
      const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `Visto ontem às ${time}`;
    }
    if (diffDays < 7) return `Visto há ${diffDays} dias`;

    const formatted = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return `Visto em ${formatted}`;
  } catch {
    return 'Offline';
  }
}

/**
 * Ponto indicador circular (Dot) para sobrepor no avatar do usuário.
 */
export function OnlineStatusDot({
  isOnline = false,
  size = 11,
  borderColor = '#0c1222',
  style = {},
  dataTestId = 'online-status-dot',
}) {
  const dotColor = isOnline ? '#10b981' : '#64748b';
  const glow = isOnline ? '0 0 6px #10b981' : 'none';

  return (
    <span
      data-testid={dataTestId}
      title={isOnline ? 'Online agora' : 'Offline'}
      style={{
        position: 'absolute',
        bottom: '-1px',
        right: '-1px',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        backgroundColor: dotColor,
        border: `2px solid ${borderColor}`,
        boxShadow: glow,
        transition: 'all 0.2s ease',
        pointerEvents: 'none',
        zIndex: 2,
        ...style,
      }}
    />
  );
}

/**
 * Badge completa com texto ("🟢 Online agora" ou "⚪ Visto por último: ...")
 */
export default function OnlineStatusBadge({
  isOnline = false,
  lastSeenAt = null,
  size = 'md', // 'sm' ou 'md'
  showLastSeen = true,
  dataTestId = 'online-status-badge',
}) {
  const isSm = size === 'sm';
  const text = isOnline
    ? 'Online agora'
    : (showLastSeen ? formatLastSeen(lastSeenAt) : 'Offline');

  return (
    <span
      data-testid={dataTestId}
      title={isOnline ? 'Usuário conectado no momento' : (lastSeenAt ? `Última conexão: ${new Date(lastSeenAt).toLocaleString('pt-BR')}` : 'Desconectado')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? '4px' : '5px',
        padding: isSm ? '2px 7px' : '2.5px 9px',
        borderRadius: '999px',
        fontSize: isSm ? '0.70rem' : '0.74rem',
        fontWeight: 600,
        backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.14)' : 'rgba(100, 116, 139, 0.12)',
        color: isOnline ? '#34d399' : '#94a3b8',
        border: `1px solid ${isOnline ? 'rgba(16, 185, 129, 0.35)' : 'rgba(100, 116, 139, 0.25)'}`,
        flexShrink: 0,
        transition: 'all 0.2s ease',
      }}
    >
      <span
        style={{
          width: isSm ? '6px' : '7px',
          height: isSm ? '6px' : '7px',
          borderRadius: '50%',
          backgroundColor: isOnline ? '#10b981' : '#64748b',
          boxShadow: isOnline ? '0 0 5px #10b981' : 'none',
          flexShrink: 0,
        }}
      />
      <span>{text}</span>
    </span>
  );
}
