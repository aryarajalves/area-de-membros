import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TutorFinancialMetricsCards from './TutorFinancialMetricsCards';

describe('TutorFinancialMetricsCards Component', () => {
  const mockSummary = {
    total_spent_brl: 1.2543,
    total_spent_this_month_brl: 0.8421,
    total_questions: 150,
    avg_cost_per_question: 0.0083,
    top_spenders: [
      { student_id: 1, student_name: 'Arya Stark', student_email: 'arya@winterfell.com', total_cost_brl: 0.54, total_messages: 40 },
      { student_id: 2, student_name: 'Jon Snow', student_email: 'jon@wall.com', total_cost_brl: 0.32, total_messages: 25 }
    ]
  };

  it('renders all 4 financial metric cards with correct values', () => {
    render(<TutorFinancialMetricsCards financialSummary={mockSummary} />);

    expect(screen.getByTestId('card-financial-total')).toBeInTheDocument();
    expect(screen.getByText(/1,2543/)).toBeInTheDocument();

    expect(screen.getByTestId('card-financial-month')).toBeInTheDocument();
    expect(screen.getByText(/0,8421/)).toBeInTheDocument();

    expect(screen.getByTestId('card-financial-questions')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();

    expect(screen.getByTestId('card-financial-avg')).toBeInTheDocument();
    expect(screen.getByText(/0,0083/)).toBeInTheDocument();
  });

  it('renders top spenders ranking when list is provided', () => {
    render(<TutorFinancialMetricsCards financialSummary={mockSummary} />);

    expect(screen.getByTestId('tutor-top-spenders-box')).toBeInTheDocument();
    expect(screen.getByText('Arya Stark')).toBeInTheDocument();
    expect(screen.getByText('arya@winterfell.com')).toBeInTheDocument();
    expect(screen.getByText('Jon Snow')).toBeInTheDocument();
  });
});
