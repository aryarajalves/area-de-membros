import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SupportStatsCards from './SupportStatsCards';

describe('SupportStatsCards Component', () => {
  it('does not render when stats is null', () => {
    const { container } = render(<SupportStatsCards stats={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders formatted stats values when loaded', () => {
    const mockStats = {
      total_topics: 42,
      unanswered_count: 7,
      resolution_rate_pct: 83,
      active_members_count: 18,
    };

    render(<SupportStatsCards stats={mockStats} />);

    expect(screen.getByText('Total de Dúvidas')).toBeInTheDocument();
    expect(screen.getByText('Aguardando Resposta')).toBeInTheDocument();
    expect(screen.getByText('Taxa de Resolução')).toBeInTheDocument();
    expect(screen.getByText('Membros Ativos')).toBeInTheDocument();

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('83%')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
  });
});
