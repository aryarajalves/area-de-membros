import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatEmojiPickerPopup from './ChatEmojiPickerPopup';

describe('ChatEmojiPickerPopup Component', () => {
  it('renders emoji picker with header, close button, and category tabs', () => {
    const handleSelectEmoji = vi.fn();
    const handleClose = vi.fn();

    render(
      <ChatEmojiPickerPopup
        onSelectEmoji={handleSelectEmoji}
        onClose={handleClose}
      />
    );

    expect(screen.getByTestId('chat-emoji-picker-popup')).toBeInTheDocument();
    expect(screen.getByText('Escolher Emoji')).toBeInTheDocument();
    expect(screen.getByTestId('close-emoji-picker-btn')).toBeInTheDocument();

    // Valida que as abas de categorias estão renderizadas
    expect(screen.getByTestId('emoji-category-tab-smileys')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-category-tab-gestures')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-category-tab-hearts')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-category-tab-work_objects')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-category-tab-celebration')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-category-tab-symbols')).toBeInTheDocument();
  });

  it('switches categories and displays corresponding emojis', () => {
    render(
      <ChatEmojiPickerPopup
        onSelectEmoji={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // Na categoria inicial (smileys), emoji '😀' deve estar visível
    expect(screen.getByTestId('emoji-btn-😀')).toBeInTheDocument();

    // Troca para categoria 'gestures'
    const gesturesTab = screen.getByTestId('emoji-category-tab-gestures');
    fireEvent.click(gesturesTab);

    // Emojis de gestos devem estar visíveis
    expect(screen.getByTestId('emoji-btn-👍')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-btn-👏')).toBeInTheDocument();

    // Troca para categoria 'hearts'
    const heartsTab = screen.getByTestId('emoji-category-tab-hearts');
    fireEvent.click(heartsTab);
    expect(screen.getByTestId('emoji-btn-❤️')).toBeInTheDocument();
    expect(screen.queryByTestId('emoji-btn-🔥')).not.toBeInTheDocument();

    // Troca para 'celebration'
    const celebrationTab = screen.getByTestId('emoji-category-tab-celebration');
    fireEvent.click(celebrationTab);
    expect(screen.getByTestId('emoji-btn-🎉')).toBeInTheDocument();
    expect(screen.getByTestId('emoji-btn-🏆')).toBeInTheDocument();
  });

  it('triggers onSelectEmoji and onClose when an emoji is clicked', () => {
    const handleSelectEmoji = vi.fn();
    const handleClose = vi.fn();

    render(
      <ChatEmojiPickerPopup
        onSelectEmoji={handleSelectEmoji}
        onClose={handleClose}
      />
    );

    // Clica no emoji 😂 presente na categoria inicial (smileys)
    const smileyEmoji = screen.getByTestId('emoji-btn-😂');
    fireEvent.click(smileyEmoji);

    expect(handleSelectEmoji).toHaveBeenCalledWith('😂');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();

    render(
      <ChatEmojiPickerPopup
        onSelectEmoji={vi.fn()}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByTestId('close-emoji-picker-btn');
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('ensures strict layout containment with box-sizing to prevent emojis leaking outside', () => {
    const { container } = render(
      <ChatEmojiPickerPopup
        onSelectEmoji={vi.fn()}
        onClose={vi.fn()}
      />
    );

    const popup = container.querySelector('[data-testid="chat-emoji-picker-popup"]');
    expect(popup).toHaveStyle({
      boxSizing: 'border-box',
      overflow: 'hidden',
    });
  });
});
