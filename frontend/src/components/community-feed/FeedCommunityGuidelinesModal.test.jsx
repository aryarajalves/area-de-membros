import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedCommunityGuidelinesModal from './FeedCommunityGuidelinesModal';

describe('FeedCommunityGuidelinesModal', () => {
  it('não deve renderizar quando isOpen for falso', () => {
    const { container } = render(
      <FeedCommunityGuidelinesModal isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar as diretrizes, itens proibidos e sistema de moderação quando aberto', () => {
    render(<FeedCommunityGuidelinesModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId('feed-guidelines-modal')).toBeInTheDocument();
    expect(screen.getByTestId('feed-guidelines-title')).toHaveTextContent(
      'Diretrizes e Regras da Comunidade'
    );
    expect(screen.getByText('Conduta & Moderação')).toBeInTheDocument();

    // Itens proibidos específicos
    expect(screen.getByTestId('guideline-item-politics')).toHaveTextContent(
      'Política e Polarização Ideológica'
    );
    expect(screen.getByTestId('guideline-item-hate')).toHaveTextContent(
      'Preconceito e Discurso de Ódio'
    );
    expect(screen.getByTestId('guideline-item-harassment')).toHaveTextContent(
      'Xingamentos, Ofensas e Assédio'
    );
    expect(screen.getByTestId('guideline-item-spam')).toHaveTextContent(
      'Spam, Pirataria e Vendas Não Autorizadas'
    );
    expect(screen.getByTestId('guideline-item-sensitive')).toHaveTextContent(
      'Conteúdo Explícito ou Sensível'
    );

    // Sistema de moderação
    expect(screen.getByTestId('feed-guidelines-mod-card')).toHaveTextContent(
      'Sistema Ativo de Moderação e Consequências'
    );
    expect(screen.getByText(/Denúncias da Comunidade/i)).toBeInTheDocument();
    expect(screen.getByText(/Suspensão ou Banimento/i)).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar no botão X de fechar', () => {
    const handleClose = vi.fn();
    render(<FeedCommunityGuidelinesModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByTestId('feed-guidelines-close-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onClose ao clicar no botão "Entendi e Concordo com as Regras"', () => {
    const handleClose = vi.fn();
    render(<FeedCommunityGuidelinesModal isOpen={true} onClose={handleClose} />);

    const confirmBtn = screen.getByTestId('feed-guidelines-confirm-btn');
    fireEvent.click(confirmBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
