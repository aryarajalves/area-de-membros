import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedPostDetailModal from './FeedPostDetailModal';

// Mock do ToastContext
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

// Mock da API
vi.mock('./communityFeedApi', () => ({
  fetchFeedPost: vi.fn().mockResolvedValue({
    id: 101,
    user_id: 1,
    user_name: 'Aryaraj',
    user_avatar: null,
    user_role: 'superadmin',
    user_level_title: 'Bronze I',
    content: 'Publicação de teste com link https://exemplo.com',
    category: 'vitoria',
    likes_count: 10,
    comments_count: 5,
    bookmarks_count: 3,
    shares_count: 2,
    views_count: 45,
    is_liked_by_me: false,
    is_bookmarked_by_me: false,
    created_at: new Date().toISOString(),
    comments: [],
  }),
  toggleLikeFeedPost: vi.fn().mockResolvedValue({ liked: true, likes_count: 11 }),
  toggleBookmarkFeedPost: vi.fn().mockResolvedValue({ bookmarked: true, bookmarks_count: 4 }),
  shareFeedPost: vi.fn().mockResolvedValue({ shares_count: 3 }),
  recordFeedPostView: vi.fn().mockResolvedValue({ recorded: true }),
}));

describe('FeedPostDetailModal', () => {
  const samplePost = {
    id: 101,
    user_id: 1,
    user_name: 'Aryaraj',
    user_avatar: null,
    user_role: 'superadmin',
    user_level_title: 'Bronze I',
    content: 'Publicação de teste com link https://exemplo.com',
    category: 'vitoria',
    likes_count: 10,
    comments_count: 5,
    bookmarks_count: 3,
    shares_count: 2,
    views_count: 45,
    is_liked_by_me: false,
    is_bookmarked_by_me: false,
    created_at: new Date().toISOString(),
    comments: [],
  };

  it('não deve renderizar quando isOpen for falso', () => {
    const { container } = render(
      <FeedPostDetailModal isOpen={false} post={samplePost} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar os detalhes da publicação maximizada com autor, badges e contadores', () => {
    render(
      <FeedPostDetailModal
        isOpen={true}
        post={samplePost}
        currentUser={{ id: 1 }}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('feed-post-detail-modal')).toBeInTheDocument();
    expect(screen.getByText('Publicação Maximizada')).toBeInTheDocument();
    expect(screen.getByTestId('feed-detail-author-name')).toHaveTextContent('Aryaraj');
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Bronze I')).toBeInTheDocument();
    expect(screen.getByText('🏆 Vitória')).toBeInTheDocument();
    expect(screen.getByText(/10 curtidas/i)).toBeInTheDocument();
    expect(screen.getByText(/5 comentários/i)).toBeInTheDocument();
    expect(screen.getByText(/3 salvos/i)).toBeInTheDocument();
    expect(screen.getByText(/2 compartilhamentos/i)).toBeInTheDocument();
  });

  it('deve invocar onClose ao clicar no botão de fechar', () => {
    const handleClose = vi.fn();
    render(
      <FeedPostDetailModal
        isOpen={true}
        post={samplePost}
        currentUser={{ id: 1 }}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByTestId('feed-detail-close-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('deve permitir curtir a publicação maximizada', async () => {
    const onPostUpdated = vi.fn();
    render(
      <FeedPostDetailModal
        isOpen={true}
        post={samplePost}
        currentUser={{ id: 1 }}
        onClose={vi.fn()}
        onPostUpdated={onPostUpdated}
      />
    );

    const likeBtn = screen.getByTestId('feed-detail-like-btn');
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(onPostUpdated).toHaveBeenCalled();
    });
  });

  it('deve permitir salvar a publicação maximizada nos favoritos', async () => {
    const onPostUpdated = vi.fn();
    render(
      <FeedPostDetailModal
        isOpen={true}
        post={samplePost}
        currentUser={{ id: 1 }}
        onClose={vi.fn()}
        onPostUpdated={onPostUpdated}
      />
    );

    const bmBtn = screen.getByTestId('feed-detail-bookmark-btn');
    fireEvent.click(bmBtn);

    await waitFor(() => {
      expect(onPostUpdated).toHaveBeenCalled();
    });
  });
});
