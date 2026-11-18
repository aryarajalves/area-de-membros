import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import IntroductionReactionsBar, { ReactionPillSummary, REACTION_DEFINITIONS } from './IntroductionReactionsBar';

describe('IntroductionReactionsBar Component', () => {
  it('renderiza o botão padrão de curtir quando não há reação', () => {
    const onToggleReaction = vi.fn();
    render(<IntroductionReactionsBar onToggleReaction={onToggleReaction} />);

    expect(screen.getByText('Curtir')).toBeInTheDocument();
  });

  it('exibe a reação ativa quando o usuário já reagiu', () => {
    render(<IntroductionReactionsBar isLiked={true} myReaction="love" onToggleReaction={vi.fn()} />);

    expect(screen.getByText('Amei')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
  });

  it('abre o dock flutuante de reações ao passar o mouse e permite selecionar uma reação', async () => {
    vi.useFakeTimers();
    const onToggleReaction = vi.fn();

    render(<IntroductionReactionsBar onToggleReaction={onToggleReaction} />);

    const container = screen.getByTestId('reaction-main-trigger-btn').parentElement;
    fireEvent.mouseEnter(container);

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByTestId('linkedin-reactions-dock')).toBeInTheDocument();
    expect(screen.getByTestId('dock-reaction-celebrate')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('dock-reaction-celebrate'));
    expect(onToggleReaction).toHaveBeenCalledWith('celebrate');

    vi.useRealTimers();
  });

  it('ReactionPillSummary renderiza a pilha de emojis e a contagem', () => {
    render(<ReactionPillSummary likesCount={8} reactionsSummary={['love', 'fire', 'rocket']} />);

    expect(screen.getByTestId('reaction-pill-summary')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();
    expect(screen.getByText('🚀')).toBeInTheDocument();
  });

  it('alinha o dock à direita quando o botão está próximo da borda direita da tela', async () => {
    vi.useFakeTimers();
    const originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1000 });

    render(<IntroductionReactionsBar onToggleReaction={vi.fn()} />);
    const wrapper = screen.getByTestId('reaction-main-trigger-btn').parentElement;
    wrapper.getBoundingClientRect = () => ({ left: 820, right: 900, top: 200, bottom: 230, width: 80, height: 30 });

    fireEvent.mouseEnter(wrapper);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });

    const dock = screen.getByTestId('linkedin-reactions-dock');
    expect(dock).toHaveClass('dock-align-right');

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalInnerWidth });
    vi.useRealTimers();
  });

  it('abre o modal com a lista de pessoas ao clicar no resumo de reações quando postId é informado', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        post_id: 77,
        total: 1,
        reactions: [{ user_id: 10, name: 'Ana Silva', reaction_type: 'love', role: 'aluno' }],
      }),
    });

    render(<ReactionPillSummary likesCount={1} reactionsSummary={['love']} postId={77} />);
    fireEvent.click(screen.getByTestId('reaction-pill-summary'));

    expect(await screen.findByTestId('introduction-reactions-modal')).toBeInTheDocument();
    expect(await screen.findByText('Ana Silva')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-reactions-modal-btn'));
    expect(screen.queryByTestId('introduction-reactions-modal')).not.toBeInTheDocument();
  });
});
