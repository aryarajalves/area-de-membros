import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IntroductionSocialLinks from './IntroductionSocialLinks';

describe('IntroductionSocialLinks Component', () => {
  it('não renderiza nada se não houver redes sociais nem botão DM', () => {
    const { container } = render(<IntroductionSocialLinks />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza links de Instagram, LinkedIn e Website e não exibe WhatsApp', () => {
    render(
      <IntroductionSocialLinks
        instagram="@dev.joao"
        linkedin="https://linkedin.com/in/devjoao"
        whatsapp="11988887777"
        website="https://devjoao.com"
        authorName="João"
      />
    );

    const ig = screen.getByTestId('intro-link-instagram');
    expect(ig).toHaveAttribute('href', 'https://instagram.com/dev.joao');

    const li = screen.getByTestId('intro-link-linkedin');
    expect(li).toHaveAttribute('href', 'https://linkedin.com/in/devjoao');

    expect(screen.queryByTestId('intro-link-whatsapp')).not.toBeInTheDocument();

    const web = screen.getByTestId('intro-link-website');
    expect(web).toHaveAttribute('href', 'https://devjoao.com');
  });

  it('renderiza botão "Chamar na DM" se onOpenDm for fornecido e autor não for o usuário logado', () => {
    const onOpenDm = vi.fn();
    render(
      <IntroductionSocialLinks
        authorName="Maria"
        authorId={2}
        currentUserId={1}
        onOpenDm={onOpenDm}
      />
    );

    const dmBtn = screen.getByTestId('intro-link-dm');
    expect(dmBtn).toBeInTheDocument();
    fireEvent.click(dmBtn);
    expect(onOpenDm).toHaveBeenCalledWith(2, 'Maria');
  });
});
