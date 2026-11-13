import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IntroductionPostCard, { formatRelativeTime } from './IntroductionPostCard';

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

  describe('formatRelativeTime helper', () => {
    it('retorna string vazia quando data não é fornecida', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime('')).toBe('');
    });

    it('formata corretamente menos de 1 minuto como agora há pouco', () => {
      const now = new Date();
      const thirtySecAgo = new Date(now.getTime() - 30 * 1000).toISOString();
      expect(formatRelativeTime(thirtySecAgo)).toBe('agora há pouco');
    });

    it('formata corretamente minutos', () => {
      const now = new Date();
      const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
      expect(formatRelativeTime(tenMinAgo)).toBe('há 10 min');
    });

    it('formata corretamente horas', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo)).toBe('há 2 h');
    });

    it('formata corretamente 3 dias atrás sem pular incorretamente para meses', () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo)).toBe('há 3 dias');
    });

    it('formata corretamente 1 dia atrás no singular', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(oneDayAgo)).toBe('há 1 dia');
    });

    it('formata corretamente meses quando realmente passam mais de 30 dias', () => {
      const now = new Date();
      const twoMonthsAgo = new Date(now.getTime() - 65 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(twoMonthsAgo)).toBe('há 2 meses');
    });
  });

  it('oculta links sociais, Chamar na DM e curtidas quando a apresentação for marcada como exemplo', () => {
    const examplePost = {
      id: 777,
      user_id: 99,
      user_name: 'Luana Mendes',
      user_role: 'user',
      title: 'Apresentação Exemplo',
      content: 'Conteúdo modelo para alunos.',
      instagram: '@luanamendes.astro',
      is_pinned: true,
      is_example: true,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
    };

    render(
      <IntroductionPostCard
        post={examplePost}
        currentUser={{ id: 1, role: 'aluno' }}
        onSelectPost={vi.fn()}
        onToggleLike={vi.fn()}
        onOpenDm={vi.fn()}
      />
    );

    expect(screen.getByTestId('intro-example-badge-777')).toHaveTextContent('Apresentação de Exemplo');
    expect(screen.getByText('Modelo para seguir')).toBeInTheDocument();
    expect(screen.getByTestId('intro-social-links')).toBeInTheDocument();
    expect(screen.getByTestId('intro-link-instagram')).toBeInTheDocument();
    expect(screen.queryByTestId('intro-link-dm')).not.toBeInTheDocument();
    expect(screen.queryByTestId('like-post-btn-777')).not.toBeInTheDocument();
  });
});
