import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommunityFeedManagement from './CommunityFeedManagement';
import * as feedApi from './communityFeedApi';

vi.mock('./communityFeedApi', () => ({
  fetchFeed: vi.fn(),
  fetchFeedCourses: vi.fn(),
  deleteFeedPost: vi.fn(),
  createFeedPost: vi.fn(),
  toggleLikeFeedPost: vi.fn(),
  fetchFeedUnreadCount: vi.fn(),
  fetchFeedNotifications: vi.fn(),
  recordFeedPostView: vi.fn().mockResolvedValue({ recorded: true }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

describe('CommunityFeedManagement Component', () => {
  const mockUser = { id: 1, name: 'Pedro Aluno', role: 'aluno' };

  beforeEach(() => {
    vi.clearAllMocks();
    feedApi.fetchFeedCourses.mockResolvedValue([]);
    feedApi.fetchFeedUnreadCount.mockResolvedValue({ unread_count: 3 });
    feedApi.fetchFeedNotifications.mockResolvedValue({ notifications: [], unread_count: 0, total: 0 });
  });

  it('renders header title, search box, and filter tabs', async () => {
    feedApi.fetchFeed.mockResolvedValueOnce({
      posts: [],
      total: 0,
      page: 1,
      pages: 1,
    });

    render(<CommunityFeedManagement user={mockUser} />);

    expect(screen.getByTestId('feed-page-title')).toHaveTextContent('Feed da Comunidade');
    expect(screen.getByTestId('feed-filter-tab-all')).toBeInTheDocument();
    expect(screen.getByTestId('feed-filter-tab-following')).toBeInTheDocument();
    expect(screen.getByTestId('feed-filter-tab-popular')).toBeInTheDocument();
    expect(screen.getByTestId('feed-filter-tab-my_course')).toBeInTheDocument();
    expect(screen.getByTestId('feed-filter-tab-my_posts')).toBeInTheDocument();
    expect(screen.getByTestId('feed-search-input')).toBeInTheDocument();
  });

  it('renders list of posts when returned from API', async () => {
    feedApi.fetchFeed.mockResolvedValueOnce({
      posts: [
        {
          id: 1,
          user_id: 10,
          user_name: 'Beatriz Lima',
          content: 'Conquistei meu primeiro certificado!',
          likes_count: 8,
          comments_count: 1,
          is_liked_by_me: false,
          is_pinned: false,
          created_at: '2026-11-10T09:00:00Z',
          comments: [],
        },
      ],
      total: 1,
      page: 1,
      pages: 1,
    });

    render(<CommunityFeedManagement user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByText('Conquistei meu primeiro certificado!')).toBeInTheDocument();
      expect(screen.getByText('Beatriz Lima')).toBeInTheDocument();
    });
  });

  it('displays empty state message when no posts exist', async () => {
    feedApi.fetchFeed.mockResolvedValueOnce({
      posts: [],
      total: 0,
      page: 1,
      pages: 1,
    });

    render(<CommunityFeedManagement user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-empty-state')).toBeInTheDocument();
      expect(screen.getByText('Nenhuma publicação encontrada')).toBeInTheDocument();
    });
  });

  it('renders notifications button with unread badge and opens modal on click', async () => {
    feedApi.fetchFeed.mockResolvedValueOnce({
      posts: [],
      total: 0,
      page: 1,
      pages: 1,
    });

    render(<CommunityFeedManagement user={mockUser} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-notifs-badge')).toHaveTextContent('3');
    });

    const notifsBtn = screen.getByTestId('feed-notifs-btn');
    fireEvent.click(notifsBtn);

    expect(screen.getByTestId('feed-notifications-modal')).toBeInTheDocument();
  });

  it('changes filter to following when following tab is clicked', async () => {
    feedApi.fetchFeed.mockResolvedValue({
      posts: [],
      total: 0,
      page: 1,
      pages: 1,
    });

    render(<CommunityFeedManagement user={mockUser} />);
    fireEvent.click(screen.getByTestId('feed-filter-tab-following'));

    await waitFor(() => {
      expect(feedApi.fetchFeed).toHaveBeenCalledWith(
        expect.objectContaining({ filter: 'following' })
      );
    });
  });
});
