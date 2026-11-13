import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatDmReactionBadges from './ChatDmReactionBadges';

describe('ChatDmReactionBadges', () => {
  it('não renderiza nada se reactions estiver vazio', () => {
    const { container } = render(
      <ChatDmReactionBadges messageId={10} reactions={[]} onToggleReaction={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza badges com emojis e contadores e chama onToggleReaction ao clicar', () => {
    const handleToggle = vi.fn();
    const reactions = [
      { emoji: '❤️', count: 2, reacted_by_me: true, users: ['Alice', 'Bob'] },
      { emoji: '👍', count: 1, reacted_by_me: false, users: ['Charlie'] },
    ];

    render(
      <ChatDmReactionBadges
        messageId={10}
        reactions={reactions}
        onToggleReaction={handleToggle}
      />
    );

    const heartBadge = screen.getByTestId('dm-reaction-badge-❤️-10');
    expect(heartBadge).toBeInTheDocument();
    expect(heartBadge).toHaveTextContent('❤️');
    expect(heartBadge).toHaveTextContent('2');

    const thumbBadge = screen.getByTestId('dm-reaction-badge-👍-10');
    expect(thumbBadge).toBeInTheDocument();

    fireEvent.click(heartBadge);
    expect(handleToggle).toHaveBeenCalledWith(10, '❤️');
  });
});
