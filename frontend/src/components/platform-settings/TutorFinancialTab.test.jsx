import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TutorFinancialTab from './TutorFinancialTab';

describe('TutorFinancialTab Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('renders financial metrics cards, profitability projections and top spenders', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        financial_summary: {
          total_spent_brl: 4.8521,
          total_spent_this_month_brl: 1.2500,
          total_questions: 280,
          avg_cost_per_question: 0.0173,
          active_subscribers: 5,
          monthly_price_brl: 10.0,
          estimated_monthly_revenue: 50.0,
          estimated_monthly_profit: 48.75,
          top_spenders: [
            { student_id: 1, student_name: 'Hermione Granger', student_email: 'hermione@hogwarts.com', total_cost_brl: 2.15, total_messages: 120 }
          ]
        }
      })
    });

    render(<TutorFinancialTab />);

    expect(await screen.findByText('Painel Financeiro & Custos de API')).toBeInTheDocument();
    expect(screen.getByText(/4,8521/)).toBeInTheDocument();
    expect(screen.getByText(/1,2500/)).toBeInTheDocument();
    expect(screen.getByText('280')).toBeInTheDocument();
    expect(screen.getByText(/0,0173/)).toBeInTheDocument();

    // Lucratividade
    expect(screen.getByText(/5 alunos/)).toBeInTheDocument();
    expect(screen.getByText(/50,00/)).toBeInTheDocument();
    expect(screen.getByText(/48,75/)).toBeInTheDocument();

    // Top spenders
    expect(screen.getByText('Hermione Granger')).toBeInTheDocument();
    expect(screen.getByText('hermione@hogwarts.com')).toBeInTheDocument();
  });

  it('allows clicking refresh button to reload financial metrics', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ financial_summary: { total_spent_brl: 0, total_spent_this_month_brl: 0, total_questions: 0, avg_cost_per_question: 0, top_spenders: [] } })
    });

    render(<TutorFinancialTab />);

    const refreshBtn = await screen.findByTestId('btn-refresh-financial');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
