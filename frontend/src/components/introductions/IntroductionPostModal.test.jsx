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

  it('exibe botão de editar para o autor e chama onEditPost ao clicar', () => {
    const onEditPost = vi.fn();

    render(
      <IntroductionPostModal
        post={mockPost}
        currentUser={mockUser}
        onClose={vi.fn()}
        onToggleLike={vi.fn()}
        onAddComment={vi.fn()}
        onDeleteComment={vi.fn()}
        onDeletePost={vi.fn()}
        onEditPost={onEditPost}
      />
    );

    const editBtn = screen.getByTestId('edit-intro-post-trigger-btn');
    expect(editBtn).toBeInTheDocument();
    fireEvent.click(editBtn);
    expect(onEditPost).toHaveBeenCalledWith(mockPost);
  });

  it('exibe botão de marcar como exemplo para superadmin e oculta DM/reações/comentários quando is_example é true', () => {
    const onToggleExample = vi.fn();
    const examplePost = {
      ...mockPost,
      user_id: 99,
      is_pinned: true,
      is_example: true,
      instagram: '@luana',
      comments: [],
    };

    render(
      <IntroductionPostModal
        post={examplePost}
        currentUser={{ id: 1, role: 'superadmin' }}
        onClose={vi.fn()}
        onToggleLike={vi.fn()}
        onToggleExample={onToggleExample}
        onAddComment={vi.fn()}
        onDeleteComment={vi.fn()}
        onDeletePost={vi.fn()}
        onOpenDm={vi.fn()}
      />
    );

    expect(screen.getByTestId('modal-example-indicator')).toHaveTextContent('Apresentação de Exemplo');
    expect(screen.getByTestId('intro-example-notice')).toBeInTheDocument();
    expect(screen.getByTestId('intro-social-links')).toBeInTheDocument();
    expect(screen.getByTestId('intro-link-instagram')).toBeInTheDocument();
    expect(screen.queryByTestId('intro-link-dm')).not.toBeInTheDocument();
    expect(screen.queryByTestId('toggle-like-post-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('focus-comment-btn')).not.toBeInTheDocument();

    const toggleExampleBtn = screen.getByTestId('toggle-example-intro-post-btn');
    fireEvent.click(toggleExampleBtn);
    expect(onToggleExample).toHaveBeenCalledWith(examplePost.id);
  });
});
