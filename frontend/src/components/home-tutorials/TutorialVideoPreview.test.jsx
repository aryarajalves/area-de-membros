import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TutorialVideoPreview from './TutorialVideoPreview';

describe('TutorialVideoPreview Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/mock-video-blob');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders nothing if no file and no video url are provided', () => {
    const { container } = render(
      <TutorialVideoPreview selectedFile={null} videoUrl="" videoType="upload" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders native video player with blob URL when a file is selected', () => {
    const mockFile = new File(['mock content'], 'aula_tutorial.mp4', { type: 'video/mp4' });

    render(
      <TutorialVideoPreview selectedFile={mockFile} videoUrl="" videoType="upload" />
    );

    expect(screen.getByTestId('tutorial-video-preview-container')).toBeInTheDocument();
    expect(screen.getByText('Renderização do Vídeo')).toBeInTheDocument();

    const videoElement = screen.getByTestId('tutorial-video-preview-player');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute('src', 'blob:http://localhost/mock-video-blob');
  });

  it('renders iframe when a YouTube URL is provided in URL mode', () => {
    render(
      <TutorialVideoPreview
        selectedFile={null}
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        videoType="url"
      />
    );

    const iframe = screen.getByTestId('tutorial-video-preview-iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0');
  });

  it('renders native video player for direct video url', () => {
    render(
      <TutorialVideoPreview
        selectedFile={null}
        videoUrl="https://bucket.backblazeb2.com/video.mp4"
        videoType="upload"
      />
    );

    const videoElement = screen.getByTestId('tutorial-video-preview-player');
    expect(videoElement).toBeInTheDocument();
    expect(videoElement).toHaveAttribute('src', 'https://bucket.backblazeb2.com/video.mp4');
  });
});
