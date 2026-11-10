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
});
