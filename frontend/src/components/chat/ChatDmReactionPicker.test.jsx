import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatDmReactionPicker from './ChatDmReactionPicker';

describe('ChatDmReactionPicker', () => {
  it('renderiza o botão de reação com emoji', () => {
    render(<ChatDmReactionPicker messageId={123} onSelectReaction={vi.fn()} />);
    const btn = screen.getByTestId('dm-reaction-btn-123');
    expect(btn).toBeInTheDocument();
  });

  it('abre o menu de emojis rápidos ao clicar e seleciona um emoji', () => {
    const handleSelect = vi.fn();
    render(<ChatDmReactionPicker messageId={123} onSelectReaction={handleSelect} />);
    const btn = screen.getByTestId('dm-reaction-btn-123');
    fireEvent.click(btn);

    const picker = screen.getByTestId('dm-reaction-picker-123');
    expect(picker).toBeInTheDocument();

    const heartBtn = screen.getByTestId('dm-emoji-btn-❤️-123');
    fireEvent.click(heartBtn);

    expect(handleSelect).toHaveBeenCalledWith(123, '❤️');
    expect(screen.queryByTestId('dm-reaction-picker-123')).not.toBeInTheDocument();
  });
});
