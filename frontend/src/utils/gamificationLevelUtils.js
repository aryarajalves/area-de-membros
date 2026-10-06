/**
 * Utilitários e definições do Sistema de Níveis RPG (20 Níveis).
 * Elo Bronze (1-4), Elo Prata (5-8), Elo Ouro (9-12), Elo Diamante (13-16), Elo Lenda (17-20).
 */

export const RPG_LEVELS = [
  // ELO BRONZE (Níveis 1 ao 4)
  { level: 1, tier: 'Bronze', sub: 'I', title: 'Bronze I', badge: '🛡️ Bronze I', min_points: 0, color: '#cd7f32', tier_color: '#cd7f32', description: 'Início da jornada na plataforma' },
  { level: 2, tier: 'Bronze', sub: 'II', title: 'Bronze II', badge: '🛡️ Bronze II', min_points: 25, color: '#cd7f32', tier_color: '#cd7f32', description: 'Primeiros passos e primeiras aulas' },
  { level: 3, tier: 'Bronze', sub: 'III', title: 'Bronze III', badge: '🛡️ Bronze III', min_points: 60, color: '#cd7f32', tier_color: '#cd7f32', description: 'Estudante dedicado' },
  { level: 4, tier: 'Bronze', sub: 'IV', title: 'Bronze IV', badge: '🛡️ Bronze IV', min_points: 110, color: '#cd7f32', tier_color: '#cd7f32', description: 'Dominando o básico' },

  // ELO PRATA (Níveis 5 ao 8)
  { level: 5, tier: 'Prata', sub: 'I', title: 'Prata I', badge: '⚔️ Prata I', min_points: 180, color: '#94a3b8', tier_color: '#94a3b8', description: 'Ingresso na divisão Prata' },
  { level: 6, tier: 'Prata', sub: 'II', title: 'Prata II', badge: '⚔️ Prata II', min_points: 270, color: '#94a3b8', tier_color: '#94a3b8', description: 'Praticante constante' },
  { level: 7, tier: 'Prata', sub: 'III', title: 'Prata III', badge: '⚔️ Prata III', min_points: 380, color: '#94a3b8', tier_color: '#94a3b8', description: 'Aluno de destaque' },
  { level: 8, tier: 'Prata', sub: 'IV', title: 'Prata IV', badge: '⚔️ Prata IV', min_points: 510, color: '#94a3b8', tier_color: '#94a3b8', description: 'Veterano de Prata' },

  // ELO OURO (Níveis 9 ao 12)
  { level: 9, tier: 'Ouro', sub: 'I', title: 'Ouro I', badge: '👑 Ouro I', min_points: 660, color: '#f59e0b', tier_color: '#f59e0b', description: 'Consagração no Elo Ouro' },
  { level: 10, tier: 'Ouro', sub: 'II', title: 'Ouro II', badge: '👑 Ouro II', min_points: 840, color: '#f59e0b', tier_color: '#f59e0b', description: 'Especialista em conteúdo' },
  { level: 11, tier: 'Ouro', sub: 'III', title: 'Ouro III', badge: '👑 Ouro III', min_points: 1050, color: '#f59e0b', tier_color: '#f59e0b', description: 'Líder em aprendizado' },
  { level: 12, tier: 'Ouro', sub: 'IV', title: 'Ouro IV', badge: '👑 Ouro IV', min_points: 1300, color: '#f59e0b', tier_color: '#f59e0b', description: 'Mestre da divisão Ouro' },

  // ELO DIAMANTE (Níveis 13 ao 16)
  { level: 13, tier: 'Diamante', sub: 'I', title: 'Diamante I', badge: '💎 Diamante I', min_points: 1600, color: '#38bdf8', tier_color: '#38bdf8', description: 'Elite Diamante da comunidade' },
  { level: 14, tier: 'Diamante', sub: 'II', title: 'Diamante II', badge: '💎 Diamante II', min_points: 1950, color: '#38bdf8', tier_color: '#38bdf8', description: 'Brilho e excelência contínua' },
  { level: 15, tier: 'Diamante', sub: 'III', title: 'Diamante III', badge: '💎 Diamante III', min_points: 2350, color: '#38bdf8', tier_color: '#38bdf8', description: 'Referência entre os alunos' },
  { level: 16, tier: 'Diamante', sub: 'IV', title: 'Diamante IV', badge: '💎 Diamante IV', min_points: 2800, color: '#38bdf8', tier_color: '#38bdf8', description: 'Pilar fundamental da comunidade' },

  // ELO LENDA (Níveis 17 ao 20)
  { level: 17, tier: 'Lenda', sub: 'I', title: 'Lenda I', badge: '🔥 Lenda I', min_points: 3300, color: '#a855f7', tier_color: '#a855f7', description: 'Ascensão lendária' },
  { level: 18, tier: 'Lenda', sub: 'II', title: 'Lenda II', badge: '🔥 Lenda II', min_points: 3850, color: '#a855f7', tier_color: '#a855f7', description: 'Chama inextinguível de dedicação' },
  { level: 19, tier: 'Lenda', sub: 'III', title: 'Lenda III', badge: '🔥 Lenda III', min_points: 4450, color: '#ec4899', tier_color: '#ec4899', description: 'Próximo do ápice supremo' },
  { level: 20, tier: 'Lenda', sub: 'Suprema', title: 'Lenda Suprema', badge: '🌟 Lenda Suprema', min_points: 5000, color: '#fbbf24', tier_color: '#fbbf24', description: 'Nível Máximo: O patamar mais alto da Área de Membros' },
];

/**
 * Calcula o nível RPG, progresso e dados complementares de um aluno com base nos pontos.
 */
export function calculateStudentLevel(totalPoints) {
  const pts = Math.max(0, Number(totalPoints || 0));

  let currentIdx = 0;
  for (let i = 0; i < RPG_LEVELS.length; i += 1) {
    if (pts >= RPG_LEVELS[i].min_points) {
      currentIdx = i;
    } else {
      break;
    }
  }

  const curr = RPG_LEVELS[currentIdx];
  const isMax = currentIdx === RPG_LEVELS.length - 1;

  if (isMax) {
    return {
      level: curr.level,
      level_title: curr.title,
      level_badge: curr.badge,
      level_tier: curr.tier,
      level_sub: curr.sub,
      level_color: curr.color,
      tier_color: curr.tier_color,
      current_level_min_points: curr.min_points,
      next_level_min_points: null,
      points_to_next_level: 0,
      level_progress_percent: 100,
      is_max_level: true,
      points_in_level: pts - curr.min_points,
      points_needed_for_level: 0,
    };
  }

  const nextLvl = RPG_LEVELS[currentIdx + 1];
  const span = nextLvl.min_points - curr.min_points;
  const earnedInLevel = pts - curr.min_points;
  const ptsToNext = Math.max(0, nextLvl.min_points - pts);
  const progressPct = span > 0 ? Math.min(100, Math.max(0, Math.round((earnedInLevel / span) * 100))) : 100;

  return {
    level: curr.level,
    level_title: curr.title,
    level_badge: curr.badge,
    level_tier: curr.tier,
    level_sub: curr.sub,
    level_color: curr.color,
    tier_color: curr.tier_color,
    current_level_min_points: curr.min_points,
    next_level_min_points: nextLvl.min_points,
    points_to_next_level: ptsToNext,
    level_progress_percent: progressPct,
    is_max_level: false,
    points_in_level: earnedInLevel,
    points_needed_for_level: span,
  };
}

/**
 * Retorna estilos de brilho e borda para o Elo correspondente.
 */
export function getTierBadgeStyle(tier, isLightBg = false) {
  switch (tier) {
    case 'Bronze':
      return {
        bg: isLightBg ? '#fff7ed' : 'rgba(205, 127, 50, 0.16)',
        border: '1px solid rgba(205, 127, 50, 0.55)',
        color: '#fb923c',
        glow: '0 0 12px rgba(205, 127, 50, 0.28)',
      };
    case 'Prata':
      return {
        bg: isLightBg ? '#f1f5f9' : 'rgba(148, 163, 184, 0.12)',
        border: '1px solid rgba(148, 163, 184, 0.4)',
        color: '#94a3b8',
        glow: '0 0 10px rgba(148, 163, 184, 0.2)',
      };
    case 'Ouro':
      return {
        bg: isLightBg ? '#fefce8' : 'rgba(245, 158, 11, 0.12)',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        color: '#f59e0b',
        glow: '0 0 10px rgba(245, 158, 11, 0.25)',
      };
    case 'Diamante':
      return {
        bg: isLightBg ? '#f0f9ff' : 'rgba(56, 189, 248, 0.12)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        color: '#38bdf8',
        glow: '0 0 12px rgba(56, 189, 248, 0.3)',
      };
    case 'Lenda':
      return {
        bg: isLightBg ? '#fdf2f8' : 'rgba(168, 85, 247, 0.14)',
        border: '1px solid rgba(236, 72, 153, 0.5)',
        color: '#ec4899',
        glow: '0 0 14px rgba(236, 72, 153, 0.35)',
      };
    default:
      return {
        bg: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        color: '#cbd5e1',
        glow: 'none',
      };
  }
}
