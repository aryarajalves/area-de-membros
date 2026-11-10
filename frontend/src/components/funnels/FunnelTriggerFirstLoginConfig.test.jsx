import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FunnelTriggerFirstLoginConfig from './FunnelTriggerFirstLoginConfig';

describe('FunnelTriggerFirstLoginConfig Component', () => {
  it('renderiza o card de resumo do 1º login com texto explicativo e garantia anti-duplicação', () => {
    render(
      <FunnelTriggerFirstLoginConfig
        nodeId="node_login_1"
        data={{ trigger_event: 'first_login' }}
      />
    );

    expect(screen.getByTestId('first-login-trigger-summary-node_login_1')).toBeInTheDocument();
    expect(screen.getByText('Boas-Vindas no 1º Acesso (Onboarding)')).toBeInTheDocument();
    expect(screen.getByText(/primeiríssimo login \(1º acesso\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Gatilho com execução única por aluno/i)).toBeInTheDocument();
  });
});
