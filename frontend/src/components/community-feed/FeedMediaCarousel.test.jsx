import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedMediaCarousel from './FeedMediaCarousel';

describe('FeedMediaCarousel Component', () => {
  const mockImages = [
    '/uploads/slide1.jpg',
    '/uploads/slide2.jpg',
    '/uploads/slide3.jpg',
  ];

  it('renders carousel with first image, counter badge, and dots', () => {
    render(<FeedMediaCarousel mediaUrls={mockImages} />);

    expect(screen.getByTestId('feed-carousel-counter')).toHaveTextContent('1 / 3');
    expect(screen.getByTestId('feed-carousel-dots')).toBeInTheDocument();
    expect(screen.getByTestId('feed-carousel-prev-btn')).toBeInTheDocument();
    expect(screen.getByTestId('feed-carousel-next-btn')).toBeInTheDocument();

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/uploads/slide1.jpg');
  });

  it('advances to next slide when next arrow is clicked', () => {
    render(<FeedMediaCarousel mediaUrls={mockImages} />);

    const nextBtn = screen.getByTestId('feed-carousel-next-btn');
    fireEvent.click(nextBtn);

    expect(screen.getByTestId('feed-carousel-counter')).toHaveTextContent('2 / 3');
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/uploads/slide2.jpg');
  });

  it('jumps to specific slide when dot is clicked', () => {
    render(<FeedMediaCarousel mediaUrls={mockImages} />);

    const dot3 = screen.getByTestId('feed-carousel-dot-2');
    fireEvent.click(dot3);

    expect(screen.getByTestId('feed-carousel-counter')).toHaveTextContent('3 / 3');
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/uploads/slide3.jpg');
  });

  it('calls onOpenLightbox when zoom button or container is clicked', () => {
    const onOpenLightbox = vi.fn();
    render(<FeedMediaCarousel mediaUrls={mockImages} onOpenLightbox={onOpenLightbox} />);

    const zoomBtn = screen.getByTestId('feed-carousel-zoom-btn');
    fireEvent.click(zoomBtn);

    expect(onOpenLightbox).toHaveBeenCalledWith(0);
  });
});
