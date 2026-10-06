import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatHeader from './ChatHeader';

describe('ChatHeader Component', () => {
  const mockChannel = {
    id: 'general',
    name: 'Comunidade Geral',
    type: 'general',
    description: 'Canal para todos os alunos',
  };

  const mockPinnedMessage = {
    id: 99,
    message: 'Regras da comunidade fixadas',
    user: {
      id: 1,
      name: 'Admin do Sistema',
    },
  };

  it('renders channel name and live badge', () => {
    render(<ChatHeader selectedChannel={mockChannel} />);

    expect(screen.getByText('Comunidade Geral')).toBeInTheDocument();
    expect(screen.getByText('Chat Ativo')).toBeInTheDocument();
    expect(screen.getByText('Favoritas')).toBeInTheDocument();
  });

  it('toggles favorites filter when clicked', () => {
    const handleToggle = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        favoritesOnly={false}
        onToggleFavoritesOnly={handleToggle}
      />
    );

    const favBtn = screen.getByTestId('chat-filter-favorites-btn');
    fireEvent.click(favBtn);
    expect(handleToggle).toHaveBeenCalled();
  });

  it('renders pinned message banner when pinnedMessage is provided', () => {
    const handleUnpin = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        currentUser={{ id: 1, role: 'superadmin' }}
        pinnedMessage={mockPinnedMessage}
        onUnpinMessage={handleUnpin}
      />
    );

    expect(screen.getByTestId('chat-pinned-message-banner')).toBeInTheDocument();
    expect(screen.getByText(/Regras da comunidade fixadas/i)).toBeInTheDocument();

    const unpinBtn = screen.getByTestId('unpin-message-banner-btn');
    fireEvent.click(unpinBtn);
    expect(handleUnpin).toHaveBeenCalledWith(99);
  });

  it('triggers onJumpToMessage when clicking the pinned message banner', () => {
    const handleJump = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        pinnedMessage={mockPinnedMessage}
        onJumpToMessage={handleJump}
      />
    );

    const banner = screen.getByTestId('chat-pinned-message-banner');
    fireEvent.click(banner);
    expect(handleJump).toHaveBeenCalledWith(99);
  });

  it('stops propagation when unpin button is clicked so onJumpToMessage is not called', () => {
    const handleJump = vi.fn();
    const handleUnpin = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        currentUser={{ id: 1, role: 'superadmin' }}
        pinnedMessage={mockPinnedMessage}
        onJumpToMessage={handleJump}
        onUnpinMessage={handleUnpin}
      />
    );

    const unpinBtn = screen.getByTestId('unpin-message-banner-btn');
    fireEvent.click(unpinBtn);
    expect(handleUnpin).toHaveBeenCalledWith(99);
    expect(handleJump).not.toHaveBeenCalled();
  });

  it('renders back button and triggers onBack when provided', () => {
    const handleBack = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        onBack={handleBack}
      />
    );

    const backBtn = screen.getByTestId('chat-header-back-btn');
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenMediaGallery when media gallery button is clicked', () => {
    const handleOpenGallery = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        onOpenMediaGallery={handleOpenGallery}
      />
    );

    const mediaBtn = screen.getByTestId('chat-open-media-gallery-btn');
    expect(mediaBtn).toBeInTheDocument();
    expect(screen.getByText('Mídias & Arquivos')).toBeInTheDocument();
    fireEvent.click(mediaBtn);
    expect(handleOpenGallery).toHaveBeenCalledTimes(1);
  });
});
