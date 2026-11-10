import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeedPostCard from './FeedPostCard';
import * as feedApi from './communityFeedApi';

vi.mock('./communityFeedApi', () => ({
  toggleLikeFeedPost: vi.fn(),
  togglePinFeedPost: vi.fn(),
  updateFeedPost: vi.fn(),
  createFeedComment: vi.fn(),
  deleteFeedComment: vi.fn(),
  toggleBookmarkFeedPost: vi.fn(),
  fetchFeedPostLikes: vi.fn(),
  recordFeedPostView: vi.fn().mockResolvedValue({ recorded: true }),
  fetchFeedPostInsights: vi.fn().mockResolvedValue({
    post_id: 42,
    views_count: 50,
    likes_count: 5,
    comments_count: 2,
    bookmarks_count: 1,
    total_interactions: 8,
    engagement_rate: 16.0,
    recent_viewers: [],
    created_at: new Date().toISOString(),
  }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

describe('FeedPostCard Component', () => {
  const mockPost = {
    id: 42,
    user_id: 1,
    user_name: 'Ana Silva',
    user_avatar: null,
    user_role: 'aluno',
    content: 'Hoje fechei meu primeiro contrato de consultoria! 🎉',
    media_urls: ['/uploads/test.jpg'],
    media_type: 'image',
    likes_count: 5,
    comments_count: 2,
    is_liked_by_me: false,
    is_bookmarked_by_me: false,
    is_pinned: false,
    created_at: '2026-11-10T10:00:00Z',
    comments: [
      {
        id: 101,
        post_id: 42,
        user_id: 2,
        user_name: 'Marcos Instrutor',
        user_role: 'admin',
        content: 'Muito orgulho de você!',
        created_at: '2026-11-10T10:05:00Z',
      },
    ],
  };

  const mockCurrentUser = { id: 1, name: 'Ana Silva', role: 'aluno' };

  beforeEach(() => {
    vi.clearAllMocks();
    feedApi.fetchFeedPostLikes.mockResolvedValue([]);
  });

  it('renders author name, post content, and like/comment counts', () => {
    render(<FeedPostCard post={mockPost} currentUser={mockCurrentUser} />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Hoje fechei meu primeiro contrato de consultoria! 🎉')).toBeInTheDocument();
    expect(screen.getByTestId('feed-likes-count-42')).toHaveTextContent('5');
    expect(screen.getByTestId('feed-comments-count-42')).toHaveTextContent('2');
  });

  it('toggles like when like button is clicked', async () => {
    feedApi.toggleLikeFeedPost.mockResolvedValueOnce({ liked: true, likes_count: 6 });

    render(<FeedPostCard post={mockPost} currentUser={mockCurrentUser} />);
    const likeBtn = screen.getByTestId('feed-like-btn-42');
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(feedApi.toggleLikeFeedPost).toHaveBeenCalledWith(42);
      expect(screen.getByTestId('feed-likes-count-42')).toHaveTextContent('6');
    });
  });

  it('toggles bookmark when bookmark button is clicked', async () => {
    feedApi.toggleBookmarkFeedPost.mockResolvedValueOnce({ bookmarked: true });

    render(<FeedPostCard post={mockPost} currentUser={mockCurrentUser} />);
    const bookmarkBtn = screen.getByTestId('feed-bookmark-btn-42');
    fireEvent.click(bookmarkBtn);

    await waitFor(() => {
      expect(feedApi.toggleBookmarkFeedPost).toHaveBeenCalledWith(42);
    });
  });

  it('opens likes modal when likes count is clicked', () => {
    render(<FeedPostCard post={mockPost} currentUser={mockCurrentUser} />);
    const likesCountBtn = screen.getByTestId('feed-likes-count-42');
    fireEvent.click(likesCountBtn);

    expect(screen.getByTestId('feed-likes-modal-container')).toBeInTheDocument();
    expect(screen.getByText('Quem Curtiu')).toBeInTheDocument();
  });

  it('expands comments section and displays existing comments', () => {
    render(<FeedPostCard post={mockPost} currentUser={mockCurrentUser} />);
    const commentsToggleBtn = screen.getByTestId('feed-comments-toggle-btn-42');
    fireEvent.click(commentsToggleBtn);

    expect(screen.getByTestId('feed-comments-section-42')).toBeInTheDocument();
    expect(screen.getByText('Marcos Instrutor')).toBeInTheDocument();
    expect(screen.getByText('Muito orgulho de você!')).toBeInTheDocument();
  });

  it('opens delete confirmation modal when delete button in menu is clicked', () => {
    render(<FeedPostCard post={mockPost} currentUser={mockCurrentUser} />);
    const menuBtn = screen.getByTestId('feed-post-menu-btn-42');
    fireEvent.click(menuBtn);

    const deleteBtn = screen.getByTestId('feed-delete-btn-42');
    fireEvent.click(deleteBtn);

    expect(screen.getByTestId('delete-feed-modal-container')).toBeInTheDocument();
    expect(screen.getByText('Excluir Publicação')).toBeInTheDocument();
  });

  it('records post view automatically on mount', () => {
    render(<FeedPostCard post={mockPost} currentUser={mockCurrentUser} />);
    expect(feedApi.recordFeedPostView).toHaveBeenCalledWith(42);
  });

  it('renders insights button for author and opens insights modal on click', async () => {
    render(<FeedPostCard post={mockPost} currentUser={mockCurrentUser} />);
    const insightsBtn = screen.getByTestId('feed-insights-btn-42');
    expect(insightsBtn).toBeInTheDocument();
    expect(insightsBtn).toHaveTextContent('Ver insights');

    fireEvent.click(insightsBtn);

    expect(screen.getByTestId('feed-post-insights-modal')).toBeInTheDocument();
  });
});
