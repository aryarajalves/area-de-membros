import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StudentRpgLevelBadge from './StudentRpgLevelBadge';

describe('StudentRpgLevelBadge Component', () => {
  it('renders level 1 (Bronze I) for 0 points', () => {
    render(<StudentRpgLevelBadge totalPoints={0} studentId={101} />);
    expect(screen.getByText(/Nv. 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Bronze I/i)).toBeInTheDocument();
  });

  it('renders level 2 (Bronze II) for 120 points (case 4 aulas concluidas)', () => {
    const handleClick = vi.fn();
    render(<StudentRpgLevelBadge totalPoints={120} studentId={102} onClick={handleClick} />);

    expect(screen.getByText(/Nv. 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Bronze II/i)).toBeInTheDocument();

    const badge = screen.getByTestId('student-rpg-badge-102');
    fireEvent.click(badge);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders level 20 (Lenda Suprema) MAX for 40000+ points', () => {
    render(<StudentRpgLevelBadge totalPoints={42000} studentId={103} />);
    expect(screen.getByText(/Nv. 20/i)).toBeInTheDocument();
    expect(screen.getByText(/Lenda Suprema/i)).toBeInTheDocument();
    expect(screen.getByText(/MAX/i)).toBeInTheDocument();
  });

  it('renders compact mode with badge text', () => {
    render(<StudentRpgLevelBadge totalPoints={850} studentId={104} compact />);
    expect(screen.getByTestId('student-rpg-badge-compact-104')).toBeInTheDocument();
    expect(screen.getByText(/Prata I/i)).toBeInTheDocument();
  });
});
