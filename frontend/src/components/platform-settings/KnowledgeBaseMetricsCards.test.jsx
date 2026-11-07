import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import KnowledgeBaseMetricsCards from './KnowledgeBaseMetricsCards';

describe('KnowledgeBaseMetricsCards Component', () => {
  it('renders all 4 metrics cards with values', () => {
    const metrics = {
      total_lessons: 50,
      total_transcriptions: 40,
      indexed_lessons: 30,
      total_chunks: 350
    };

    render(<KnowledgeBaseMetricsCards metrics={metrics} />);

    expect(screen.getByTestId('kb-metrics-cards')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('40')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();
  });
});
