import React from 'react';
import { X, Shield, Swords, Crown, Gem, Flame, CheckCircle } from 'lucide-react';
import { RPG_LEVELS, getTierBadgeStyle, calculateStudentLevel } from '../../utils/gamificationLevelUtils';

const TIER_ICONS = {
  Bronze: Shield,
  Prata: Swords,
  Ouro: Crown,
  Diamante: Gem,
  Lenda: Flame,
};

export default function GamificationRpgLadderModal({
  isOpen,
  onClose,
  currentPoints = 0,
  isLightBg = false,
}) {
  if (!isOpen) return null;

  const currentLevelInfo = calculateStudentLevel(currentPoints);

  const tiers = ['Bronze', 'Prata', 'Ouro', 'Diamante', 'Lenda'];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      data-testid="rpg-ladder-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          backgroundColor: isLightBg ? '#ffffff' : '#0f172a',
          border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
        data-testid="rpg-ladder-modal"
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem' }}>⚔️</span>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: isLightBg ? '#0f172a' : '#f8fafc',
                }}
              >
                Escada de Níveis RPG (20 Níveis)
              </h3>
            </div>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '0.8rem',
                color: isLightBg ? '#64748b' : '#94a3b8',
              }}
            >
              Acumule pontos em aulas, quizzes, chat e suporte para subir de nível e desbloquear novas patentes.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isLightBg ? '#64748b' : '#94a3b8',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Fechar"
            data-testid="close-rpg-ladder-modal-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Resumo do Aluno no Topo */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
            borderBottom: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>{currentLevelInfo.level_badge.split(' ')[0]}</span>
            <div>
              <div style={{ fontSize: '0.78rem', color: isLightBg ? '#64748b' : '#94a3b8' }}>Seu Nível Atual</div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: currentLevelInfo.level_color }}>
                Nível {currentLevelInfo.level} • {currentLevelInfo.level_title}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: isLightBg ? '#64748b' : '#94a3b8' }}>Pontuação Acumulada</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#eab308' }}>
              {currentPoints} pts
            </div>
          </div>
        </div>

        {/* Conteúdo com scroll */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {tiers.map((tierName) => {
            const TierIcon = TIER_ICONS[tierName] || Shield;
            const tierStyle = getTierBadgeStyle(tierName, isLightBg);
            const tierLevels = RPG_LEVELS.filter((l) => l.tier === tierName);

            return (
              <div
                key={tierName}
                style={{
                  borderRadius: '12px',
                  backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
                  border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.07)',
                  overflow: 'hidden',
                }}
              >
                {/* Cabeçalho do Elo */}
                <div
                  style={{
                    padding: '10px 16px',
                    backgroundColor: tierStyle.bg,
                    borderBottom: tierStyle.border,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <TierIcon size={16} color={tierStyle.color} />
                  <span style={{ fontSize: '0.86rem', fontWeight: 800, color: tierStyle.color, letterSpacing: '0.5px' }}>
                    ELO {tierName.toUpperCase()}
                  </span>
                </div>

                {/* Grade de Níveis */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px', padding: '12px' }}>
                  {tierLevels.map((lvl) => {
                    const isCurrent = currentLevelInfo.level === lvl.level;
                    const isUnlocked = currentPoints >= lvl.min_points;

                    return (
                      <div
                        key={lvl.level}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          backgroundColor: isCurrent
                            ? isLightBg ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.12)'
                            : isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                          border: isCurrent
                            ? '1.5px solid #38bdf8'
                            : isLightBg ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: isCurrent ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
                        }}
                        data-testid={`rpg-ladder-level-${lvl.level}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '1.1rem' }}>{lvl.badge.split(' ')[0]}</span>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: lvl.color }}>
                                Nv. {lvl.level}
                              </span>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isLightBg ? '#0f172a' : '#f8fafc' }}>
                                {lvl.title}
                              </span>
                              {isCurrent && (
                                <span
                                  style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '1px 6px',
                                    borderRadius: '999px',
                                    backgroundColor: '#38bdf8',
                                    color: '#0f172a',
                                  }}
                                >
                                  ATUAL
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: isLightBg ? '#64748b' : '#94a3b8' }}>
                              {lvl.description}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isUnlocked ? '#22c55e' : (isLightBg ? '#64748b' : '#94a3b8') }}>
                            {lvl.min_points} pts
                          </div>
                          {isUnlocked && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', fontSize: '0.65rem', color: '#22c55e', fontWeight: 700 }}>
                              <CheckCircle size={10} /> Conquistado
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
