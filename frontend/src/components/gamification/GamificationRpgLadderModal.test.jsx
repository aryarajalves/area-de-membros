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

    // Com 25 pts: Nível 2 destacado como ATUAL
    expect(screen.getByText('ATUAL')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('close-rpg-ladder-modal-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('configures scrollable content container with flex and minHeight to prevent card clipping', () => {
    render(<GamificationRpgLadderModal isOpen={true} onClose={() => {}} currentPoints={0} />);

    const scrollContainer = screen.getByTestId('rpg-ladder-scroll-content');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer.style.overflowY).toBe('auto');
    expect(scrollContainer.style.minHeight).toBe('0px');

    // Nível 1 e Nível 20 estão presentes
    expect(screen.getByTestId('rpg-ladder-level-1')).toBeInTheDocument();
    expect(screen.getByTestId('rpg-ladder-level-20')).toBeInTheDocument();
  });
});
