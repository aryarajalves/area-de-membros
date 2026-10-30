import React, { useEffect, useState } from 'react';
import { Award, Sparkles, Trophy, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { getTierBadgeStyle } from '../../utils/gamificationLevelUtils';

/**
 * Toca uma breve e agradável fanfarra comemorativa de Level Up
 * utilizando a Web Audio API nativa (sem downloads externos).
 */
function playVictorySound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const notes = [
      { f: 523.25, d: 0.12, t: 0 },    // C5
      { f: 659.25, d: 0.12, t: 0.12 }, // E5
      { f: 783.99, d: 0.15, t: 0.24 }, // G5
      { f: 1046.50, d: 0.45, t: 0.38 } // C6 (Sustentado)
    ];

    notes.forEach(({ f, d, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + d + 0.05);
    });
  } catch {
    // Silently ignore if blocked by browser autoplay policy
  }
}

export default function LevelUpCelebrationModal({
  isOpen,
  onClose,
  levelData,
  studentName = 'Aluno'
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (isOpen && soundEnabled) {
      playVictorySound();
    }
  }, [isOpen, soundEnabled]);

  if (!isOpen || !levelData) return null;

  const tier = levelData.level_tier || levelData.tier || 'Bronze';
  const tierStyle = getTierBadgeStyle(tier);
  const title = levelData.level_title || levelData.title || `${tier} I`;
  const badge = levelData.level_badge || levelData.badge || `🛡️ ${title}`;
  const tierColor = levelData.tier_color || tierStyle.color;
  const description = levelData.description || 'Você conquistou um novo patamar de prestígio na comunidade!';

  return (
    <div
      className="custom-modal-overlay"
      data-testid="levelup-celebration-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 18, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px'
      }}
    >
      {/* Estilos em linha para partículas neon */}
      <style>{`
        @keyframes floatConfetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(350px) rotate(360deg); opacity: 0; }
        }
        @keyframes pulseEmblem {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px ${tierColor}); }
          50% { transform: scale(1.06); filter: drop-shadow(0 0 30px ${tierColor}); }
        }
      `}</style>

      {/* Partículas neon decorativas */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i * 5.8) % 100}%`,
              top: `${(i * 7) % 35}%`,
              width: `${(i % 3 + 2) * 4}px`,
              height: `${(i % 3 + 2) * 4}px`,
              borderRadius: i % 2 === 0 ? '50%' : '2px',
              backgroundColor: i % 3 === 0 ? '#fbbf24' : (i % 2 === 0 ? tierColor : '#38bdf8'),
              boxShadow: `0 0 12px ${tierColor}`,
              animation: `floatConfetti ${2.5 + (i % 4) * 0.5}s ease-in-out infinite`,
              animationDelay: `${(i * 0.2)}s`
            }}
          />
        ))}
      </div>

      {/* Card Central de Celebração */}
      <div
        className="table-card"
        data-testid="levelup-celebration-card"
        style={{
          maxWidth: '460px',
          width: '100%',
          backgroundColor: '#0c1222',
          border: `2px solid ${tierColor}`,
          borderRadius: '20px',
          padding: '32px 24px',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: `0 0 45px ${tierColor}44, 0 25px 50px -12px rgba(0, 0, 0, 0.9)`,
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão de Som no Canto Superior */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Silenciar som' : 'Ativar som'}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#94a3b8',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Tag no Topo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '9999px', backgroundColor: `${tierColor}22`, border: `1px solid ${tierColor}66`, color: tierColor, fontSize: '12px', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '16px' }}>
          <Sparkles size={14} />
          <span>Subiu de Nível no RPG</span>
        </div>

        {/* Brasão Pulsante */}
        <div style={{ margin: '14px auto', width: '92px', height: '92px', borderRadius: '50%', backgroundColor: `${tierColor}18`, border: `3px solid ${tierColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '42px', animation: 'pulseEmblem 2.5s ease-in-out infinite' }} data-testid="levelup-emblem">
          <Trophy size={48} style={{ color: tierColor }} />
        </div>

        {/* Título Principal */}
        <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '8px 0 4px', letterSpacing: '-0.02em', background: `linear-gradient(135deg, #ffffff 40%, ${tierColor} 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          PARABÉNS, {studentName.toUpperCase()}!
        </h2>

        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.4 }}>
          Sua constância e dedicação nos estudos desbloquearam uma nova conquista:
        </p>

        {/* Badge do Novo Elo */}
        <div style={{ display: 'inline-block', padding: '10px 20px', borderRadius: '12px', backgroundColor: tierStyle.bg, border: `1.5px solid ${tierColor}`, boxShadow: tierStyle.glow, margin: '0 0 16px' }} data-testid="levelup-badge-display">
          <div style={{ fontSize: '18px', fontWeight: 800, color: tierColor }}>
            {badge}
          </div>
          <div style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '2px' }}>
            Elo {tier} • Patente Oficial da Comunidade
          </div>
        </div>

        <p style={{ fontSize: '12.5px', color: '#cbd5e1', margin: '0 0 24px', fontStyle: 'italic', padding: '0 12px' }}>
          "{description}"
        </p>

        {/* Botão de Fechar e Continuar */}
        <button
          type="button"
          onClick={onClose}
          data-testid="levelup-continue-btn"
          style={{
            width: '100%',
            padding: '13px 20px',
            fontSize: '14px',
            fontWeight: 800,
            borderRadius: '12px',
            border: 'none',
            background: `linear-gradient(135deg, ${tierColor} 0%, #eab308 100%)`,
            color: '#0f172a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: `0 4px 18px ${tierColor}66`,
            transition: 'transform 0.15s ease'
          }}
        >
          <span>Continuar Evoluindo</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
