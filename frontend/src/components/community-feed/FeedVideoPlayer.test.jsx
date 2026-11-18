import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedVideoPlayer from './FeedVideoPlayer';

describe('FeedVideoPlayer Component', () => {
  it('renders video element with src and poster thumbnail', () => {
    render(
      <FeedVideoPlayer
        videoUrl="/uploads/demo.mp4"
        thumbnailUrl="/uploads/demo_thumb.jpg"
      />
    );

    const video = screen.getByTestId('feed-video-element');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', '/uploads/demo.mp4');
    expect(video).toHaveAttribute('poster', '/uploads/demo_thumb.jpg');
  });

  it('calls onOpenLightbox when zoom button is clicked', () => {
    const onOpenLightbox = vi.fn();
    render(
      <FeedVideoPlayer
        videoUrl="/uploads/demo.mp4"
        onOpenLightbox={onOpenLightbox}
      />
    );

    const zoomBtn = screen.getByTestId('feed-video-zoom-btn');
    fireEvent.click(zoomBtn);
    expect(onOpenLightbox).toHaveBeenCalledWith(0);
  });

  it('appends #t=0.1 preview fragment and playsInline when thumbnailUrl is absent', () => {
    render(<FeedVideoPlayer videoUrl="/api/v1/community/feed/media/clip.mp4" />);

    const video = screen.getByTestId('feed-video-element');
    expect(video).toHaveAttribute('src', '/api/v1/community/feed/media/clip.mp4#t=0.1');
    expect(video).toHaveAttribute('playsinline');
  });
});
