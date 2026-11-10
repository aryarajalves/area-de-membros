import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ZodiacBadge from './ZodiacBadge';

describe('ZodiacBadge Component', () => {
  it('não renderiza nada se não houver data de nascimento nem signKey', () => {
    const { container } = render(<ZodiacBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza símbolo e nome a partir de birthDate', () => {
    render(<ZodiacBadge birthDate="1995-10-24" />);

    const badge = screen.getByTestId('zodiac-badge');
    expect(badge).toBeInTheDocument();
    expect(screen.getByText('♏')).toBeInTheDocument();
    expect(screen.getByText('Escorpião')).toBeInTheDocument();
    expect(badge).toHaveAttribute('title', expect.stringContaining('Escorpião (Água)'));
  });

  it('renderiza corretamente a partir de signKey', () => {
    render(<ZodiacBadge signKey="aries" />);

    expect(screen.getByText('♈')).toBeInTheDocument();
    expect(screen.getByText('Áries')).toBeInTheDocument();
  });
});
