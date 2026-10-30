import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LevelUpCelebrationModal from './LevelUpCelebrationModal';

describe('LevelUpCelebrationModal', () => {
  const mockLevelData = {
    level: 9,
    level_title: 'Ouro I',
    level_tier: 'Ouro',
    level_badge: '👑 Ouro I',
    tier_color: '#f59e0b',
    description: 'Consagração no Elo Ouro da comunidade!'
  };

  it('não renderiza se isOpen for falso', () => {
    const { container } = render(
      <LevelUpCelebrationModal
        isOpen={false}
        levelData={mockLevelData}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o modal com confetes, emblema e dados do novo Elo', () => {
    render(
      <LevelUpCelebrationModal
        isOpen={true}
        levelData={mockLevelData}
        studentName="Aryaraj"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('levelup-celebration-card')).toBeInTheDocument();
    expect(screen.getByText(/PARABÉNS, ARYARAJ!/i)).toBeInTheDocument();
    expect(screen.getByTestId('levelup-emblem')).toBeInTheDocument();
    expect(screen.getByTestId('levelup-badge-display')).toHaveTextContent('👑 Ouro I');
    expect(screen.getByText(/Consagração no Elo Ouro/i)).toBeInTheDocument();
  });

  it('dispara onClose ao clicar no botão de continuar', () => {
    const onClose = vi.fn();
    render(
      <LevelUpCelebrationModal
        isOpen={true}
        levelData={mockLevelData}
        studentName="Aryaraj"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByTestId('levelup-continue-btn'));
    expect(onClose).toHaveBeenCalled();
  });
});
