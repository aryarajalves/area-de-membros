import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SupportFilterPills from './SupportFilterPills';

describe('SupportFilterPills Component', () => {
  it('renders all pill options with appropriate labels', () => {
    render(
      <SupportFilterPills
        activeFilter="all"
        onSelectFilter={vi.fn()}
      />
    );

    expect(screen.getByTestId('support-pill-all')).toHaveTextContent('Todas as Dúvidas');
    expect(screen.getByTestId('support-pill-pinned')).toHaveTextContent('Fixadas por Mim');
    expect(screen.getByTestId('support-pill-popular')).toHaveTextContent('Mais Populares');
    expect(screen.getByTestId('support-pill-unanswered')).toHaveTextContent('Aguardando Resposta');
    expect(screen.getByTestId('support-pill-resolved')).toHaveTextContent('Resolvidas');
    expect(screen.getByTestId('support-pill-my_topics')).toHaveTextContent('Minhas Dúvidas');
  });

  it('calls onSelectFilter when a pill is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <SupportFilterPills
        activeFilter="all"
        onSelectFilter={handleSelect}
      />
    );

    const pinnedPill = screen.getByTestId('support-pill-pinned');
    fireEvent.click(pinnedPill);
    expect(handleSelect).toHaveBeenCalledWith('pinned');

    const resolvedPill = screen.getByTestId('support-pill-resolved');
    fireEvent.click(resolvedPill);
    expect(handleSelect).toHaveBeenCalledWith('resolved');
  });
});
