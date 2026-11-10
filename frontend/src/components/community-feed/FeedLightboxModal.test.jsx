import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedLightboxModal from './FeedLightboxModal';

describe('FeedLightboxModal Component', () => {
  const mockImages = ['/uploads/photo1.jpg', '/uploads/photo2.jpg'];

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <FeedLightboxModal isOpen={false} mediaUrls={mockImages} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders image, counter, and navigation arrows when isOpen is true', () => {
    render(
      <FeedLightboxModal isOpen={true} mediaUrls={mockImages} initialIndex={0} />
    );

    expect(screen.getByTestId('feed-lightbox-modal')).toBeInTheDocument();
    expect(screen.getByTestId('feed-lightbox-image')).toHaveAttribute('src', '/uploads/photo1.jpg');
    expect(screen.getByTestId('feed-lightbox-counter')).toHaveTextContent('1 / 2');
  });

  it('navigates to next image on next button click', () => {
    render(
      <FeedLightboxModal isOpen={true} mediaUrls={mockImages} initialIndex={0} />
    );

    const nextBtn = screen.getByTestId('feed-lightbox-next-btn');
    fireEvent.click(nextBtn);

    expect(screen.getByTestId('feed-lightbox-counter')).toHaveTextContent('2 / 2');
    expect(screen.getByTestId('feed-lightbox-image')).toHaveAttribute('src', '/uploads/photo2.jpg');
  });

  it('renders video element when mediaType is video', () => {
    render(
      <FeedLightboxModal
        isOpen={true}
        mediaUrls={['/uploads/clip.mp4']}
        mediaType="video"
      />
    );

    expect(screen.getByTestId('feed-lightbox-video')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <FeedLightboxModal isOpen={true} mediaUrls={mockImages} onClose={onClose} />
    );

    const closeBtn = screen.getByTestId('feed-lightbox-close-btn');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
