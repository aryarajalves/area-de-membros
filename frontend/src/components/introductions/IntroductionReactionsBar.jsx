import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp } from 'lucide-react';

export const REACTION_DEFINITIONS = [
  { key: 'like', label: 'Curtir', emoji: '👍', color: '#60a5fa', glow: 'rgba(96, 165, 250, 0.3)' },
  { key: 'love', label: 'Amei', emoji: '❤️', color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.3)' },
  { key: 'celebrate', label: 'Parabéns', emoji: '👏', color: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' },
  { key: 'insightful', label: 'Genial', emoji: '💡', color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.3)' },
  { key: 'fire', label: 'Incrível', emoji: '🔥', color: '#f97316', glow: 'rgba(249, 115, 22, 0.3)' },
  { key: 'rocket', label: 'Bora', emoji: '🚀', color: '#a855f7', glow: 'rgba(168, 85, 247, 0.3)' },
];

export function getReactionDef(key) {
  return REACTION_DEFINITIONS.find((r) => r.key === key) || REACTION_DEFINITIONS[0];
}

/**
 * Exibe o resumo visual das reações recebidas no post (pilha de emojis + total)
 */
export function ReactionPillSummary({ likesCount = 0, reactionsSummary = [] }) {
  if (!likesCount || likesCount <= 0) return null;

  // Seleciona até 3 emojis únicos presentes no post
  const displayTypes = reactionsSummary && reactionsSummary.length > 0 ? reactionsSummary.slice(0, 3) : ['like'];

  return (
    <div className="reaction-pill-summary" data-testid="reaction-pill-summary">
      <div className="reaction-emojis-stack">
        {displayTypes.map((type, idx) => {
          const def = getReactionDef(type);
          return (
            <span
              key={type}
              className="stacked-reaction-emoji"
              style={{ zIndex: 10 - idx }}
              title={def.label}
            >
              {def.emoji}
            </span>
          );
        })}
      </div>
      <span className="reaction-count-text">{likesCount}</span>
    </div>
  );
}

/**
 * Botão com menu flutuante (dock) estilo LinkedIn de reações
 */
export default function IntroductionReactionsBar({
  isLiked = false,
  myReaction = null,
  disabled = false,
  onToggleReaction,
  buttonClassName = '',
  dataTestId = 'reaction-main-trigger-btn',
}) {
  const [dockOpen, setDockOpen] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const containerRef = useRef(null);

  const activeDef = isLiked && myReaction ? getReactionDef(myReaction) : null;

  const handleMouseEnter = () => {
    if (disabled) return;
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setDockOpen(true);
    }, 180);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      setDockOpen(false);
    }, 280);
  };

  const handleReactionClick = (e, reactionKey) => {
    e.stopPropagation();
    setDockOpen(false);
    if (disabled || !onToggleReaction) return;
    onToggleReaction(reactionKey);
  };

  const handleMainButtonClick = (e) => {
    e.stopPropagation();
    if (disabled || !onToggleReaction) return;
    // Se já estiver curtido, remove enviando a mesma reação; se não, envia 'like'
    const targetKey = isLiked && myReaction ? myReaction : 'like';
    onToggleReaction(targetKey);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="intro-reaction-control-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dock Flutuante Estilo LinkedIn */}
      {dockOpen && (
        <div
          className="linkedin-reactions-dock"
          data-testid="linkedin-reactions-dock"
          role="menu"
          aria-label="Escolher reação"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {REACTION_DEFINITIONS.map((reaction, index) => {
            const isCurrent = isLiked && myReaction === reaction.key;
            return (
              <button
                key={reaction.key}
                type="button"
                className={`dock-reaction-item ${isCurrent ? 'is-selected-reaction' : ''}`}
                onClick={(e) => handleReactionClick(e, reaction.key)}
                title={reaction.label}
                data-testid={`dock-reaction-${reaction.key}`}
                style={{ animationDelay: `${index * 25}ms` }}
              >
                <span className="dock-reaction-emoji">{reaction.emoji}</span>
                <span className="dock-reaction-tooltip">{reaction.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Botão Principal */}
      <button
        type="button"
        className={`intro-reaction-main-btn ${buttonClassName} ${isLiked ? 'has-active-reaction' : ''}`}
        onClick={handleMainButtonClick}
        disabled={disabled}
        data-testid={dataTestId}
        style={
          activeDef
            ? {
                color: activeDef.color,
                borderColor: `${activeDef.color}40`,
                backgroundColor: `${activeDef.color}15`,
              }
            : undefined
        }
      >
        {activeDef ? (
          <span className="active-reaction-display">
            <span className="active-reaction-emoji">{activeDef.emoji}</span>
            <span className="active-reaction-label">{activeDef.label}</span>
          </span>
        ) : (
          <span className="default-reaction-display">
            <ThumbsUp size={15} className="default-thumb-icon" />
            <span>Curtir</span>
          </span>
        )}
      </button>
    </div>
  );
}
