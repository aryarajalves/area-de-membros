import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../../context/ToastContext';
import ChatBroadcastModal from './ChatBroadcastModal';

const renderWithToast = (ui) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('ChatBroadcastModal Component', () => {
  const mockCourses = [
    { id: 1, title: 'Bússola Astrológica' },
    { id: 2, title: 'Astrowake' },
  ];
  const mockTags = [
    { id: 10, name: 'VIP Mentoria', student_count: 5 },
    { id: 20, name: 'Turma 2026', student_count: 12 },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        total_recipients: 10,
        estimated_duration_seconds: 10,
        delay_seconds: 1,
        sample_students: [],
      }),
    });
  });

  it('renders modal with title, message input, audience options and estimated duration', async () => {
    renderWithToast(
      <ChatBroadcastModal
        isOpen={true}
        onClose={vi.fn()}
        courses={mockCourses}
        tags={mockTags}
        onOpenHistory={vi.fn()}
      />
    );

    expect(screen.getByText('Disparo em Massa de DMs')).toBeInTheDocument();
    expect(screen.getByTestId('broadcast-title-input')).toBeInTheDocument();
    expect(screen.getByTestId('broadcast-message-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('filter-type-all-btn')).toBeInTheDocument();
    expect(screen.getByTestId('filter-type-course-btn')).toBeInTheDocument();
    expect(screen.getByTestId('filter-type-tag-btn')).toBeInTheDocument();
    expect(screen.getByTestId('broadcast-estimate-card')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/10 alunos/i)).toBeInTheDocument();
    });
  });

  it('switches to course filter and shows course select dropdown', async () => {
    renderWithToast(
      <ChatBroadcastModal
        isOpen={true}
        onClose={vi.fn()}
        courses={mockCourses}
        tags={mockTags}
        onOpenHistory={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('filter-type-course-btn'));
    expect(screen.getByTestId('select-broadcast-course')).toBeInTheDocument();
    expect(screen.getByText('Bússola Astrológica')).toBeInTheDocument();
  });

  it('switches to no_course filter and calculates estimate for students with no courses', async () => {
    renderWithToast(
      <ChatBroadcastModal
        isOpen={true}
        onClose={vi.fn()}
        courses={mockCourses}
        tags={mockTags}
        onOpenHistory={vi.fn()}
      />
    );

    const noCourseBtn = screen.getByTestId('filter-type-no_course-btn');
    expect(noCourseBtn).toBeInTheDocument();
    fireEvent.click(noCourseBtn);
    expect(screen.getByText('Sem Cursos')).toBeInTheDocument();
  });


  it('opens confirmation popup before triggering the mass broadcast', async () => {
    renderWithToast(
      <ChatBroadcastModal
        isOpen={true}
        onClose={vi.fn()}
        courses={mockCourses}
        tags={mockTags}
        onOpenHistory={vi.fn()}
      />
    );

    // Preencher campos
    fireEvent.change(screen.getByTestId('broadcast-title-input'), { target: { value: 'Aviso Teste' } });
    fireEvent.change(screen.getByTestId('broadcast-message-textarea'), { target: { value: 'Olá alunos!' } });

    // Aguardar estimativa carregar
    await waitFor(() => {
      expect(screen.getByText(/10 alunos/i)).toBeInTheDocument();
    });

    // Clicar em iniciar disparo
    const startBtn = screen.getByTestId('open-confirm-broadcast-btn');
    fireEvent.click(startBtn);

    // Diálogo de confirmação deve aparecer
    await waitFor(() => {
      expect(screen.getByTestId('broadcast-confirm-dialog')).toBeInTheDocument();
    });
    expect(screen.getByText(/Confirmar Disparo em Massa\?/i)).toBeInTheDocument();
  });

  it('switches to recent_days filter and allows choosing 7, 14, and 30 days', async () => {
    renderWithToast(
      <ChatBroadcastModal
        isOpen={true}
        onClose={vi.fn()}
        courses={mockCourses}
        tags={mockTags}
        onOpenHistory={vi.fn()}
      />
    );

    const recentBtn = screen.getByTestId('filter-type-recent_days-btn');
    expect(recentBtn).toBeInTheDocument();
    fireEvent.click(recentBtn);

    expect(screen.getByText(/Selecione o período de entrada dos alunos:/i)).toBeInTheDocument();
    expect(screen.getByTestId('filter-days-7-btn')).toBeInTheDocument();
    expect(screen.getByTestId('filter-days-14-btn')).toBeInTheDocument();
    expect(screen.getByTestId('filter-days-30-btn')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('filter-days-7-btn'));
  });

  it('configures CTA button and sends in payload', async () => {
    const fetchSpy = vi.spyOn(window, 'fetch');
    renderWithToast(
      <ChatBroadcastModal
        isOpen={true}
        onClose={vi.fn()}
        courses={mockCourses}
        tags={mockTags}
        onOpenHistory={vi.fn()}
      />
    );

    // Preencher título e mensagem
    fireEvent.change(screen.getByTestId('broadcast-title-input'), { target: { value: 'Novidade VIP' } });
    fireEvent.change(screen.getByTestId('broadcast-message-textarea'), { target: { value: 'Acesse nosso grupo!' } });

    // Habilitar botão CTA
    fireEvent.click(screen.getByTestId('toggle-broadcast-button'));
    fireEvent.change(screen.getByTestId('broadcast-button-text-input'), { target: { value: 'Entrar no Grupo' } });
    fireEvent.change(screen.getByTestId('broadcast-button-url-input'), { target: { value: 'https://wa.me/grupo' } });

    await waitFor(() => {
      expect(screen.getByText(/10 alunos/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('open-confirm-broadcast-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('confirm-and-send-broadcast-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('confirm-and-send-broadcast-btn'));

    await waitFor(() => {
      const calls = fetchSpy.mock.calls.filter((c) => c[0] === '/api/v1/chat/broadcast/send');
      expect(calls.length).toBe(1);
      const sentPayload = JSON.parse(calls[0][1].body);
      expect(sentPayload.button_text).toBe('Entrar no Grupo');
      expect(sentPayload.button_url).toBe('https://wa.me/grupo');
      expect(sentPayload.button_action_type).toBe('url');
    });
  });
});

