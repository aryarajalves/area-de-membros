import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GamificationRpgLadderModal from './GamificationRpgLadderModal';

describe('GamificationRpgLadderModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(<GamificationRpgLadderModal isOpen={false} onClose={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all 5 tiers and highlights current level', () => {
    const handleClose = vi.fn();
    render(<GamificationRpgLadderModal isOpen={true} onClose={handleClose} currentPoints={25} />);

    expect(screen.getByText(/Escada de Níveis RPG/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ELO BRONZE/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/ELO PRATA/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/ELO OURO/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/ELO DIAMANTE/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/ELO LENDA/i)[0]).toBeInTheDocument();

    // Mariana com 25 pts: Nível 2 destacado como ATUAL
    expect(screen.getByText('ATUAL')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('close-rpg-ladder-modal-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
