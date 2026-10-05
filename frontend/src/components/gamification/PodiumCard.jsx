import React from 'react';
import { Trophy, Award, Medal, CheckCircle2, BookOpen, Star, Crown } from 'lucide-react';

export default function PodiumCard({ student, position }) {
  if (!student) return null;

  const configByPos = {
    1: {
      color: '#eab308',
      glow: 'rgba(234, 179, 8, 0.4)',
      bg: 'linear-gradient(180deg, rgba(234, 179, 8, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
      border: '2px solid rgba(234, 179, 8, 0.6)',
      icon: Crown,
      medalText: '1º Lugar',
      badgeColor: '#facc15',
      height: '340px',
      order: 2, // Centro no desktop
      scale: '1.05',
    },
    2: {
      color: '#94a3b8',
      glow: 'rgba(148, 163, 184, 0.3)',
      bg: 'linear-gradient(180deg, rgba(148, 163, 184, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
      border: '1px solid rgba(148, 163, 184, 0.4)',
      icon: Medal,
      medalText: '2º Lugar',
      badgeColor: '#cbd5e1',
      height: '310px',
      order: 1, // Esquerda
      scale: '1.0',
    },
    3: {
      color: '#d97706',
      glow: 'rgba(217, 119, 6, 0.3)',
      bg: 'linear-gradient(180deg, rgba(217, 119, 6, 0.12) 0%, rgba(15, 23, 42, 0.9) 100%)',
      border: '1px solid rgba(217, 119, 6, 0.4)',
      icon: Award,
      medalText: '3º Lugar',
      badgeColor: '#fbbf24',
      height: '290px',
      order: 3, // Direita
      scale: '0.98',
    }
  };

  const current = configByPos[position] || configByPos[1];
  const IconComponent = current.icon;

  return (
    <div
      className={`podium-card podium-card-${position}`}
      style={{
        background: current.bg,
        border: current.border,
        borderRadius: '20px',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: `0 20px 35px -10px ${current.glow}`,
        position: 'relative',
        order: current.order,
        transform: `scale(${current.scale})`,
        transition: 'all 0.3s ease',
        minWidth: '260px',
        flex: 1,
      }}
      data-testid={`podium-card-${position}`}
    >
      {/* Selo de Posição do Topo */}
      <div
        style={{
          position: 'absolute',
          top: '-16px',
          background: '#0f172a',
          border: `2px solid ${current.color}`,
          color: current.color,
          padding: '4px 14px',
          borderRadius: '20px',
          fontWeight: 800,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: `0 4px 12px ${current.glow}`
        }}
      >
        <IconComponent size={16} />
        <span>{current.medalText}</span>
      </div>

      {/* Avatar do Aluno com coroa */}
      <div style={{ position: 'relative', marginTop: '12px', marginBottom: '14px' }}>
        {student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.name}
            style={{
              width: position === 1 ? '76px' : '64px',
              height: position === 1 ? '76px' : '64px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: `3px solid ${current.color}`,
              boxShadow: `0 0 15px ${current.glow}`
            }}
            data-testid={`podium-avatar-${position}`}
          />
        ) : (
          <div
            style={{
              width: position === 1 ? '76px' : '64px',
              height: position === 1 ? '76px' : '64px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${current.color}, #1e293b)`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: position === 1 ? '1.8rem' : '1.4rem',
              border: `3px solid ${current.color}`,
              boxShadow: `0 0 15px ${current.glow}`
            }}
          >
            {student.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Nome e Badge */}
      <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
        {student.name}
        {student.is_current_user && (
          <span style={{ fontSize: '0.72rem', background: '#3b82f6', color: '#fff', padding: '2px 6px', borderRadius: '6px', marginLeft: '6px' }}>
            Você
          </span>
        )}
      </h3>
      <div style={{ fontSize: '0.78rem', color: current.badgeColor, fontWeight: 600, marginBottom: '16px' }}>
        {student.badge}
      </div>

      {/* Pontuação Gigante */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '10px 18px',
          width: '100%',
          marginBottom: '14px'
        }}
      >
        <div style={{ fontSize: '1.7rem', fontWeight: 800, color: current.color, lineHeight: 1 }} data-testid={`podium-points-${position}`}>
          {student.points.toLocaleString('pt-BR')}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
          Pontos Acumulados
        </div>
      </div>

      {/* Mini estatísticas: Soluções e Aulas */}
      <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', fontSize: '0.78rem', color: '#cbd5e1' }}>
        <div title="Melhores Soluções aceitas no Suporte">
          <span style={{ color: '#4ade80', fontWeight: 700 }}>🏆 {student.solutions_count}</span>
          <span style={{ color: '#64748b', marginLeft: '4px' }}>soluções</span>
        </div>
        <div title="Aulas concluídas">
          <span style={{ color: '#60a5fa', fontWeight: 700 }}>🎓 {student.lessons_completed_count}</span>
          <span style={{ color: '#64748b', marginLeft: '4px' }}>aulas</span>
        </div>
      </div>
    </div>
  );
}
