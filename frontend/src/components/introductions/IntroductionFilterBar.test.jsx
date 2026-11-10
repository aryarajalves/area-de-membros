import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IntroductionFilterBar from './IntroductionFilterBar';

describe('IntroductionFilterBar Component', () => {
  it('renderiza contagem, input de busca e botão de novo post', () => {
    const onSearchChange = vi.fn();
    const onOpenCreateModal = vi.fn();

    render(
      <IntroductionFilterBar
        searchTerm=""
        onSearchChange={onSearchChange}
        selectedNiche=""
        onNicheChange={() => {}}
        availableNiches={['Marketing', 'Design']}
        totalCount={12}
        onOpenCreateModal={onOpenCreateModal}
      />
    );

    expect(screen.getByTestId('intro-posts-count-badge')).toHaveTextContent('12 apresentações');
    expect(screen.getByTestId('intro-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('intro-niche-select')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('intro-search-input'), { target: { value: 'marketing' } });
    expect(onSearchChange).toHaveBeenCalledWith('marketing');

    fireEvent.click(screen.getByTestId('intro-new-post-btn'));
    expect(onOpenCreateModal).toHaveBeenCalledTimes(1);
  });
});
