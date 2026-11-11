import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StoryViewerModal from './StoryViewerModal';
import * as storiesApi from './communityStoriesApi';

vi.mock('./communityStoriesApi', () => ({
  fetchUserStories: vi.fn(),
  recordStoryView: vi.fn(() => Promise.resolve({ viewed: true })),
  reactToStory: vi.fn(() => Promise.resolve({ reaction: 'fire' })),
  replyToStory: vi.fn(() => Promise.resolve({ sent: true })),
  deleteStory: vi.fn(() => Promise.resolve({ message: 'ok' })),
  fetchStoryViews: vi.fn(() => Promise.resolve([])),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

describe('StoryViewerModal Component', () => {
  const mockStories = [
    {
      id: 50,
      user_id: 10,
      user_name: 'Beatriz Silva',
      user_avatar_url: null,
      user_role: 'aluno',
      media_url: 'https://exemplo.com/story1.jpg',
      media_type: 'image',
      caption: 'Primeiro dia de estudos!',
      duration_seconds: 5,
      created_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
      views_count: 3,
      is_owner: false,
      my_reaction: null,
    },
    {
      id: 51,
      user_id: 10,
      user_name: 'Beatriz Silva',
      user_avatar_url: null,
      user_role: 'aluno',
      media_url: 'https://exemplo.com/story2.jpg',
      media_type: 'image',
      caption: 'Segundo story!',
      duration_seconds: 5,
      created_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
      views_count: 5,
      is_owner: false,
      my_reaction: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<StoryViewerModal isOpen={false} targetUserId={10} onClose={() => {}} />);
    expect(screen.queryByTestId('story-viewer-modal')).not.toBeInTheDocument();
  });

  it('renders story media, caption, progress bars, and header', async () => {
    storiesApi.fetchUserStories.mockResolvedValueOnce(mockStories);
    storiesApi.recordStoryView.mockResolvedValueOnce({ viewed: true });

    render(<StoryViewerModal isOpen={true} targetUserId={10} onClose={() => {}} currentUser={{ id: 99, role: 'aluno' }} />);

    await waitFor(() => {
      expect(screen.getByTestId('story-viewer-modal')).toBeInTheDocument();
      expect(screen.getByText('Beatriz Silva')).toBeInTheDocument();
      expect(screen.getByTestId('story-caption')).toHaveTextContent('Primeiro dia de estudos!');
      expect(screen.getByTestId('story-progress-bars')).toBeInTheDocument();
      expect(screen.getByTestId('story-media-container')).toBeInTheDocument();
      expect(screen.getByTestId('story-reply-input')).toBeInTheDocument();
      expect(screen.getByTestId('story-react-fire')).toBeInTheDocument();
    });
  });

  it('handles emoji reaction click', async () => {
    storiesApi.fetchUserStories.mockResolvedValueOnce(mockStories);
    storiesApi.reactToStory.mockResolvedValueOnce({ reaction: 'fire' });

    render(<StoryViewerModal isOpen={true} targetUserId={10} onClose={() => {}} currentUser={{ id: 99, role: 'aluno' }} />);

    await waitFor(() => {
      expect(screen.getByTestId('story-react-fire')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('story-react-fire'));

    await waitFor(() => {
      expect(storiesApi.reactToStory).toHaveBeenCalledWith(50, 'fire');
    });
  });

  it('handles sending DM reply to story author', async () => {
    storiesApi.fetchUserStories.mockResolvedValueOnce(mockStories);
    storiesApi.replyToStory.mockResolvedValueOnce({ sent: true });

    render(<StoryViewerModal isOpen={true} targetUserId={10} onClose={() => {}} currentUser={{ id: 99, role: 'aluno' }} />);

    await waitFor(() => {
      expect(screen.getByTestId('story-reply-input')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('story-reply-input'), {
      target: { value: 'Parabéns pela dedicação!' },
    });

    fireEvent.click(screen.getByTestId('story-reply-send-btn'));

    await waitFor(() => {
      expect(storiesApi.replyToStory).toHaveBeenCalledWith(50, 'Parabéns pela dedicação!');
    });
  });

  it('navigates to next story when clicking right tap area', async () => {
    storiesApi.fetchUserStories.mockResolvedValueOnce(mockStories);

    render(<StoryViewerModal isOpen={true} targetUserId={10} onClose={() => {}} currentUser={{ id: 99, role: 'aluno' }} />);

    await waitFor(() => {
      expect(screen.getByTestId('story-caption')).toHaveTextContent('Primeiro dia de estudos!');
    });

    fireEvent.click(screen.getByTestId('story-tap-next'));

    await waitFor(() => {
      expect(screen.getByTestId('story-caption')).toHaveTextContent('Segundo story!');
    });
  });
});
