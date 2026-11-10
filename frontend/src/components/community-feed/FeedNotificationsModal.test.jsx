import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedNotificationsModal from './FeedNotificationsModal';
import * as feedApi from './communityFeedApi';

vi.mock('./communityFeedApi', () => ({
  fetchFeedNotifications: vi.fn(),
  markFeedNotificationAsRead: vi.fn(),
  markAllFeedNotificationsAsRead: vi.fn(),
  deleteFeedNotification: vi.fn(),
}));

describe('FeedNotificationsModal Component', () => {
  const mockNotifications = [
    {
      id: 1,
      user_id: 10,
      actor_id: 20,
      actor_name: 'Carlos Aluno',
      actor_avatar: null,
      notification_type: 'feed_like',
      post_id: 101,
      comment_id: null,
      title: 'Nova curtida',
      message: 'Carlos Aluno curtiu sua publicação.',
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      user_id: 10,
      actor_id: 30,
      actor_name: 'Mariana Instrutora',
      actor_avatar: null,
      notification_type: 'feed_comment',
      post_id: 101,
      comment_id: 55,
      title: 'Novo comentário',
      message: 'Mariana comentou: "Excelente trabalho!"',
      is_read: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<FeedNotificationsModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByTestId('feed-notifications-modal')).not.toBeInTheDocument();
  });

  it('renders notifications list and unread count badge when isOpen is true', async () => {
    feedApi.fetchFeedNotifications.mockResolvedValueOnce({
      notifications: mockNotifications,
      unread_count: 1,
      total: 2,
    });

    render(<FeedNotificationsModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(screen.getByText('Carregando notificações...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Nova curtida')).toBeInTheDocument();
      expect(screen.getByText('Carlos Aluno curtiu sua publicação.')).toBeInTheDocument();
      expect(screen.getByText('Mariana comentou: "Excelente trabalho!"')).toBeInTheDocument();
      expect(screen.getByTestId('feed-notif-unread-count')).toHaveTextContent('1 nova');
    });
  });

  it('marks a single notification as read when unread dot button is clicked', async () => {
    feedApi.fetchFeedNotifications.mockResolvedValueOnce({
      notifications: mockNotifications,
      unread_count: 1,
      total: 2,
    });
    feedApi.markFeedNotificationAsRead.mockResolvedValueOnce({ success: true });

    render(<FeedNotificationsModal isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-notif-mark-read-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('feed-notif-mark-read-1'));

    await waitFor(() => {
      expect(feedApi.markFeedNotificationAsRead).toHaveBeenCalledWith(1);
    });
  });

  it('marks all notifications as read when mark all button is clicked', async () => {
    feedApi.fetchFeedNotifications.mockResolvedValueOnce({
      notifications: mockNotifications,
      unread_count: 1,
      total: 2,
    });
    feedApi.markAllFeedNotificationsAsRead.mockResolvedValueOnce({ success: true });

    render(<FeedNotificationsModal isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-notif-mark-all-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('feed-notif-mark-all-btn'));

    await waitFor(() => {
      expect(feedApi.markAllFeedNotificationsAsRead).toHaveBeenCalled();
    });
  });

  it('deletes notification when trash button is clicked', async () => {
    feedApi.fetchFeedNotifications.mockResolvedValueOnce({
      notifications: mockNotifications,
      unread_count: 1,
      total: 2,
    });
    feedApi.deleteFeedNotification.mockResolvedValueOnce(true);

    render(<FeedNotificationsModal isOpen={true} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByTestId('feed-notif-del-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('feed-notif-del-1'));

    await waitFor(() => {
      expect(feedApi.deleteFeedNotification).toHaveBeenCalledWith(1);
      expect(screen.queryByText('Carlos Aluno curtiu sua publicação.')).not.toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    feedApi.fetchFeedNotifications.mockResolvedValueOnce({
      notifications: [],
      unread_count: 0,
      total: 0,
    });
    const onClose = vi.fn();

    render(<FeedNotificationsModal isOpen={true} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('feed-notif-close-btn'));
    expect(onClose).toHaveBeenCalled();
  });
});
