import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ClosedPeriodSelector from './ClosedPeriodSelector';

describe('ClosedPeriodSelector Component', () => {
  const mockCompletedPeriods = {
    completed_months: [
      { key: '2026-09', label: 'Setembro/2026' },
      { key: '2026-08', label: 'Agosto/2026' }
    ],
    completed_years: [
      { key: '2025', label: 'Ano de 2025' }
    ]
  };

  it('renders correctly with options for months', () => {
    const handleKeyChange = vi.fn();

    render(
      <ClosedPeriodSelector
        periodMode="closed_month"
        completedPeriods={mockCompletedPeriods}
        selectedKey="2026-09"
        onChangeKey={handleKeyChange}
        periodLabel="Setembro/2026"
      />
    );

    expect(screen.getByTestId('closed-period-selector-banner')).toBeInTheDocument();
    expect(screen.getByText(/Top 10 Finalizado • Setembro\/2026/i)).toBeInTheDocument();
    expect(screen.getByText('Encerrado')).toBeInTheDocument();
    expect(screen.getByText(/Exibindo a classificação final congelada dos 10 melhores alunos do mês selecionado/i)).toBeInTheDocument();
    expect(screen.getByText('Setembro/2026')).toBeInTheDocument();
    expect(screen.getByText('Agosto/2026')).toBeInTheDocument();

    const select = screen.getByTestId('closed-period-select');
    fireEvent.change(select, { target: { value: '2026-08' } });

    expect(handleKeyChange).toHaveBeenCalledWith('2026-08');
  });

  it('renders correctly for years and shows empty state when no options are provided', () => {
    const handleKeyChange = vi.fn();

    render(
      <ClosedPeriodSelector
        periodMode="closed_year"
        completedPeriods={{ completed_months: [], completed_years: [] }}
        selectedKey=""
        onChangeKey={handleKeyChange}
        periodLabel=""
      />
    );

    expect(screen.getByTestId('closed-period-selector-banner')).toBeInTheDocument();
    expect(screen.getByText(/Top 10 Finalizado • Ano Anterior/i)).toBeInTheDocument();
    expect(screen.getByText('Nenhum período encerrado')).toBeInTheDocument();
  });
});
