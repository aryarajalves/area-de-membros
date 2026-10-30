import React, { useState, useEffect } from 'react';
import { Trophy, Sparkles, Shield, ChevronRight, Award, TrendingUp, Users } from 'lucide-react';
import { calculateStudentLevel, getTierBadgeStyle } from '../../utils/gamificationLevelUtils';
import GamificationRpgLadderModal from '../gamification/GamificationRpgLadderModal';
import { triggerLevelUpCelebration } from '../gamification/LevelUpWatcher';

export default function ProfileGamificationCard({
  currentUser,
  cardBorder,
  isLightBg = false,
  onNavigateTab
}) {
  const [rankingData, setRankingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLadderOpen, setIsLadderOpen] = useState(false);

  const isAluno = currentUser?.role === 'aluno';
  const isSuperAdmin = currentUser?.role === 'superadmin';

  useEffect(() => {
    let isMounted = true;
    const fetchRankingData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/v1/gamification/ranking?period=monthly', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setRankingData(data);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados de ranking e nível:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRankingData();
    return () => {
      isMounted = false;
    };
  }, []);

  const myPosition = rankingData?.my_position;
  const currentPoints = isAluno ? (myPosition?.points || 0) : 0;
  const levelInfo = calculateStudentLevel(currentPoints);
  const tierStyle = getTierBadgeStyle(levelInfo.level_tier, isLightBg);
  const monthName = rankingData?.month_name || 'Mês Atual';
  const totalParticipants = rankingData?.total_participants || 0;
  const top1Student = rankingData?.ranking?.[0];

  return (
    <div
      style={{
        marginBottom: '26px',
        borderRadius: '16px',
        border: isAluno ? tierStyle.border : (isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(59, 130, 246, 0.3)'),
        backgroundColor: isAluno
          ? tierStyle.bg
          : (isLightBg ? '#f8fafc' : 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85))'),
        boxShadow: isAluno ? tierStyle.glow : '0 8px 24px rgba(0, 0, 0, 0.25)',
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease',
      }}
      data-testid="profile-gamification-card"
    >
      {/* Background Decorativo Sutil */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          backgroundColor: isAluno ? `${tierStyle.color}15` : 'rgba(59, 130, 246, 0.1)',
          filter: 'blur(35px)',
          pointerEvents: 'none',
        }}
      />

      {/* Topo do Card */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '14px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.35)',
              border: `2px solid ${isAluno ? tierStyle.color : '#3b82f6'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: `0 0 14px ${isAluno ? tierStyle.color : '#3b82f6'}40`,
              flexShrink: 0,
            }}
            data-testid="profile-level-badge-icon"
          >
            {isAluno ? levelInfo.level_badge.split(' ')[0] : (isSuperAdmin ? '🛡️' : '⚔️')}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  color: isAluno ? tierStyle.color : '#60a5fa',
                }}
              >
                {isAluno ? `ELO ${levelInfo.level_tier.toUpperCase()}` : (isSuperAdmin ? 'SUPER ADMIN' : 'ADMINISTRADOR')}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: isLightBg ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                  color: isLightBg ? '#64748b' : '#94a3b8',
                  fontWeight: 700,
                }}
              >
                {isAluno ? `Divisão ${levelInfo.level_sub}` : 'Gestão da Comunidade'}
              </span>
            </div>

            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: isLightBg ? '#0f172a' : '#f8fafc',
                marginTop: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              data-testid="profile-level-title"
            >
              {isAluno ? `Nível ${levelInfo.level} • ${levelInfo.level_title}` : (isSuperAdmin ? 'Super Administrador Mestre' : 'Administrador da Plataforma')}
            </div>
          </div>
        </div>

        {/* Botões de Ação Rápida */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => triggerLevelUpCelebration(levelInfo)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '8px', backgroundColor: isLightBg ? '#fef9c3' : 'rgba(234, 179, 8, 0.14)', border: '1px solid rgba(234, 179, 8, 0.35)', color: '#facc15', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}
            title="Visualizar animação de conquista do seu nível"
            data-testid="btn-replay-levelup-animation"
          >
            <Award size={13} color="#facc15" />
            <span>Ver Conquista</span>
          </button>
          <button
            type="button"
            onClick={() => setIsLadderOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '8px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
              border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              color: isLightBg ? '#0f172a' : '#f8fafc',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Ver escada de 20 níveis e patentes da plataforma"
            data-testid="btn-view-rpg-ladder"
          >
            <Sparkles size={13} color={isAluno ? tierStyle.color : '#60a5fa'} />
            <span>Ver 20 Níveis</span>
          </button>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('ranking')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: isLightBg ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                color: isLightBg ? '#1d4ed8' : '#93c5fd',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Acessar página completa do Ranking e Conquistas"
              data-testid="btn-view-full-ranking"
            >
              <Trophy size={13} />
              <span>Ver Ranking</span>
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo Específico para Aluno */}
      {isAluno && (
        <>
          {/* Barra de Progresso de XP */}
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.76rem',
                marginBottom: '6px',
                color: isLightBg ? '#475569' : '#94a3b8',
                fontWeight: 600,
              }}
            >
              <span>Progresso no Nível {levelInfo.level}</span>
              <span style={{ color: tierStyle.color, fontWeight: 700 }}>
                {levelInfo.level_progress_percent}%
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: '7px',
                borderRadius: '999px',
                backgroundColor: isLightBg ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
                position: 'relative',
              }}
              data-testid="profile-xp-progress-track"
            >
              <div
                style={{
                  height: '100%',
                  width: `${levelInfo.level_progress_percent}%`,
                  borderRadius: '999px',
                  backgroundColor: tierStyle.color,
                  boxShadow: `0 0 10px ${tierStyle.color}`,
                  transition: 'width 0.4s ease',
                }}
                data-testid="profile-xp-progress-fill"
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.72rem',
                color: isLightBg ? '#64748b' : '#64748b',
                marginTop: '5px',
              }}
            >
              <span>{currentPoints} pts acumulados</span>
              <span>
                {levelInfo.is_max_level
                  ? '🌟 Nível Máximo Atingido'
                  : `Faltam ${levelInfo.points_to_next_level} pts para o Nível ${levelInfo.level + 1}`}
              </span>
            </div>
          </div>

          {/* Grid de Estatísticas do Aluno */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '10px',
            }}
          >
            {/* Posição no Ranking */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
              data-testid="stat-my-rank"
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  color: '#eab308',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '1rem',
                  flexShrink: 0,
                }}
              >
                {myPosition ? `#${myPosition.rank}` : '#-'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', color: isLightBg ? '#64748b' : '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Ranking Mensal
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: isLightBg ? '#0f172a' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {myPosition ? (myPosition.badge || 'Classificado') : 'Sem Classificação'}
                </div>
              </div>
            </div>

            {/* Pontos Totais */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
              data-testid="stat-my-points"
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  color: '#60a5fa',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Award size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', color: isLightBg ? '#64748b' : '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Pontuação Total
                </div>
                <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#facc15' }}>
                  {currentPoints.toLocaleString('pt-BR')} pts
                </div>
              </div>
            </div>

            {/* Conclusões e Melhores Respostas */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
                border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
              data-testid="stat-my-activities"
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(34, 197, 94, 0.15)',
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={18} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', color: isLightBg ? '#64748b' : '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Atividades
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isLightBg ? '#0f172a' : '#f8fafc' }}>
                  {myPosition?.lessons_completed_count || 0} aulas • {myPosition?.solutions_count || 0} soluções
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Conteúdo Específico para Administrador / Super Admin */}
      {!isAluno && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
          data-testid="profile-admin-gamification-info"
        >
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
              border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Shield size={16} color="#3b82f6" />
              <span style={{ fontSize: '0.74rem', color: isLightBg ? '#64748b' : '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Status no Ranking
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isLightBg ? '#0f172a' : '#f8fafc' }}>
              Supervisor da Comunidade
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: isLightBg ? '#64748b' : '#94a3b8', lineHeight: 1.4 }}>
              Contas administrativas não concorrem diretamente no ranking de alunos.
            </p>
          </div>

          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(0, 0, 0, 0.25)',
              border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Users size={16} color="#eab308" />
              <span style={{ fontSize: '0.74rem', color: isLightBg ? '#64748b' : '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                Disputa da Comunidade ({monthName})
              </span>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#facc15' }}>
              {totalParticipants} alunos disputando posições
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.72rem', color: isLightBg ? '#64748b' : '#94a3b8', lineHeight: 1.4 }}>
              {top1Student
                ? `1º Lugar atual: ${top1Student.name} (${top1Student.points} pts)`
                : 'Aguardando primeiros pontos registrados no mês.'}
            </p>
          </div>
        </div>
      )}

      {/* Modal da Escada Completa de 20 Níveis RPG */}
      <GamificationRpgLadderModal
        isOpen={isLadderOpen}
        onClose={() => setIsLadderOpen(false)}
        currentPoints={currentPoints}
        isLightBg={isLightBg}
      />
    </div>
  );
}
