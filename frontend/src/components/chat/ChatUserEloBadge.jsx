import React from 'react';
import { getTierBadgeStyle } from '../../utils/gamificationLevelUtils';

/**
 * Retorna estilos de borda e sombra iluminada (neon glow) para o avatar no chat
 * com base no Elo atual do aluno no sistema RPG.
 */
export function getChatAvatarEloStyle(user) {
  if (!user || user.role !== 'aluno' || !user.gamification_tier) {
    return {
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)',
    };
  }

  const tier = user.gamification_tier;
  const tierColor = user.gamification_tier_color || '#eab308';
  const tierStyle = getTierBadgeStyle(tier);

  return {
    border: `2px solid ${tierColor}`,
    boxShadow: `0 0 10px ${tierColor}88, inset 0 0 4px ${tierColor}44`,
  };
}

/**
 * Badge elegante exibida ao lado do nome do aluno no Chat da Comunidade
 * indicando o Elo e a divisão conquistada no ranking RPG.
 */
export default function ChatUserEloBadge({ user }) {
  if (!user || user.role !== 'aluno' || !user.gamification_tier) {
    return null;
  }

  const tier = user.gamification_tier;
  const tierStyle = getTierBadgeStyle(tier);
  const title = user.gamification_badge || user.gamification_level_title || `${tier} I`;

  return (
    <span
      data-testid={`chat-user-elo-badge-${user.id}`}
      title={`Elo RPG na Comunidade: ${title}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.6875rem',
        fontWeight: 700,
        padding: '1.5px 8px',
        borderRadius: '9999px',
        backgroundColor: tierStyle.bg,
        color: tierStyle.color,
        border: tierStyle.border,
        boxShadow: tierStyle.glow,
        letterSpacing: '0.2px',
        userSelect: 'none',
      }}
    >
      <span>{title}</span>
    </span>
  );
}
