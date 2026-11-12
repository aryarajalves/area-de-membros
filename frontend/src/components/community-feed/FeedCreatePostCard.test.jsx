import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeedCreatePostCard from './FeedCreatePostCard';
import * as feedApi from './communityFeedApi';

vi.mock('./communityFeedApi', () => ({
  createFeedPost: vi.fn(),
  uploadFeedMedia: vi.fn(),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

describe('FeedCreatePostCard Component', () => {
  const mockUser = { id: 1, name: 'Carlos Aluno', avatar_url: null, role: 'aluno' };
  const mockCourses = [{ id: 10, title: 'Curso de IA' }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders author avatar, name and placeholder', () => {
    render(<FeedCreatePostCard user={mockUser} courses={mockCourses} />);
    expect(screen.getByText('Carlos Aluno')).toBeInTheDocument();
    expect(screen.getByTestId('feed-create-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('feed-submit-post-btn')).toBeInTheDocument();
    expect(screen.getByTestId('feed-course-select')).toBeInTheDocument();
  });

  it('disables submit button when textarea is empty', () => {
    render(<FeedCreatePostCard user={mockUser} courses={mockCourses} />);
    const submitBtn = screen.getByTestId('feed-submit-post-btn');
    expect(submitBtn).toBeDisabled();
  });

  it('enables submit button when user types content and calls createFeedPost', async () => {
    feedApi.createFeedPost.mockResolvedValueOnce({
      id: 99,
      content: 'Minha primeira vitória!',
      user_id: 1,
      likes_count: 0,
      comments_count: 0,
    });

    const onPostCreated = vi.fn();
    render(<FeedCreatePostCard user={mockUser} courses={mockCourses} onPostCreated={onPostCreated} />);

    const textarea = screen.getByTestId('feed-create-textarea');
    fireEvent.change(textarea, { target: { value: 'Minha primeira vitória!' } });

    const submitBtn = screen.getByTestId('feed-submit-post-btn');
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(feedApi.createFeedPost).toHaveBeenCalledWith({
        content: 'Minha primeira vitória!',
        courseId: null,
        mediaUrls: [],
        mediaType: 'none',
        mediaThumbnailUrl: null,
        category: 'geral',
        pollQuestion: null,
        pollOptions: null,
        location: null,
        scheduledAt: null,
      });
      expect(onPostCreated).toHaveBeenCalled();
    });

    expect(textarea.value).toBe('');
  });

  it('renders thumbnail option and tool button when a video is selected', async () => {
    feedApi.uploadFeedMedia.mockResolvedValueOnce({
      url: '/uploads/pitch.mp4',
      media_type: 'video',
    });

    render(<FeedCreatePostCard user={mockUser} courses={mockCourses} />);

    const videoInput = screen.getByTestId('feed-video-file-input');
    const fakeVideoFile = new File(['dummy video'], 'pitch.mp4', { type: 'video/mp4' });
    fireEvent.change(videoInput, { target: { files: [fakeVideoFile] } });

    await waitFor(() => {
      expect(screen.getByTestId('feed-add-thumbnail-btn')).toBeInTheDocument();
      expect(screen.getByTestId('feed-tool-thumbnail-btn')).toBeInTheDocument();
    });
  });
});
