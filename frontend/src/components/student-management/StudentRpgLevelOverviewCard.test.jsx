import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StudentRpgLevelOverviewCard from './StudentRpgLevelOverviewCard';

describe('StudentRpgLevelOverviewCard Component', () => {
  it('renders level 2 overview with XP progress and ladder button', () => {
    const handleOpenLadder = vi.fn();
    render(<StudentRpgLevelOverviewCard totalPoints={25} onOpenLadder={handleOpenLadder} />);

    expect(screen.getByText(/ELO BRONZE/i)).toBeInTheDocument();
    expect(screen.getByText(/Nível 2 • Bronze II/i)).toBeInTheDocument();
    expect(screen.getByText(/Faltam/i)).toBeInTheDocument();
    expect(screen.getByText(/35 pts/i)).toBeInTheDocument();

    const ladderBtn = screen.getByTestId('open-rpg-ladder-btn');
    fireEvent.click(ladderBtn);
    expect(handleOpenLadder).toHaveBeenCalledTimes(1);
  });

  it('renders max level indicator for 5000+ points', () => {
    render(<StudentRpgLevelOverviewCard totalPoints={5000} />);
    expect(screen.getByText(/ELO LENDA/i)).toBeInTheDocument();
    expect(screen.getByText(/Nível 20 • Lenda Suprema/i)).toBeInTheDocument();
    expect(screen.getByText(/Nível Máximo Atingido/i)).toBeInTheDocument();
  });
});
