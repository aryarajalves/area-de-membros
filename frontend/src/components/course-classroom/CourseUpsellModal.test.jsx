import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CourseUpsellModal from './CourseUpsellModal';

describe('CourseUpsellModal Component', () => {
  const mockOffer = {
    id: 1,
    progress_pct: 35,
    media_type: 'image',
    media_url: 'https://exemplo.com/banner.jpg',
    title: 'Avanço na Jornada: Módulo Expert',
    description: 'Parabéns pelos 35% concluídos! Veja o próximo passo.',
    button_text: 'Garantir Vaga',
    button_url: 'https://checkout.com/expert'
  };

  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <CourseUpsellModal isOpen={false} offer={mockOffer} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with offer title, milestone badge, image and CTA button', () => {
    render(
      <CourseUpsellModal
        isOpen={true}
        offer={mockOffer}
        targetActionUrl="https://checkout.com/expert"
      />
    );

    expect(screen.getByTestId('course-upsell-modal')).toBeInTheDocument();
    expect(screen.getByText(/35% do curso/i)).toBeInTheDocument();
    expect(screen.getByTestId('upsell-modal-title')).toHaveTextContent('Avanço na Jornada: Módulo Expert');
    expect(screen.getByTestId('upsell-banner-image')).toHaveAttribute('src', 'https://exemplo.com/banner.jpg');
    expect(screen.getByTestId('upsell-cta-btn')).toHaveTextContent('Garantir Vaga');
  });

  it('renders native video when media_type is video', () => {
    const videoOffer = {
      ...mockOffer,
      media_type: 'video',
      media_url: 'https://exemplo.com/video.mp4'
    };

    render(
      <CourseUpsellModal
        isOpen={true}
        offer={videoOffer}
      />
    );

    expect(screen.getByTestId('upsell-native-video')).toHaveAttribute('src', 'https://exemplo.com/video.mp4');
  });

  it('triggers onDismiss when close button or continue studies button is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <CourseUpsellModal
        isOpen={true}
        offer={mockOffer}
        onDismiss={onDismiss}
      />
    );

    fireEvent.click(screen.getByTestId('close-upsell-btn'));
    expect(onDismiss).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('upsell-continue-studies-btn'));
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });

  it('triggers onCtaClick and window.open when CTA is clicked', () => {
    const onCtaClick = vi.fn();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => {});

    render(
      <CourseUpsellModal
        isOpen={true}
        offer={mockOffer}
        targetActionUrl="https://checkout.com/expert"
        onCtaClick={onCtaClick}
      />
    );

    fireEvent.click(screen.getByTestId('upsell-cta-btn'));
    expect(onCtaClick).toHaveBeenCalledWith(mockOffer);
    expect(windowOpenSpy).toHaveBeenCalledWith('https://checkout.com/expert', '_blank', 'noopener,noreferrer');
  });
});
