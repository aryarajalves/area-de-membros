import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeedFollowListModal from './FeedFollowListModal';
import * as feedApi from './communityFeedApi';

vi.mock('./communityFeedApi', () => ({
  fetchUserFollowers: vi.fn(),
  fetchUserFollowing: vi.fn(),
  toggleFollowUser: vi.fn(),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

describe('FeedFollowListModal Component', () => {
  const mockFollowers = [
    {
      id: 21,
      name: 'Carlos Aluno',
      role: 'aluno',
      avatar_url: null,
      bio: 'Apaixonado por programação web',
      is_following: false,
      is_me: false,
    },
    {
      id: 99,
      name: 'Admin Master',
      role: 'admin',
      avatar_url: null,
      bio: null,
      is_following: true,
      is_me: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <FeedFollowListModal
        isOpen={false}
        targetUserId={15}
        targetUserName="Juliana Tech"
        onClose={() => {}}
      />
    );
    expect(screen.queryByTestId('feed-follow-list-modal')).not.toBeInTheDocument();
  });

  it('loads and displays followers list when open with followers tab', async () => {
    feedApi.fetchUserFollowers.mockResolvedValueOnce(mockFollowers);

    render(
      <FeedFollowListModal
        isOpen={true}
        targetUserId={15}
        targetUserName="Juliana Tech"
        initialTab="followers"
        onClose={() => {}}
      />
    );

    expect(screen.getByText(/Carregando seguidores/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Carlos Aluno')).toBeInTheDocument();
      expect(screen.getByText('Admin Master')).toBeInTheDocument();
      expect(screen.getByTestId('feed-follow-toggle-btn-21')).toHaveTextContent('Seguir');
      expect(screen.getByTestId('feed-follow-toggle-btn-99')).toHaveTextContent('Seguindo');
    });
  });

  it('switches tabs to following and loads following list', async () => {
    feedApi.fetchUserFollowers.mockResolvedValueOnce(mockFollowers);
    feedApi.fetchUserFollowing.mockResolvedValueOnce([mockFollowers[1]]);

    render(
      <FeedFollowListModal
        isOpen={true}
        targetUserId={15}
        targetUserName="Juliana Tech"
        initialTab="followers"
        onClose={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Carlos Aluno')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('feed-follow-tab-following'));

    await waitFor(() => {
      expect(feedApi.fetchUserFollowing).toHaveBeenCalledWith(15);
      expect(screen.getByText('Admin Master')).toBeInTheDocument();
      expect(screen.queryByText('Carlos Aluno')).not.toBeInTheDocument();
    });
  });

  it('toggles follow status on button click', async () => {
    feedApi.fetchUserFollowers.mockResolvedValueOnce(mockFollowers);
    feedApi.toggleFollowUser.mockResolvedValueOnce({ following: true, followers_count: 1, following_count: 0 });

    render(
      <FeedFollowListModal
        isOpen={true}
        targetUserId={15}
        targetUserName="Juliana Tech"
        initialTab="followers"
        onClose={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('feed-follow-toggle-btn-21')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('feed-follow-toggle-btn-21'));

    await waitFor(() => {
      expect(feedApi.toggleFollowUser).toHaveBeenCalledWith(21);
      expect(screen.getByTestId('feed-follow-toggle-btn-21')).toHaveTextContent('Seguindo');
    });
  });

  it('calls onClose when close button is clicked', async () => {
    feedApi.fetchUserFollowers.mockResolvedValueOnce([]);
    const onClose = vi.fn();

    render(
      <FeedFollowListModal
        isOpen={true}
        targetUserId={15}
        targetUserName="Juliana Tech"
        onClose={onClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('feed-follow-list-close-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('feed-follow-list-close-btn'));
    expect(onClose).toHaveBeenCalled();
  });
});
