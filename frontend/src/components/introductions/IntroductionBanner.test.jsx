import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IntroductionBanner from './IntroductionBanner';

describe('IntroductionBanner Component', () => {
  it('renderiza o banner com título, subtítulo aprimorado sobre conexões e o que você faz', () => {
    render(<IntroductionBanner onOpenCreateModal={vi.fn()} />);

    expect(screen.getByTestId('introductions-banner')).toBeInTheDocument();
    expect(screen.getByText('Boas-vindas')).toBeInTheDocument();
    expect(screen.getByText('Apresente-se')).toBeInTheDocument();

    // Valida o novo subtítulo com foco em networking e o que o membro faz
    expect(
      screen.getByText(
        /Dizer quem você é e o que você faz é a melhor forma de gerar novas conexões/i
      )
    ).toBeInTheDocument();

    // Valida os tópicos da checklist
    expect(screen.getByText('Conte quem você é')).toBeInTheDocument();
    expect(screen.getByText('Mostre o que você faz')).toBeInTheDocument();
    expect(screen.getByText('Gere novas conexões e parcerias')).toBeInTheDocument();
    expect(screen.getByText('Interaja com outros membros')).toBeInTheDocument();
  });

  it('aciona onOpenCreateModal ao clicar no botão "Quero me apresentar"', () => {
    const onOpenCreateModal = vi.fn();
    render(<IntroductionBanner onOpenCreateModal={onOpenCreateModal} />);

    const ctaBtn = screen.getByTestId('banner-open-create-btn');
    expect(ctaBtn).toBeInTheDocument();
    fireEvent.click(ctaBtn);

    expect(onOpenCreateModal).toHaveBeenCalledTimes(1);
  });
});
