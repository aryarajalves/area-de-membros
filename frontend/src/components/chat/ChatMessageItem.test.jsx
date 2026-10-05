import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatMessageItem from './ChatMessageItem';

describe('ChatMessageItem Component', () => {
  const mockMessageWithAvatar = {
    id: 1,
    channel_type: 'general',
    message: 'Mensagem com avatar',
    created_at: '2026-10-05T10:00:00Z',
    user: {
      id: 2,
      name: 'João Silva',
      email: 'joao@test.com',
      role: 'aluno',
      avatar_url: 'https://cdn.test.com/joao-avatar.png',
    },
    can_delete: false,
  };

  const mockMessageWithoutAvatar = {
    id: 2,
    channel_type: 'general',
    message: 'Mensagem sem foto',
    created_at: '2026-10-05T10:05:00Z',
    user: {
      id: 3,
      name: 'Maria Santos',
      email: 'maria@test.com',
      role: 'admin',
      avatar_url: null,
    },
    can_delete: false,
  };

  it('renders user avatar image when avatar_url is provided', () => {
    render(
      <ChatMessageItem
        message={mockMessageWithAvatar}
        currentUser={{ id: 1, role: 'superadmin' }}
        onDeleteMessage={vi.fn()}
      />
    );

    const img = screen.getByTestId('chat-avatar-img-1');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://cdn.test.com/joao-avatar.png');
    expect(img).toHaveAttribute('alt', 'João Silva');
  });

  it('falls back to initial when user has no avatar_url', () => {
    render(
      <ChatMessageItem
        message={mockMessageWithoutAvatar}
        currentUser={{ id: 1, role: 'superadmin' }}
        onDeleteMessage={vi.fn()}
      />
    );

    expect(screen.queryByTestId('chat-avatar-img-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-avatar-2')).toHaveTextContent('M');
  });

  it('falls back to initial when avatar image encounters error (onError)', () => {
    render(
      <ChatMessageItem
        message={mockMessageWithAvatar}
        currentUser={{ id: 1, role: 'superadmin' }}
        onDeleteMessage={vi.fn()}
      />
    );

    const img = screen.getByTestId('chat-avatar-img-1');
    fireEvent.error(img);

    expect(screen.queryByTestId('chat-avatar-img-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-avatar-1')).toHaveTextContent('J');
  });

  it('uses currentUser avatar_url for own messages if currentUser has updated avatar', () => {
    const ownMessage = {
      id: 3,
      channel_type: 'general',
      message: 'Minha mensagem recente',
      created_at: '2026-10-05T10:10:00Z',
      user: {
        id: 1,
        name: 'Aryaraj',
        role: 'superadmin',
        avatar_url: null, // Na mensagem veio null, mas no currentUser tem avatar
      },
      can_delete: true,
    };

    render(
      <ChatMessageItem
        message={ownMessage}
        currentUser={{ id: 1, name: 'Aryaraj', role: 'superadmin', avatar_url: 'https://cdn.test.com/my-super-avatar.jpg' }}
        onDeleteMessage={vi.fn()}
      />
    );

    const img = screen.getByTestId('chat-avatar-img-3');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://cdn.test.com/my-super-avatar.jpg');
  });

  it('handles liking a chat message', () => {
    const handleLike = vi.fn();
    const msgWithLikes = { ...mockMessageWithAvatar, likes_count: 5, liked_by_me: true };

    render(
      <ChatMessageItem
        message={msgWithLikes}
        currentUser={{ id: 2, role: 'aluno' }}
        onDeleteMessage={vi.fn()}
        onToggleLike={handleLike}
      />
    );

    const likeBtn = screen.getByTestId('like-msg-btn-1');
    expect(likeBtn).toHaveTextContent('5');
    fireEvent.click(likeBtn);
    expect(handleLike).toHaveBeenCalledWith(1);
  });

  it('handles favoriting a chat message', () => {
    const handleFav = vi.fn();
    const msgFavorited = { ...mockMessageWithAvatar, is_favorited: true };

    render(
      <ChatMessageItem
        message={msgFavorited}
        currentUser={{ id: 2, role: 'aluno' }}
        onDeleteMessage={vi.fn()}
        onToggleFavorite={handleFav}
      />
    );

    const favBtn = screen.getByTestId('favorite-msg-btn-1');
    expect(favBtn).toHaveAttribute('title', 'Remover dos favoritos');
    fireEvent.click(favBtn);
    expect(handleFav).toHaveBeenCalledWith(1);
  });

  it('displays pin button for managers and allows toggling pin', () => {
    const handlePin = vi.fn();
    const pinnedMsg = { ...mockMessageWithAvatar, is_pinned: true };

    render(
      <ChatMessageItem
        message={pinnedMsg}
        currentUser={{ id: 99, role: 'admin' }}
        onDeleteMessage={vi.fn()}
        onTogglePin={handlePin}
      />
    );

    expect(screen.getByTestId('pinned-badge-1')).toHaveTextContent('Fixada');
    const pinBtn = screen.getByTestId('pin-msg-btn-1');
    expect(pinBtn).toHaveAttribute('title', 'Desafixar mensagem');
    fireEvent.click(pinBtn);
    expect(handlePin).toHaveBeenCalledWith(1);
  });

  it('hides pin button for regular students', () => {
    render(
      <ChatMessageItem
        message={mockMessageWithAvatar}
        currentUser={{ id: 2, role: 'aluno' }}
        onDeleteMessage={vi.fn()}
      />
    );

    expect(screen.queryByTestId('pin-msg-btn-1')).not.toBeInTheDocument();
  });

  it('renders attached image correctly', () => {
    const msgWithImage = {
      ...mockMessageWithAvatar,
      media_url: 'https://cdn.test.com/prints/foto.png',
      media_type: 'image',
    };

    render(
      <ChatMessageItem
        message={msgWithImage}
        currentUser={{ id: 2, role: 'aluno' }}
        onDeleteMessage={vi.fn()}
      />
    );

    const mediaImg = screen.getByTestId('chat-media-img-1');
    expect(mediaImg).toHaveAttribute('src', 'https://cdn.test.com/prints/foto.png');
  });

  it('renders attached document correctly', () => {
    const msgWithDoc = {
      ...mockMessageWithAvatar,
      media_url: 'https://cdn.test.com/docs/apostila.pdf',
      media_type: 'file',
    };

    render(
      <ChatMessageItem
        message={msgWithDoc}
        currentUser={{ id: 2, role: 'aluno' }}
        onDeleteMessage={vi.fn()}
      />
    );

    expect(screen.getByText('Visualizar Documento')).toBeInTheDocument();
  });
});
