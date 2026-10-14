import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SupportFilterPills, { PILL_FILTERS } from './SupportFilterPills';

describe('SupportFilterPills Component', () => {
  it('renders all pill options with appropriate labels and flexShrink 0', () => {
    render(
      <SupportFilterPills
        activeFilter="all"
        onSelectFilter={vi.fn()}
      />
    );

    PILL_FILTERS.forEach((pill) => {
      const btn = screen.getByTestId(`support-pill-${pill.id}`);
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent(pill.label);
      expect(btn).toHaveStyle({ flexShrink: '0', whiteSpace: 'nowrap' });
    });
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

  it('configures scroll container with touchAction pan-x and overflowX auto for smooth mobile swiping', () => {
    render(
      <SupportFilterPills
        activeFilter="all"
        onSelectFilter={vi.fn()}
      />
    );

    const scrollContainer = screen.getByTestId('support-filter-pills');
    expect(scrollContainer).toBeInTheDocument();
    expect(scrollContainer).toHaveStyle({
      overflowX: 'auto',
      touchAction: 'pan-x',
    });
  });

  it('handles mouse drag without triggering accidental pill selection when dragged', () => {
    const handleSelect = vi.fn();
    render(
      <SupportFilterPills
        activeFilter="all"
        onSelectFilter={handleSelect}
      />
    );

    const scrollContainer = screen.getByTestId('support-filter-pills');
    const popularPill = screen.getByTestId('support-pill-popular');

    // Inicia arrasto com clientX
    fireEvent.mouseDown(scrollContainer, { clientX: 200, pageX: 200 });
    // Move 50px (arrasto deliberado)
    fireEvent.mouseMove(scrollContainer, { clientX: 250, pageX: 250 });
    // Clica no botão enquanto arrastava
    fireEvent.click(popularPill);

    // Não deve chamar onSelectFilter pois foi interpretado como scroll/arrasto
    expect(handleSelect).not.toHaveBeenCalled();

    // Finaliza arrasto
    fireEvent.mouseUp(scrollContainer);
  });

  it('scrolls container when mouse wheel event is fired', () => {
    render(
      <SupportFilterPills
        activeFilter="all"
        onSelectFilter={vi.fn()}
      />
    );

    const scrollContainer = screen.getByTestId('support-filter-pills');
    scrollContainer.scrollLeft = 0;

    fireEvent.wheel(scrollContainer, { deltaY: 100 });
    expect(scrollContainer.scrollLeft).toBe(100);
  });

  it('renders scroll buttons and triggers scrollBy when container has overflow', () => {
    const { container } = render(
      <SupportFilterPills
        activeFilter="all"
        onSelectFilter={vi.fn()}
      />
    );

    const scrollContainer = screen.getByTestId('support-filter-pills');
    scrollContainer.scrollBy = vi.fn();

    // Simula overflow à direita (scrollWidth: 800, clientWidth: 300, scrollLeft: 0)
    Object.defineProperty(scrollContainer, 'scrollWidth', { configurable: true, value: 800 });
    Object.defineProperty(scrollContainer, 'clientWidth', { configurable: true, value: 300 });
    Object.defineProperty(scrollContainer, 'scrollLeft', { configurable: true, writable: true, value: 0 });

    fireEvent(window, new Event('resize'));

    // Seta da direita deve surgir
    const rightBtn = screen.getByTestId('support-scroll-right-btn');
    expect(rightBtn).toBeInTheDocument();
    fireEvent.click(rightBtn);
    expect(scrollContainer.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: 220 }));

    // Simula scroll no meio (scrollLeft: 100) -> ambas as setas devem estar visíveis
    scrollContainer.scrollLeft = 100;
    fireEvent(window, new Event('resize'));

    const leftBtn = screen.getByTestId('support-scroll-left-btn');
    expect(leftBtn).toBeInTheDocument();
    fireEvent.click(leftBtn);
    expect(scrollContainer.scrollBy).toHaveBeenCalledWith(expect.objectContaining({ left: -220 }));
  });
});
