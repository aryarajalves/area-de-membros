import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IntroductionPostCard from './IntroductionPostCard';

describe('IntroductionPostCard Component', () => {
  const mockPost = {
    id: 1,
    title: 'Apresentação do Desenvolvedor',
    content: 'Olá! Sou engenheiro de software e trabalho com automação.',
    user_name: 'Carlos Silva',
    user_role: 'aluno',
    user_avatar: null,
    niche: 'Desenvolvedor',
    location: 'Belo Horizonte - MG',
    media_type: 'video',
    media_url: '/videos/intro.mp4',
    is_pinned: true,
    likes_count: 7,
    comments_count: 3,
    is_liked_by_me: false,
    created_at: '2026-11-09T12:00:00Z',
  };

  it('renderiza título, autor, selo fixado, nicho e indicador de mídia', () => {
    const onSelectPost = vi.fn();
    const onToggleLike = vi.fn();

    render(
      <IntroductionPostCard
        post={mockPost}
        currentUser={{ id: 99, role: 'aluno' }}
        onSelectPost={onSelectPost}
        onToggleLike={onToggleLike}
      />
    );

    expect(screen.getByText('Apresentação do Desenvolvedor')).toBeInTheDocument();
    expect(screen.getByText('Carlos Silva')).toBeInTheDocument();
    expect(screen.getByTestId('intro-pinned-badge-1')).toBeInTheDocument();
    expect(screen.getByText('Desenvolvedor')).toBeInTheDocument();
    expect(screen.getByText(/Belo Horizonte - MG/)).toBeInTheDocument();
    expect(screen.getByTestId('intro-media-badge-1')).toHaveTextContent('Vídeo de apresentação');

    // Clica no card para selecionar
    fireEvent.click(screen.getByTestId('intro-post-row-1'));
    expect(onSelectPost).toHaveBeenCalledWith(mockPost);

    // Clica no like
    fireEvent.click(screen.getByTestId('like-post-btn-1'));
    expect(onToggleLike).toHaveBeenCalledWith(1, 'like');
  });

  it('renderiza o resumo de reações quando likes_count > 0', () => {
    const postWithReactions = {
      ...mockPost,
      id: 2,
      likes_count: 5,
      reactions_summary: ['like', 'love', 'celebrate'],
    };

    render(
      <IntroductionPostCard
        post={postWithReactions}
        currentUser={{ id: 99, role: 'aluno' }}
        onSelectPost={vi.fn()}
        onToggleLike={vi.fn()}
      />
    );

    expect(screen.getByTestId('reaction-pill-summary')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
