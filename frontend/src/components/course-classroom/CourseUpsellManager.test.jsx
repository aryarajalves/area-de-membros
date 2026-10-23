import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseUpsellManager from './CourseUpsellManager';
import * as api from '../course-management/courseUpsellApi';

describe('CourseUpsellManager Component', () => {
  const mockOffer = {
    id: 99,
    progress_pct: 35,
    media_type: 'image',
    media_url: 'https://exemplo.com/upsell.png',
    title: 'Desconto Especial no Módulo 2',
    description: 'Você bateu 35% de progresso!',
    button_text: 'Aproveitar Oferta',
    button_url: 'https://checkout.com/cupom'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not check when progressPct is 0', () => {
    const checkSpy = vi.spyOn(api, 'checkEligibleUpsell');
    render(<CourseUpsellManager courseId={1} completedCount={0} totalCount={10} />);
    expect(checkSpy).not.toHaveBeenCalled();
  });

  it('checks eligible offer when progressPct > 0 and displays modal if offer found', async () => {
    vi.spyOn(api, 'checkEligibleUpsell').mockResolvedValue({
      has_offer: true,
      offer: mockOffer,
      target_action_url: 'https://checkout.com/cupom'
    });

    render(<CourseUpsellManager courseId={1} completedCount={4} totalCount={10} />);

    await waitFor(() => {
      expect(screen.getByTestId('course-upsell-modal')).toBeInTheDocument();
    });

    expect(screen.getByText('Desconto Especial no Módulo 2')).toBeInTheDocument();
  });

  it('calls dismiss API when user closes the modal', async () => {
    vi.spyOn(api, 'checkEligibleUpsell').mockResolvedValue({
      has_offer: true,
      offer: mockOffer,
      target_action_url: 'https://checkout.com/cupom'
    });
    const dismissSpy = vi.spyOn(api, 'dismissUpsellOffer').mockResolvedValue(true);

    render(<CourseUpsellManager courseId={1} completedCount={4} totalCount={10} />);

    await waitFor(() => {
      expect(screen.getByTestId('close-upsell-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('close-upsell-btn'));

    await waitFor(() => {
      expect(dismissSpy).toHaveBeenCalledWith(99);
      expect(screen.queryByTestId('course-upsell-modal')).not.toBeInTheDocument();
    });
  });
});
