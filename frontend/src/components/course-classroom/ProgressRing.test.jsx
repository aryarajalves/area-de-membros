import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProgressRing from './ProgressRing';

describe('ProgressRing Component', () => {
  it('renders SVG circular ring with track circle and clamped progress', () => {
    const { container } = render(<ProgressRing percent={50} size={30} strokeWidth={3} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '30');
    expect(svg).toHaveAttribute('height', '30');

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2); // Track e Barra de Progresso
  });

  it('renders only track circle when percent is 0', () => {
    const { container } = render(<ProgressRing percent={0} size={24} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(1);
  });

  it('uses green color when progress is 100%', () => {
    const { container } = render(<ProgressRing percent={100} size={24} />);
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(2);
    expect(circles[1]).toHaveAttribute('stroke', '#22c55e');
  });
});
