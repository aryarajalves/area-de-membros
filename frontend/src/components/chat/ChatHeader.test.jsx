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
});
