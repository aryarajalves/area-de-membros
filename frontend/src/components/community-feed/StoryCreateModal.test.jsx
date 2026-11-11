import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StoryCreateModal from './StoryCreateModal';
import * as storiesApi from './communityStoriesApi';

vi.mock('./communityStoriesApi', () => ({
  uploadStoryMedia: vi.fn(),
  createStory: vi.fn(),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

describe('StoryCreateModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-preview');
  });

  it('does not render when isOpen is false', () => {
    render(<StoryCreateModal isOpen={false} onClose={() => {}} />);
    expect(screen.queryByTestId('story-create-modal')).not.toBeInTheDocument();
  });

  it('renders dropzone, caption input and disabled submit button when no file selected', () => {
    render(<StoryCreateModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByTestId('story-create-modal')).toBeInTheDocument();
    expect(screen.getByTestId('story-dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('story-caption-input')).toBeInTheDocument();
    expect(screen.getByTestId('story-submit-btn')).toBeDisabled();
  });

  it('handles image file selection, updates preview, and publishes story', async () => {
    const onStoryCreated = vi.fn();
    const onClose = vi.fn();

    storiesApi.uploadStoryMedia.mockResolvedValueOnce({
      media_url: '/api/v1/community/stories/media/test.png',
      media_type: 'image',
    });

    storiesApi.createStory.mockResolvedValueOnce({
      id: 99,
      media_url: '/api/v1/community/stories/media/test.png',
      media_type: 'image',
      caption: 'Legenda do teste',
    });

    render(<StoryCreateModal isOpen={true} onClose={onClose} onStoryCreated={onStoryCreated} />);

    const file = new File(['fake-image-content'], 'foto_teste.png', { type: 'image/png' });
    const input = screen.getByTestId('story-file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId('story-preview-container')).toBeInTheDocument();
      expect(screen.getByTestId('story-submit-btn')).not.toBeDisabled();
    });

    fireEvent.change(screen.getByTestId('story-caption-input'), {
      target: { value: 'Legenda do teste' },
    });

    fireEvent.click(screen.getByTestId('story-submit-btn'));

    await waitFor(() => {
      expect(storiesApi.uploadStoryMedia).toHaveBeenCalledWith(file);
      expect(storiesApi.createStory).toHaveBeenCalledWith({
        mediaUrl: '/api/v1/community/stories/media/test.png',
        mediaType: 'image',
        caption: 'Legenda do teste',
        durationSeconds: 5,
      });
      expect(onStoryCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });
});
