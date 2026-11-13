import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StudentEngagementCard, { getEngagementTierFromPercent } from './StudentEngagementCard';

describe('StudentEngagementCard', () => {
  it('classifies progress percentages into Baixo (0-35%), Médio (36-70%) and Alto (71-100%)', () => {
    expect(getEngagementTierFromPercent(0)).toBe('low');
    expect(getEngagementTierFromPercent(35)).toBe('low');
    expect(getEngagementTierFromPercent(36)).toBe('medium');
    expect(getEngagementTierFromPercent(70)).toBe('medium');
    expect(getEngagementTierFromPercent(71)).toBe('high');
    expect(getEngagementTierFromPercent(100)).toBe('high');
  });

  it('renders engagement label, course context and toggles quick engagement chips', () => {
    const onSelectEngagement = vi.fn();

    const { rerender } = render(
      <StudentEngagementCard
        avgProgress={52}
        selectedCourseTitle=""
        engagementLevel=""
        onSelectEngagement={onSelectEngagement}
        cardBg="rgba(255,255,255,0.04)"
        cardBorder="1px solid rgba(255,255,255,0.1)"
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        isLightBg={false}
      />
    );

    expect(screen.getByTestId('student-engagement-label')).toHaveTextContent('Médio');
    expect(screen.getByText('média dos usuários (52%)')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('engagement-chip-high'));
    expect(onSelectEngagement).toHaveBeenCalledWith('high');

    rerender(
      <StudentEngagementCard
        avgProgress={80}
        selectedCourseTitle="AstraOwake"
        engagementLevel="high"
        onSelectEngagement={onSelectEngagement}
        cardBg="rgba(255,255,255,0.04)"
        cardBorder="1px solid rgba(255,255,255,0.1)"
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        isLightBg={false}
      />
    );

    expect(screen.getByTestId('student-engagement-label')).toHaveTextContent('Alto');
    expect(screen.getByText('média em AstraOwake (80%)')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('engagement-chip-high'));
    expect(onSelectEngagement).toHaveBeenCalledWith('');
  });
});
