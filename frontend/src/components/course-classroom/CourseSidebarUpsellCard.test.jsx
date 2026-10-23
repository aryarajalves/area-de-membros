import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseSidebarUpsellCard from './CourseSidebarUpsellCard';
import * as api from '../course-management/courseUpsellApi';

describe('CourseSidebarUpsellCard Component', () => {
  const mockOffer = {
    id: 42,
    title: 'Formação Avançada de Previsões',
    description: 'Aprenda técnicas práticas para atender clientes.',
    media_type: 'image',
    media_url: 'https://exemplo.com/sidebar-banner.png',
    button_text: 'Quero o Próximo Nível',
    button_url: 'https://checkout.com/curso-avancado',
    target_action_url: 'https://checkout.com/curso-avancado'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('open', vi.fn());
  });

  it('returns null when no offer is provided', () => {
    const { container } = render(<CourseSidebarUpsellCard offer={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders offer title, badge, description and image', () => {
    render(<CourseSidebarUpsellCard offer={mockOffer} courseId={10} />);

    expect(screen.getByTestId('sidebar-upsell-card')).toBeInTheDocument();
    expect(screen.getByText('Próximo Passo na Jornada')).toBeInTheDocument();
    expect(screen.getByText('Formação Avançada de Previsões')).toBeInTheDocument();
    expect(screen.getByText('Aprenda técnicas práticas para atender clientes.')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-upsell-image')).toHaveAttribute('src', mockOffer.media_url);
    expect(screen.getByText('Quero o Próximo Nível')).toBeInTheDocument();
  });

  it('calls click API and opens target URL when action button is clicked', async () => {
    const clickSpy = vi.spyOn(api, 'clickUpsellOffer').mockResolvedValue({ message: 'ok' });
    const onOfferClick = vi.fn();

    render(
      <CourseSidebarUpsellCard
        offer={mockOffer}
        courseId={10}
        onOfferClick={onOfferClick}
      />
    );

    const btn = screen.getByTestId('sidebar-upsell-action-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalledWith(42);
      expect(onOfferClick).toHaveBeenCalledWith(mockOffer);
      expect(window.open).toHaveBeenCalledWith(
        'https://checkout.com/curso-avancado',
        '_blank',
        'noopener,noreferrer'
      );
    });
  });
});
