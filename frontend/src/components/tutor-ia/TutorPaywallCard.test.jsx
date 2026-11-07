import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorPaywallCard from './TutorPaywallCard';

describe('TutorPaywallCard Component', () => {
  it('renders paywall card with price and benefits', () => {
    render(
      <TutorPaywallCard
        checkoutUrl="https://pay.hotmart.com/test-tutor"
        monthlyPrice={10.0}
      />
    );

    expect(screen.getByTestId('tutor-paywall-card')).toBeInTheDocument();
    expect(screen.getByText('Desbloqueie o Tutor IA Ilimitado 24h')).toBeInTheDocument();
    expect(screen.getByText(/10,00/)).toBeInTheDocument();
    expect(screen.getByText('Perguntas e dúvidas ilimitadas em todas as aulas')).toBeInTheDocument();
  });

  it('opens checkout url in new tab when clicking subscribe button', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});

    render(
      <TutorPaywallCard
        checkoutUrl="https://pay.hotmart.com/test-tutor"
        monthlyPrice={10.0}
      />
    );

    const subscribeBtn = screen.getByTestId('btn-tutor-paywall-subscribe');
    fireEvent.click(subscribeBtn);

    expect(openSpy).toHaveBeenCalledWith('https://pay.hotmart.com/test-tutor', '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });
});
