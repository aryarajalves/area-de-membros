import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EventsManagement from './EventsManagement';
import EventCard from './EventCard';
import DeleteEventConfirmModal from './DeleteEventConfirmModal';
import ConfirmAttendanceModal from './ConfirmAttendanceModal';
import { generateGoogleCalendarUrl, getEventStatus, formatBrasiliaDate } from './googleCalendarHelper';

describe('Google Calendar Helper', () => {
  it('gera URL correta para o Google Agenda com action=TEMPLATE e datas formatadas em UTC', () => {
    const url = generateGoogleCalendarUrl({
      title: 'Mentoria Exclusiva',
      description: 'Aula ao vivo de tira-dúvidas',
      startTime: '2026-11-10T23:00:00.000Z',
      endTime: '2026-11-11T01:00:00.000Z',
      meetingUrl: 'https://meet.google.com/xyz-123',
    });

    expect(url).toContain('https://calendar.google.com/calendar/render');
    expect(url).toContain('action=TEMPLATE');
    expect(url).toContain('Mentoria+Exclusiva');
    expect(url).toContain('20261110T230000Z%2F20261111T010000Z');
    expect(url).toContain('https%3A%2F%2Fmeet.google.com%2Fxyz-123');
  });

  it('determina corretamente status de evento futuro, ao vivo ou encerrado', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(getEventStatus(future)).toBe('upcoming');

    const past = new Date(Date.now() - 86400000).toISOString();
    const pastEnd = new Date(Date.now() - 80000000).toISOString();
    expect(getEventStatus(past, pastEnd)).toBe('past');
  });
});

describe('DeleteEventConfirmModal Component', () => {
  it('não renderiza se isOpen for false', () => {
    render(<DeleteEventConfirmModal isOpen={false} eventTitle="Live" />);
    expect(screen.queryByText('Excluir Evento')).not.toBeInTheDocument();
  });

  it('renderiza título, aviso e botões de confirmação quando aberto', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <DeleteEventConfirmModal
        isOpen={true}
        eventTitle="Mentoria VIP"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByText('Excluir Evento')).toBeInTheDocument();
    expect(screen.getByText(/"Mentoria VIP"/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cancel-delete-event-btn'));
    expect(onCancel).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('confirm-delete-event-btn'));
    expect(onConfirm).toHaveBeenCalled();
  });
});

describe('ConfirmAttendanceModal Component', () => {
  const mockEvent = {
    id: 1,
    title: 'Aula Especial de Escala',
    start_time: '2026-10-28T18:00:00.000Z',
  };

  it('não renderiza quando isOpen é false', () => {
    render(<ConfirmAttendanceModal isOpen={false} event={mockEvent} />);
    expect(screen.queryByTestId('confirm-attendance-modal')).not.toBeInTheDocument();
  });

  it('renderiza textos de confirmação de presença quando isConfirmed é false', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    render(
      <ConfirmAttendanceModal
        isOpen={true}
        event={mockEvent}
        isConfirmed={false}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByTestId('confirm-attendance-modal')).toBeInTheDocument();
    expect(screen.getByText('Confirmar Presença no Evento')).toBeInTheDocument();
    expect(screen.getByText('Aula Especial de Escala')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-attendance-modal-btn')).toHaveTextContent('Sim, Confirmar Presença');
    expect(screen.getByTestId('cancel-attendance-modal-btn')).toHaveTextContent('Voltar');

    fireEvent.click(screen.getByTestId('cancel-attendance-modal-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('confirm-attendance-modal-btn'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renderiza textos de cancelamento de presença quando isConfirmed é true', () => {
    render(
      <ConfirmAttendanceModal
        isOpen={true}
        event={mockEvent}
        isConfirmed={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Cancelar Presença no Evento')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-attendance-modal-btn')).toHaveTextContent('Sim, Cancelar');
    expect(screen.getByTestId('cancel-attendance-modal-btn')).toHaveTextContent('Manter Inscrição');
  });
});

describe('EventCard Component', () => {
  const baseEvent = {
    id: 1,
    title: 'Mentoria de Tráfego',
    description: 'Aprenda escala no Meta Ads',
    start_time: new Date(Date.now() + 86400000).toISOString(),
    meeting_url: 'https://zoom.us/j/12345',
    target_type: 'all',
    has_access: true,
  };

  it('renderiza título, data e botão de transmissão para usuário com acesso', () => {
    render(<EventCard event={baseEvent} isAdmin={false} />);
    expect(screen.getByText('Mentoria de Tráfego')).toBeInTheDocument();
    expect(screen.getByText('Aprenda escala no Meta Ads')).toBeInTheDocument();
    expect(screen.getByTestId('join-meeting-btn-1')).toBeInTheDocument();
    expect(screen.getByTestId('add-calendar-btn-1')).toBeInTheDocument();
  });

  it('exibe bloqueio e botão de upsell quando has_access é false', () => {
    const restrictedEvent = {
      ...baseEvent,
      id: 2,
      target_type: 'course',
      course_title: 'Curso Avançado',
      has_access: false,
      meeting_url: null,
    };
    const handleUnlock = vi.fn();
    render(<EventCard event={restrictedEvent} isAdmin={false} onUnlockCourse={handleUnlock} />);

    expect(screen.getByText('Conteúdo fechado para o seu plano atual')).toBeInTheDocument();
    expect(screen.getByTestId('unlock-course-btn-2')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('unlock-course-btn-2'));
    expect(handleUnlock).toHaveBeenCalled();
  });

  it('exibe botões de editar e excluir se for admin', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<EventCard event={baseEvent} isAdmin={true} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByTestId('edit-event-btn-1')).toBeInTheDocument();
    expect(screen.getByTestId('delete-event-btn-1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('edit-event-btn-1'));
    expect(onEdit).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('delete-event-btn-1'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('abre o popup no centro da tela ao apertar em confirmar e conclui confirmação após confirmação no modal', async () => {
    const addToast = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        event_id: 1,
        is_confirmed: true,
        attendees_count: 6,
        message: 'Presença confirmada no evento!',
      }),
    }));

    render(
      <EventCard
        event={{ ...baseEvent, is_confirmed: false, attendees_count: 5 }}
        isAdmin={false}
        addToast={addToast}
      />
    );

    const cardBtn = screen.getByTestId('confirm-attendance-btn-1');
    expect(cardBtn).toHaveTextContent(/Confirmar Participação no Evento/i);

    // Modal inicialmente fechado
    expect(screen.queryByTestId('confirm-attendance-modal')).not.toBeInTheDocument();

    // Clica no botão do card -> Abre o popup no centro da tela
    fireEvent.click(cardBtn);
    expect(screen.getByTestId('confirm-attendance-modal')).toBeInTheDocument();
    expect(screen.getByText('Confirmar Presença no Evento')).toBeInTheDocument();

    // Clica em confirmar dentro do modal
    const modalConfirmBtn = screen.getByTestId('confirm-attendance-modal-btn');
    fireEvent.click(modalConfirmBtn);

    await waitFor(() => {
      // Modal fecha
      expect(screen.queryByTestId('confirm-attendance-modal')).not.toBeInTheDocument();
      // Card atualizado
      expect(cardBtn).toHaveTextContent(/Presença Confirmada ✓/i);
      expect(addToast).toHaveBeenCalledWith('Presença confirmada no evento!', 'success');
    });
  });

  it('permite cancelar fechando o modal sem confirmar', () => {
    render(
      <EventCard
        event={{ ...baseEvent, is_confirmed: false, attendees_count: 5 }}
        isAdmin={false}
      />
    );

    const cardBtn = screen.getByTestId('confirm-attendance-btn-1');
    fireEvent.click(cardBtn);
    expect(screen.getByTestId('confirm-attendance-modal')).toBeInTheDocument();

    // Clica em Voltar no modal
    fireEvent.click(screen.getByTestId('cancel-attendance-modal-btn'));
    expect(screen.queryByTestId('confirm-attendance-modal')).not.toBeInTheDocument();
  });
});

describe('EventsManagement Component', () => {
  beforeEach(() => {
    localStorage.setItem('auth_token', 'fake-token-123');
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/events')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            {
              id: 10,
              title: 'Live Semanal da Comunidade',
              description: 'Tire dúvidas direto com o professor',
              start_time: new Date(Date.now() + 3600000).toISOString(),
              target_type: 'all',
              has_access: true,
            },
          ]),
        });
      }
      if (url.includes('/api/v1/courses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ id: 1, title: 'Curso de Lançamento' }]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));
  });

  it('renderiza título da página, filtros e botão de novo evento para admin', async () => {
    const adminUser = { id: 1, name: 'Admin', role: 'admin' };
    render(<EventsManagement currentUser={adminUser} />);

    expect(screen.getByText('Eventos & Aulas Ao Vivo')).toBeInTheDocument();
    expect(screen.getByTestId('create-event-btn')).toBeInTheDocument();
    expect(screen.getByTestId('filter-upcoming-btn')).toBeInTheDocument();
    expect(screen.getByTestId('filter-past-btn')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Live Semanal da Comunidade')).toBeInTheDocument();
    });
  });

  it('não exibe botão de novo evento para perfil aluno', async () => {
    const alunoUser = { id: 2, name: 'Aluno', role: 'aluno' };
    render(<EventsManagement currentUser={alunoUser} />);

    expect(screen.getByText('Eventos & Aulas Ao Vivo')).toBeInTheDocument();
    expect(screen.queryByTestId('create-event-btn')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Live Semanal da Comunidade')).toBeInTheDocument();
    });
  });
});
