import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedPollWidget from './FeedPollWidget';
import FeedCategoryPills from './FeedCategoryPills';
import FeedReportModal from './FeedReportModal';
import FeedCreatePollModal from './FeedCreatePollModal';

// Mock da API
vi.mock('./communityFeedApi', () => ({
  voteFeedPoll: vi.fn().mockResolvedValue({
    id: 1,
    poll_question: 'Qual sua meta?',
    poll_options: [
      { id: 1, text: 'Opção A', votes: 1, percent: 100 },
      { id: 2, text: 'Opção B', votes: 0, percent: 0 },
    ],
    my_poll_vote: 1,
    total_poll_votes: 1,
  }),
  reportFeedPost: vi.fn().mockResolvedValue({
    id: 1,
    message: 'Denúncia recebida com sucesso.',
  }),
}));

describe('Community Feed V2 - Testes de Componentes', () => {
  describe('FeedPollWidget', () => {
    it('deve renderizar a pergunta e opções para votar quando o usuário ainda não votou', () => {
      const options = [
        { id: 1, text: 'Opção 1', votes: 0, percent: 0 },
        { id: 2, text: 'Opção 2', votes: 0, percent: 0 },
      ];

      render(
        <FeedPollWidget
          postId={10}
          question="Qual a sua principal meta?"
          options={options}
          myVote={null}
          totalVotes={0}
        />
      );

      expect(screen.getByText('Qual a sua principal meta?')).toBeInTheDocument();
      expect(screen.getByText('Opção 1')).toBeInTheDocument();
      expect(screen.getByText('Opção 2')).toBeInTheDocument();
      expect(screen.getByText('0 votos registrados')).toBeInTheDocument();
    });

    it('deve renderizar as barras de resultado e porcentagem quando o usuário já votou', () => {
      const options = [
        { id: 1, text: 'Opção 1', votes: 3, percent: 75 },
        { id: 2, text: 'Opção 2', votes: 1, percent: 25 },
      ];

      render(
        <FeedPollWidget
          postId={10}
          question="Qual a sua principal meta?"
          options={options}
          myVote={1}
          totalVotes={4}
        />
      );

      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
      expect(screen.getByText(/Seu voto/)).toBeInTheDocument();
      expect(screen.getByText('4 votos registrados')).toBeInTheDocument();
    });
  });

  describe('FeedCategoryPills', () => {
    it('deve renderizar as categorias e disparar callback ao clicar', () => {
      const onSelect = vi.fn();
      render(<FeedCategoryPills selectedCategory="todas" onSelectCategory={onSelect} />);

      expect(screen.getByText('Tudo')).toBeInTheDocument();
      expect(screen.getByText('Vitórias')).toBeInTheDocument();
      expect(screen.getByText('Dúvidas')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Vitórias'));
      expect(onSelect).toHaveBeenCalledWith('vitoria');
    });
  });

  describe('FeedReportModal', () => {
    it('deve renderizar o modal com opções de denúncia quando aberto', () => {
      render(
        <FeedReportModal
          isOpen={true}
          onClose={vi.fn()}
          postId={15}
        />
      );

      expect(screen.getByText('Denunciar Publicação')).toBeInTheDocument();
      expect(screen.getByText(/Spam ou autopromoção/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Enviar Denúncia/i })).toBeInTheDocument();
    });
  });

  describe('FeedCreatePollModal', () => {
    it('deve permitir preencher pergunta e opções e salvar', () => {
      const onSave = vi.fn();
      render(
        <FeedCreatePollModal
          isOpen={true}
          onClose={vi.fn()}
          onSavePoll={onSave}
        />
      );

      const questionInput = screen.getByTestId('poll-question-input');
      fireEvent.change(questionInput, { target: { value: 'Qual melhor horário?' } });

      const opt0 = screen.getByTestId('poll-option-input-0');
      const opt1 = screen.getByTestId('poll-option-input-1');
      fireEvent.change(opt0, { target: { value: 'Manhã' } });
      fireEvent.change(opt1, { target: { value: 'Noite' } });

      fireEvent.click(screen.getByTestId('poll-confirm-btn'));

      expect(onSave).toHaveBeenCalledWith({
        question: 'Qual melhor horário?',
        options: ['Manhã', 'Noite'],
      });
    });
  });
});
