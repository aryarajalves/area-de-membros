import { describe, it, expect } from 'vitest';
import {
  RPG_LEVELS,
  calculateStudentLevel,
  getTierBadgeStyle
} from './gamificationLevelUtils';

describe('gamificationLevelUtils', () => {
  it('has 20 balanced exponential RPG levels', () => {
    expect(RPG_LEVELS).toHaveLength(20);
    expect(RPG_LEVELS[0].title).toBe('Bronze I');
    expect(RPG_LEVELS[0].min_points).toBe(0);
    expect(RPG_LEVELS[1].title).toBe('Bronze II');
    expect(RPG_LEVELS[1].min_points).toBe(100);
    expect(RPG_LEVELS[2].title).toBe('Bronze III');
    expect(RPG_LEVELS[2].min_points).toBe(250);
    expect(RPG_LEVELS[3].title).toBe('Bronze IV');
    expect(RPG_LEVELS[3].min_points).toBe(500);
    expect(RPG_LEVELS[4].title).toBe('Prata I');
    expect(RPG_LEVELS[4].min_points).toBe(850);
    expect(RPG_LEVELS[19].title).toBe('Lenda Suprema');
    expect(RPG_LEVELS[19].min_points).toBe(40000);
  });

  it('keeps 120 points (4 completed lessons) in Bronze II instead of Bronze IV', () => {
    const studentLvl = calculateStudentLevel(120);

    expect(studentLvl.level).toBe(2);
    expect(studentLvl.level_title).toBe('Bronze II');
    expect(studentLvl.level_tier).toBe('Bronze');
    expect(studentLvl.is_max_level).toBe(false);
    expect(studentLvl.next_level_min_points).toBe(250);
    expect(studentLvl.points_to_next_level).toBe(130);
    // 20 earned in level out of 150 span -> ~13%
    expect(studentLvl.level_progress_percent).toBe(13);
  });

  it('requires 500 points to reach Bronze IV', () => {
    const studentLvl = calculateStudentLevel(500);

    expect(studentLvl.level).toBe(4);
    expect(studentLvl.level_title).toBe('Bronze IV');
    expect(studentLvl.next_level_min_points).toBe(850);
    expect(studentLvl.points_to_next_level).toBe(350);
  });

  it('handles maximum level correctly (Lenda Suprema)', () => {
    const studentLvl = calculateStudentLevel(42000);

    expect(studentLvl.level).toBe(20);
    expect(studentLvl.level_title).toBe('Lenda Suprema');
    expect(studentLvl.is_max_level).toBe(true);
    expect(studentLvl.next_level_min_points).toBeNull();
    expect(studentLvl.points_to_next_level).toBe(0);
    expect(studentLvl.level_progress_percent).toBe(100);
  });

  it('returns valid badge styles for each tier', () => {
    const bronze = getTierBadgeStyle('Bronze');
    expect(bronze.color).toBe('#fb923c');

    const prata = getTierBadgeStyle('Prata');
    expect(prata.color).toBe('#94a3b8');

    const ouro = getTierBadgeStyle('Ouro');
    expect(ouro.color).toBe('#f59e0b');

    const diamante = getTierBadgeStyle('Diamante');
    expect(diamante.color).toBe('#38bdf8');

    const lenda = getTierBadgeStyle('Lenda');
    expect(lenda.color).toBe('#ec4899');

    const fallback = getTierBadgeStyle('Desconhecido');
    expect(fallback.color).toBe('#cbd5e1');
  });
});
