import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CommentItem from './CommentItem';

describe('CommentItem Component', () => {
  const mockComment = {
    id: 10,
    content: 'Ótima aula sobre React Hooks!',
    created_at: '2026-10-05T12:00:00Z',
    likes_count: 3,
    liked_by_me: false,
    user: {
      id: 5,
      name: 'Carlos Aluno',
      role: 'aluno',
    },
    replies: [
      {
        id: 20,
        content: 'Concordo totalmente Carlos!',
        created_at: '2026-10-05T12:05:00Z',
        likes_count: 1,
        liked_by_me: true,
        user: {
          id: 6,
          name: 'Ana Professora',
          role: 'admin',
        },
      },
    ],
  };

  const getRoleBadge = (role) => ({
    label: role === 'admin' ? 'Admin' : 'Aluno',
    bg: '#e0f2fe',
    text: '#0284c7',
  });

  it('renders comment content and allows liking root comment', () => {
    const handleToggleLike = vi.fn();

    render(
      <CommentItem
        comment={mockComment}
        currentUser={{ id: 5, role: 'aluno' }}
        onReply={vi.fn()}
        onDeleteRequest={vi.fn()}
        onToggleLike={handleToggleLike}
        getRoleBadge={getRoleBadge}
        canDeleteComment={() => false}
      />
    );

    expect(screen.getByText('Ótima aula sobre React Hooks!')).toBeInTheDocument();
    const likeBtn = screen.getByTestId('like-comment-btn-10');
    expect(likeBtn).toHaveTextContent('3');

    fireEvent.click(likeBtn);
    expect(handleToggleLike).toHaveBeenCalledWith(10);
  });

  it('renders reply and allows liking reply comment', () => {
    const handleToggleLike = vi.fn();

    render(
      <CommentItem
        comment={mockComment}
        currentUser={{ id: 5, role: 'aluno' }}
        onReply={vi.fn()}
        onDeleteRequest={vi.fn()}
        onToggleLike={handleToggleLike}
        getRoleBadge={getRoleBadge}
        canDeleteComment={() => false}
      />
    );

    expect(screen.getByText('Concordo totalmente Carlos!')).toBeInTheDocument();
    const likeReplyBtn = screen.getByTestId('like-reply-btn-20');
    expect(likeReplyBtn).toHaveTextContent('1');

    fireEvent.click(likeReplyBtn);
    expect(handleToggleLike).toHaveBeenCalledWith(20);
  });

  it('allows toggling favorite on comment', () => {
    const handleToggleFavorite = vi.fn();

    render(
      <CommentItem
        comment={mockComment}
        currentUser={{ id: 5, role: 'aluno' }}
        onReply={vi.fn()}
        onDeleteRequest={vi.fn()}
        onToggleLike={vi.fn()}
        onToggleFavorite={handleToggleFavorite}
        getRoleBadge={getRoleBadge}
        canDeleteComment={() => false}
      />
    );

    const favBtn = screen.getByTestId('favorite-comment-btn-10');
    expect(favBtn).toBeInTheDocument();

    fireEvent.click(favBtn);
    expect(handleToggleFavorite).toHaveBeenCalledWith(10);
  });
});

