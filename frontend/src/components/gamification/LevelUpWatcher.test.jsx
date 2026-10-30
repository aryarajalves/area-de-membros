import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import LevelUpWatcher, { triggerLevelUpCelebration } from './LevelUpWatcher';

describe('LevelUpWatcher', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('abre o modal quando o evento global app:level-up é disparado', () => {
    const user = { id: 10, name: 'Aluno Gamer', role: 'aluno' };
    render(<LevelUpWatcher currentUser={user} />);

    expect(screen.queryByTestId('levelup-celebration-card')).not.toBeInTheDocument();

    act(() => {
      triggerLevelUpCelebration({
        level: 5,
        level_title: 'Prata I',
        level_tier: 'Prata',
        level_badge: '⚔️ Prata I',
        tier_color: '#94a3b8'
      });
    });

    expect(screen.getByTestId('levelup-celebration-card')).toBeInTheDocument();
    expect(screen.getByText(/PARABÉNS, ALUNO GAMER!/i)).toBeInTheDocument();
    expect(screen.getByText('⚔️ Prata I')).toBeInTheDocument();
  });

  it('salva no localStorage ao fechar o modal comemorativo', () => {
    const user = { id: 10, name: 'Aluno Gamer', role: 'aluno' };
    render(<LevelUpWatcher currentUser={user} />);

    act(() => {
      triggerLevelUpCelebration({
        level: 5,
        level_title: 'Prata I',
        level_tier: 'Prata',
        level_badge: '⚔️ Prata I',
        tier_color: '#94a3b8'
      });
    });

    fireEvent.click(screen.getByTestId('levelup-continue-btn'));

    expect(screen.queryByTestId('levelup-celebration-card')).not.toBeInTheDocument();
    expect(localStorage.getItem('last_celebrated_level_10')).toBe('5');
  });
});
