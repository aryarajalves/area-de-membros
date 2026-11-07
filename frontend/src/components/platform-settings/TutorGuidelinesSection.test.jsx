import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TutorGuidelinesSection from './TutorGuidelinesSection';

describe('TutorGuidelinesSection Component', () => {
  it('renderiza os campos de tópicos permitidos, proibidos e aplicativo de redirecionamento', () => {
    render(
      <TutorGuidelinesSection
        allowedTopics="Explicar conceitos"
        onChangeAllowedTopics={vi.fn()}
        prohibitedTopics="Proibido interpretar trânsitos"
        onChangeProhibitedTopics={vi.fn()}
        redirectAppUrl="https://app.astrologia.com"
        onChangeRedirectAppUrl={vi.fn()}
        redirectAppName="App de Trânsitos"
        onChangeRedirectAppName={vi.fn()}
        prohibitedResponseGuideline=""
        onChangeProhibitedResponseGuideline={vi.fn()}
      />
    );

    expect(screen.getByTestId('tutor-guidelines-section')).toBeInTheDocument();
    expect(screen.getByTestId('textarea-allowed-topics')).toHaveValue('Explicar conceitos');
    expect(screen.getByTestId('textarea-prohibited-topics')).toHaveValue('Proibido interpretar trânsitos');
    expect(screen.getByTestId('input-redirect-app-url')).toHaveValue('https://app.astrologia.com');
    expect(screen.getByTestId('input-redirect-app-name')).toHaveValue('App de Trânsitos');
  });

  it('chama onChangeAllowedTopics e onChangeProhibitedTopics ao alterar textos', () => {
    const handleAllowed = vi.fn();
    const handleProhibited = vi.fn();

    render(
      <TutorGuidelinesSection
        allowedTopics=""
        onChangeAllowedTopics={handleAllowed}
        prohibitedTopics=""
        onChangeProhibitedTopics={handleProhibited}
        redirectAppUrl=""
        onChangeRedirectAppUrl={vi.fn()}
        redirectAppName=""
        onChangeRedirectAppName={vi.fn()}
        prohibitedResponseGuideline=""
        onChangeProhibitedResponseGuideline={vi.fn()}
      />
    );

    fireEvent.change(screen.getByTestId('textarea-allowed-topics'), { target: { value: 'Novos permitidos' } });
    expect(handleAllowed).toHaveBeenCalledWith('Novos permitidos');

    fireEvent.change(screen.getByTestId('textarea-prohibited-topics'), { target: { value: 'Novos proibidos' } });
    expect(handleProhibited).toHaveBeenCalledWith('Novos proibidos');
  });
});
