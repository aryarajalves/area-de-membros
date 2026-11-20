import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventAttendeesModal from './EventAttendeesModal';

const buildAttendees = (count) =>
  Array.from({ length: count }, (_, idx) => ({
    user_id: idx + 1,
    name: `Participante ${idx + 1}`,
    email: `part${idx + 1}@teste.com`,
    phone: `+55 11 99999-000${idx + 1}`,
    role: 'aluno',
    confirmed_at: '2026-11-19T18:56:00Z',
  }));

describe('EventAttendeesModal - Paginação', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'mock-token');
  });

  it('exibe 5 participantes por página, permite avançar/voltar e reseta página ao buscar', async () => {
    const attendees = buildAttendees(7);
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => attendees,
    });

    render(
      <EventAttendeesModal
        isOpen={true}
        event={{ id: 10, title: 'O fim de 2026' }}
        onClose={vi.fn()}
        addToast={vi.fn()}
      />
    );

    expect(await screen.findByText('Participante 1')).toBeInTheDocument();
    expect(screen.getByText('Participante 5')).toBeInTheDocument();
    expect(screen.queryByText('Participante 6')).not.toBeInTheDocument();

    expect(screen.getByTestId('attendees-pagination')).toBeInTheDocument();
    expect(screen.getByTestId('attendees-page-indicator')).toHaveTextContent('Página 1 de 2');
    expect(screen.getByTestId('attendees-prev-page-btn')).toBeDisabled();
    expect(screen.getByTestId('attendees-next-page-btn')).not.toBeDisabled();

    // Avança para página 2
    fireEvent.click(screen.getByTestId('attendees-next-page-btn'));
    expect(screen.getByText('Participante 6')).toBeInTheDocument();
    expect(screen.getByText('Participante 7')).toBeInTheDocument();
    expect(screen.queryByText('Participante 1')).not.toBeInTheDocument();
    expect(screen.getByTestId('attendees-page-indicator')).toHaveTextContent('Página 2 de 2');
    expect(screen.getByTestId('attendees-next-page-btn')).toBeDisabled();

    // Volta para página 1
    fireEvent.click(screen.getByTestId('attendees-prev-page-btn'));
    expect(screen.getByText('Participante 1')).toBeInTheDocument();

    // Vai para página 2 e realiza busca -> deve resetar para página 1 e ocultar paginação se <= 5
    fireEvent.click(screen.getByTestId('attendees-next-page-btn'));
    fireEvent.change(screen.getByTestId('search-event-attendees-input'), {
      target: { value: 'Participante 2' },
    });

    await waitFor(() => {
      expect(screen.getByText('Participante 2')).toBeInTheDocument();
      expect(screen.getByTestId('attendees-page-indicator')).toHaveTextContent('Página 1 de 1');
    });
  });

  it('exibe paginação (Página 1 de 1 com botões desabilitados) quando há até 5 participantes e evita sobreposição no mobile', async () => {
    const attendees = buildAttendees(5);
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => attendees,
    });

    render(
      <EventAttendeesModal
        isOpen={true}
        event={{ id: 10, title: 'O fim de 2026' }}
        onClose={vi.fn()}
        addToast={vi.fn()}
      />
    );

    expect(await screen.findByText('Participante 5')).toBeInTheDocument();
    expect(screen.getByTestId('attendees-pagination')).toBeInTheDocument();
    expect(screen.getByTestId('attendees-page-indicator')).toHaveTextContent('Página 1 de 1');
    expect(screen.getByTestId('attendees-prev-page-btn')).toBeDisabled();
    expect(screen.getByTestId('attendees-next-page-btn')).toBeDisabled();
    expect(screen.getByTestId('event-attendee-item-1')).toHaveStyle({ flexWrap: 'wrap' });
  });
});
