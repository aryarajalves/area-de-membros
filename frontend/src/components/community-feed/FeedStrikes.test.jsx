import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeedStrikesBanner from './FeedStrikesBanner';
import FeedBannedCard from './FeedBannedCard';
import FeedUserStrikesModal from './FeedUserStrikesModal';
import * as strikesApi from './communityStrikesApi';

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

vi.mock('./communityStrikesApi', () => ({
  appealStrike: vi.fn(),
  fetchMyStrikesStatus: vi.fn(),
}));

describe('Sistema de 3 Strikes, Banimento Automático e Recursos (Frontend)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('não renderiza o FeedStrikesBanner quando strikes_count é 0', () => {
    const { container } = render(
      <FeedStrikesBanner
        strikesStatus={{ strikes_count: 0, is_banned: false, strikes: [] }}
        onOpenStrikesModal={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza alerta de 1/3 strikes e dispara modal ao clicar em Ver Strikes e Recorrer', () => {
    const onOpenStrikesModal = vi.fn();
    render(
      <FeedStrikesBanner
        strikesStatus={{
          strikes_count: 1,
          is_banned: false,
          strikes: [{ id: 10, strike_number: 1, reason: 'Linguagem ofensiva' }],
        }}
        onOpenStrikesModal={onOpenStrikesModal}
      />
    );

    expect(screen.getByTestId('feed-strikes-banner')).toBeInTheDocument();
    expect(screen.getByText(/1\/3 Strikes/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('feed-strikes-banner-btn'));
    expect(onOpenStrikesModal).toHaveBeenCalledTimes(1);
  });

  it('renderiza estado de conta banida quando is_banned é true (3/3 strikes)', () => {
    render(
      <FeedStrikesBanner
        strikesStatus={{
          strikes_count: 3,
          is_banned: true,
          strikes: [],
        }}
        onOpenStrikesModal={vi.fn()}
      />
    );

    expect(screen.getByText(/Conta Banida do Feed da Comunidade \(3\/3 strikes\)/i)).toBeInTheDocument();
  });

  it('renderiza FeedBannedCard bloqueando novas postagens e permitindo abrir modal de recurso', () => {
    const onOpenAppeal = vi.fn();
    render(<FeedBannedCard onOpenStrikesModal={onOpenAppeal} />);

    expect(screen.getByTestId('feed-banned-card')).toBeInTheDocument();
    expect(screen.getByText(/Você foi banido do Feed da Comunidade/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('feed-banned-appeal-btn'));
    expect(onOpenAppeal).toHaveBeenCalledTimes(1);
  });

  it('permite ao aluno enviar recurso (appeal) no FeedUserStrikesModal', async () => {
    strikesApi.appealStrike.mockResolvedValueOnce({
      id: 77,
      strike_number: 1,
      appeal_status: 'pending',
    });

    const onStrikeAppealed = vi.fn();
    render(
      <FeedUserStrikesModal
        isOpen={true}
        onClose={vi.fn()}
        onStrikeAppealed={onStrikeAppealed}
        strikesStatus={{
          strikes_count: 1,
          is_banned: false,
          strikes: [
            {
              id: 77,
              strike_number: 1,
              reason: 'Política e Polêmicas',
              description: 'Postagem sobre política partidária.',
              appeal_status: 'none',
              created_at: '2026-11-11T15:00:00Z',
            },
          ],
        }}
      />
    );

    expect(screen.getByTestId('feed-user-strikes-modal')).toBeInTheDocument();
    expect(screen.getByText(/Política e Polêmicas/i)).toBeInTheDocument();

    // Clica em Recorrer deste Strike
    fireEvent.click(screen.getByTestId('feed-strike-appeal-btn-77'));

    const textarea = screen.getByTestId('feed-appeal-textarea-77');
    fireEvent.change(textarea, {
      target: { value: 'Não tive intenção de gerar polêmica política, foi apenas um exemplo econômico.' },
    });

    fireEvent.click(screen.getByTestId('feed-appeal-submit-btn-77'));

    await waitFor(() => {
      expect(strikesApi.appealStrike).toHaveBeenCalledWith(
        77,
        'Não tive intenção de gerar polêmica política, foi apenas um exemplo econômico.'
      );
      expect(onStrikeAppealed).toHaveBeenCalledTimes(1);
    });
  });
});
