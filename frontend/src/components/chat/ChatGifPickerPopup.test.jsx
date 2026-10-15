import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatGifPickerPopup from './ChatGifPickerPopup';

describe('ChatGifPickerPopup Component', () => {
  it('renders search input, categories and initial gif items', () => {
    const handleSelectGif = vi.fn();
    const handleClose = vi.fn();

    render(
      <ChatGifPickerPopup onSelectGif={handleSelectGif} onClose={handleClose} />
    );

    expect(screen.getByTestId('chat-gif-popup')).toBeInTheDocument();
    expect(screen.getByTestId('gif-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('gif-cat-all')).toBeInTheDocument();
    expect(screen.getByTestId('gif-cat-applause')).toBeInTheDocument();
  });

  it('filters gifs based on search query', () => {
    render(
      <ChatGifPickerPopup onSelectGif={vi.fn()} onClose={vi.fn()} />
    );

    const searchInput = screen.getByTestId('gif-search-input');
    fireEvent.change(searchInput, { target: { value: 'palmas' } });

    expect(screen.getByTestId('gif-item-gif_applause_1')).toBeInTheDocument();
  });

  it('calls onSelectGif when a gif card is clicked', () => {
    const handleSelectGif = vi.fn();

    render(
      <ChatGifPickerPopup onSelectGif={handleSelectGif} onClose={vi.fn()} />
    );

    const firstGif = screen.getByTestId('gif-item-gif_applause_1');
    fireEvent.click(firstGif);

    expect(handleSelectGif).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'gif_applause_1' })
    );
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();

    render(
      <ChatGifPickerPopup onSelectGif={vi.fn()} onClose={handleClose} />
    );

    const closeBtn = screen.getByTestId('close-gif-popup');
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
