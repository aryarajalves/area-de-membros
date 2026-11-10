import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import IntroductionMatchmaking from './IntroductionMatchmaking';

describe('IntroductionMatchmaking Component', () => {
  it('não renderiza nada se tudo estiver vazio', () => {
    const { container } = render(<IntroductionMatchmaking />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza tags de nicho e localização', () => {
    render(
      <IntroductionMatchmaking
        niche="Design UI/UX"
        location="Florianópolis - SC"
      />
    );

    expect(screen.getByTestId('intro-tag-niche')).toHaveTextContent('Design UI/UX');
    expect(screen.getByTestId('intro-tag-location')).toHaveTextContent('Florianópolis - SC');
  });

  it('renderiza blocos de "O que busco" e "Como posso ajudar"', () => {
    render(
      <IntroductionMatchmaking
        seeking="Busco clientes para redesign de aplicativos"
        offering="Posso ajudar com prototipagem no Figma e Design System"
      />
    );

    expect(screen.getByTestId('intro-card-seeking')).toHaveTextContent('Busco clientes para redesign de aplicativos');
    expect(screen.getByTestId('intro-card-offering')).toHaveTextContent('Posso ajudar com prototipagem no Figma e Design System');
  });
});
