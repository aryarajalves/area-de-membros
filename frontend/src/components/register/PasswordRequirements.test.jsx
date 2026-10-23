import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PasswordRequirements from './PasswordRequirements';

describe('PasswordRequirements Component', () => {
  const rules = [
    { label: 'No mínimo 12 caracteres', valid: true },
    { label: 'Pelo menos 1 letra maiúscula', valid: false },
    { label: 'Pelo menos 1 número', valid: true },
  ];

  it('renders requirements title and rules list with correct met/unmet classes', () => {
    render(<PasswordRequirements rules={rules} />);

    expect(screen.getByTestId('password-requirements')).toBeInTheDocument();
    expect(screen.getByText('Requisitos da senha:')).toBeInTheDocument();

    const metItem = screen.getByText('No mínimo 12 caracteres').closest('li');
    expect(metItem).toHaveClass('rule-met');

    const unmetItem = screen.getByText('Pelo menos 1 letra maiúscula').closest('li');
    expect(unmetItem).toHaveClass('rule-unmet');
  });
});
