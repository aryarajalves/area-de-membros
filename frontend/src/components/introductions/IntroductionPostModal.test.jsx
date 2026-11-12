import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import IntroductionPostModal from './IntroductionPostModal';

describe('IntroductionPostModal Component', () => {
  const mockPost = {
    id: 1,
    user_id: 10,
    user_name: 'Aryaraj',
    user_role: 'superadmin',
    user_avatar: 'https://exemplo.com/avatar.jpg',
    title: 'Apresentação do Aryaraj',
    content: 'Olá a todos, sou o Aryaraj e criei este projeto.',
    media_type: 'image',
    media_url: 'https://exemplo.com/foto_apresentacao.jpg',
    likes_count: 5,
    comments_count: 0,
    comments: [],
    is_pinned: false,
    created_at: '2026-10-06T10:00:00Z',
  };

  const mockUser = {
    id: 10,
    name: 'Aryaraj',
    role: 'superadmin',
    avatar_url: 'https://exemplo.com/avatar.jpg',
  };

  it('renders modal with post title, author info, image embed and comments heading', () => {
    render(
      <IntroductionPostModal
        post={mockPost}
        currentUser={mockUser}
        onClose={vi.fn()}
        onToggleLike={vi.fn()}
        onAddComment={vi.fn()}
        onDeleteComment={vi.fn()}
        onDeletePost={vi.fn()}
      />
    );

    expect(screen.getByText('Apresentação do Aryaraj')).toBeInTheDocument();
    expect(screen.getByText('Olá a todos, sou o Aryaraj e criei este projeto.')).toBeInTheDocument();
    expect(screen.getByTestId('intro-media-embed-image')).toBeInTheDocument();
    expect(screen.getByTestId('modal-comments-count-badge')).toHaveTextContent('0');
    expect(screen.getByTestId('intro-no-comments-empty')).toBeInTheDocument();
  });

  it('submits a new comment when typing and clicking send button', async () => {
    const onAddComment = vi.fn().mockResolvedValue(true);
    render(
      <IntroductionPostModal
        post={mockPost}
        currentUser={mockUser}
        onClose={vi.fn()}
        onToggleLike={vi.fn()}
        onAddComment={onAddComment}
        onDeleteComment={vi.fn()}
        onDeletePost={vi.fn()}
      />
    );

    const input = screen.getByTestId('new-comment-input');
    expect(input).toHaveAttribute('placeholder', 'Comentar como Aryaraj...');

    fireEvent.change(input, { target: { value: 'Parabéns pela apresentação!' } });
    expect(input.value).toBe('Parabéns pela apresentação!');

    const submitBtn = screen.getByTestId('submit-comment-btn');
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    expect(onAddComment).toHaveBeenCalledWith(1, 'Parabéns pela apresentação!');
  });

  it('renders existing comments list and allows deletion by author/admin', () => {
    const onDeleteComment = vi.fn();
    const postWithComments = {
      ...mockPost,
      comments: [
        {
          id: 501,
          user_id: 12,
          user_name: 'Mireille',
          user_role: 'aluno',
          content: 'Seja muito bem-vindo Aryaraj!',
          created_at: '2026-10-06T10:30:00Z',
        },
      ],
    };

    render(
      <IntroductionPostModal
        post={postWithComments}
        currentUser={mockUser}
        onClose={vi.fn()}
        onToggleLike={vi.fn()}
        onAddComment={vi.fn()}
        onDeleteComment={onDeleteComment}
        onDeletePost={vi.fn()}
      />
    );

    expect(screen.getByText('Seja muito bem-vindo Aryaraj!')).toBeInTheDocument();
    expect(screen.getByText('Mireille')).toBeInTheDocument();

    const deleteBtn = screen.getByTestId('delete-comment-btn-501');
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(deleteBtn);
    expect(onDeleteComment).toHaveBeenCalledWith(501);
  });
});
