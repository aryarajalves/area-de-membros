import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CourseModalTabs, { COURSE_TABS } from './CourseModalTabs';

describe('CourseModalTabs Component', () => {
  it('renders all 5 tabs with labels and icons', () => {
    render(<CourseModalTabs activeTab="info" onTabChange={vi.fn()} isLightBg={false} />);

    expect(screen.getByTestId('course-modal-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('course-tab-info')).toBeInTheDocument();
    expect(screen.getByTestId('course-tab-media')).toBeInTheDocument();
    expect(screen.getByTestId('course-tab-sales')).toBeInTheDocument();
    expect(screen.getByTestId('course-tab-upsell')).toBeInTheDocument();
    expect(screen.getByTestId('course-tab-ai')).toBeInTheDocument();

    expect(screen.getByText('Dados Gerais')).toBeInTheDocument();
    expect(screen.getByText('Capas & Mídia')).toBeInTheDocument();
    expect(screen.getByText('Vendas & Acesso')).toBeInTheDocument();
    expect(screen.getByText('Anúncios & Upsell')).toBeInTheDocument();
    expect(screen.getByText('IA & Assistente')).toBeInTheDocument();
  });

  it('triggers onTabChange with correct tab id when tab button is clicked', () => {
    const onTabChange = vi.fn();
    render(<CourseModalTabs activeTab="info" onTabChange={onTabChange} isLightBg={false} />);

    fireEvent.click(screen.getByTestId('course-tab-media'));
    expect(onTabChange).toHaveBeenCalledWith('media');

    fireEvent.click(screen.getByTestId('course-tab-sales'));
    expect(onTabChange).toHaveBeenCalledWith('sales_access');

    fireEvent.click(screen.getByTestId('course-tab-upsell'));
    expect(onTabChange).toHaveBeenCalledWith('upsell');

    fireEvent.click(screen.getByTestId('course-tab-ai'));
    expect(onTabChange).toHaveBeenCalledWith('ai');
  });

  it('indicates active tab via aria-selected', () => {
    const { rerender } = render(<CourseModalTabs activeTab="media" onTabChange={vi.fn()} />);
    expect(screen.getByTestId('course-tab-media')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('course-tab-info')).toHaveAttribute('aria-selected', 'false');

    rerender(<CourseModalTabs activeTab="sales_access" onTabChange={vi.fn()} />);
    expect(screen.getByTestId('course-tab-sales')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('course-tab-media')).toHaveAttribute('aria-selected', 'false');
  });
});
