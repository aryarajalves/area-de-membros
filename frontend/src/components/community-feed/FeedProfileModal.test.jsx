import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeedProfileModal from './FeedProfileModal';
import * as feedApi from './communityFeedApi';

vi.mock('./communityFeedApi', () => ({
  fetchUserProfile: vi.fn(),
  updateMyProfile: vi.fn(),
  uploadProfileAvatar: vi.fn(),
  toggleFollowUser: vi.fn(),
  fetchUserFollowers: vi.fn(),
  fetchUserFollowing: vi.fn(),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

describe('FeedProfileModal Component', () => {
  const mockProfile = {
    id: 15,
    name: 'Juliana Tech',
    email: 'juliana@email.com',
    role: 'aluno',
    avatar_url: null,
    bio: 'Desenvolvedora FullStack apaixonada por IA e código limpo.',
    bio_link: 'https://github.com/juliana-tech',
    posts_count: 5,
    followers_count: 42,
    following_count: 18,
    is_following: false,
    is_me: true,
    created_at: new Date().toISOString(),
    posts: [
      {
        id: 101,
        user_id: 15,
        content: 'Post de teste no meu perfil!',
        media_urls: [],
        media_type: 'none',
        likes_count: 10,
        comments_count: 3,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<FeedProfileModal isOpen={false} userId={15} onClose={() => {}} />);
    expect(screen.queryByTestId('feed-profile-modal')).not.toBeInTheDocument();
  });

  it('renders profile information, stats, bio, link and posts when loaded', async () => {
    feedApi.fetchUserProfile.mockResolvedValueOnce(mockProfile);

    render(<FeedProfileModal isOpen={true} userId={15} onClose={() => {}} />);

    expect(screen.getByText('Carregando perfil...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('feed-profile-name')).toHaveTextContent('Juliana Tech');
      expect(screen.getByTestId('feed-profile-bio')).toHaveTextContent('Desenvolvedora FullStack');
      expect(screen.getByTestId('feed-profile-link')).toHaveTextContent('github.com/juliana-tech');
      expect(screen.getByTestId('feed-profile-posts-stat')).toHaveTextContent('5');
      expect(screen.getByTestId('feed-profile-followers-stat')).toHaveTextContent('42');
      expect(screen.getByTestId('feed-profile-following-stat')).toHaveTextContent('18');
      expect(screen.getByTestId('feed-profile-edit-btn')).toBeInTheDocument();
      expect(screen.getByTestId('feed-profile-grid-item-101')).toBeInTheDocument();
    });
  });

  it('opens edit profile modal when edit button is clicked', async () => {
    feedApi.fetchUserProfile.mockResolvedValueOnce(mockProfile);

    render(<FeedProfileModal isOpen={true} userId={15} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-profile-edit-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('feed-profile-edit-btn'));

    expect(screen.getByTestId('feed-edit-profile-modal')).toBeInTheDocument();
    expect(screen.getByText('Editar Perfil')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    feedApi.fetchUserProfile.mockResolvedValueOnce(mockProfile);
    const onClose = vi.fn();

    render(<FeedProfileModal isOpen={true} userId={15} onClose={onClose} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-profile-close-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('feed-profile-close-btn'));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders follow button for other users and toggles follow on click', async () => {
    const otherUserProfile = {
      ...mockProfile,
      id: 99,
      name: 'Marcos Instrutor',
      is_me: false,
      is_following: false,
      followers_count: 10,
    };

    feedApi.fetchUserProfile.mockResolvedValueOnce(otherUserProfile);
    feedApi.toggleFollowUser.mockResolvedValueOnce({ following: true, followers_count: 11, following_count: 5 });

    render(<FeedProfileModal isOpen={true} userId={99} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-profile-follow-btn')).toHaveTextContent('Seguir');
    });

    fireEvent.click(screen.getByTestId('feed-profile-follow-btn'));

    await waitFor(() => {
      expect(feedApi.toggleFollowUser).toHaveBeenCalledWith(99);
      expect(screen.getByTestId('feed-profile-follow-btn')).toHaveTextContent('Seguindo');
      expect(screen.getByTestId('feed-profile-followers-stat')).toHaveTextContent('11');
    });
  });

  it('opens follow list modal when clicking on followers stat', async () => {
    feedApi.fetchUserProfile.mockResolvedValueOnce(mockProfile);
    feedApi.fetchUserFollowers.mockResolvedValueOnce([]);

    render(<FeedProfileModal isOpen={true} userId={15} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-profile-followers-stat')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('feed-profile-followers-stat'));

    await waitFor(() => {
      expect(screen.getByTestId('feed-follow-list-modal')).toBeInTheDocument();
    });
  });

  it('renders elo level badge and progress card with default points', async () => {
    feedApi.fetchUserProfile.mockResolvedValueOnce({
      ...mockProfile,
      gamification_points: 0,
    });

    render(<FeedProfileModal isOpen={true} userId={15} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-profile-elo-badge')).toBeInTheDocument();
      expect(screen.getByTestId('feed-profile-elo-badge')).toHaveTextContent('Bronze I');
      expect(screen.getByTestId('feed-profile-elo-card')).toBeInTheDocument();
      expect(screen.getByTestId('feed-profile-elo-points')).toHaveTextContent('0 XP');
    });
  });

  it('renders advanced elo level badge and progress bar when user has high XP', async () => {
    feedApi.fetchUserProfile.mockResolvedValueOnce({
      ...mockProfile,
      gamification_points: 3500,
      gamification_level: 9,
      gamification_tier: 'Ouro',
      gamification_level_title: 'Ouro I',
      gamification_badge: '👑 Ouro I',
      gamification_progress_percent: 50,
      gamification_points_to_next: 1100,
    });

    render(<FeedProfileModal isOpen={true} userId={15} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-profile-elo-badge')).toHaveTextContent('👑 Ouro I');
      expect(screen.getByTestId('feed-profile-elo-card')).toHaveTextContent('Ouro I');
      expect(screen.getByTestId('feed-profile-elo-points')).toHaveTextContent('3500 XP');
      expect(screen.getByTestId('feed-profile-elo-progress-bar')).toBeInTheDocument();
    });
  });
});
