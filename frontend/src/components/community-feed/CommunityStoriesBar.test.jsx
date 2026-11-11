import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommunityStoriesBar from './CommunityStoriesBar';
import * as storiesApi from './communityStoriesApi';

vi.mock('./communityStoriesApi', () => ({
  fetchStoriesTray: vi.fn(),
  fetchUserStories: vi.fn(),
  createStory: vi.fn(),
  deleteStory: vi.fn(),
  recordStoryView: vi.fn(() => Promise.resolve({ viewed: true })),
  reactToStory: vi.fn(),
  fetchStoryViews: vi.fn(),
  replyToStory: vi.fn(),
  uploadStoryMedia: vi.fn(),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

describe('CommunityStoriesBar Component', () => {
  const mockCurrentUser = {
    id: 1,
    name: 'Aryaraj Alves',
    avatar_url: null,
    role: 'superadmin',
  };

  const mockTray = [
    {
      user_id: 1,
      name: 'Aryaraj Alves',
      avatar_url: null,
      role: 'superadmin',
      has_unviewed: false,
      stories_count: 0,
      latest_story_created_at: new Date().toISOString(),
      is_me: true,
    },
    {
      user_id: 2,
      name: 'Carlos Dev',
      avatar_url: null,
      role: 'aluno',
      has_unviewed: true,
      stories_count: 2,
      latest_story_created_at: new Date().toISOString(),
      is_me: false,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders story bar container and "Seu Story" button', async () => {
    storiesApi.fetchStoriesTray.mockResolvedValueOnce(mockTray);

    render(<CommunityStoriesBar currentUser={mockCurrentUser} />);

    expect(screen.getByTestId('community-stories-bar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('story-circle-me')).toBeInTheDocument();
      expect(screen.getByText('Seu Story')).toBeInTheDocument();
      expect(screen.getByTestId('story-circle-2')).toBeInTheDocument();
      expect(screen.getByText('Carlos')).toBeInTheDocument();
    });
  });

  it('opens StoryCreateModal when clicking on the plus badge', async () => {
    storiesApi.fetchStoriesTray.mockResolvedValueOnce(mockTray);

    render(<CommunityStoriesBar currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getByTestId('story-plus-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('story-plus-btn'));

    expect(screen.getByTestId('story-create-modal')).toBeInTheDocument();
    expect(screen.getByText('Criar Story')).toBeInTheDocument();
  });

  it('opens StoryViewerModal when clicking on another member story circle', async () => {
    storiesApi.fetchStoriesTray.mockResolvedValueOnce(mockTray);
    storiesApi.fetchUserStories.mockResolvedValueOnce([
      {
        id: 10,
        user_id: 2,
        user_name: 'Carlos Dev',
        media_url: 'https://exemplo.com/story.jpg',
        media_type: 'image',
        caption: 'Story de teste',
        created_at: new Date().toISOString(),
        expires_at: new Date().toISOString(),
        views_count: 1,
        is_owner: false,
      },
    ]);

    render(<CommunityStoriesBar currentUser={mockCurrentUser} />);

    await waitFor(() => {
      expect(screen.getByTestId('story-circle-2')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('story-circle-2'));

    await waitFor(() => {
      expect(screen.getByTestId('story-viewer-modal')).toBeInTheDocument();
    });
  });
});
