import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../../context/ToastContext';
import ChatBroadcastHistoryModal from './ChatBroadcastHistoryModal';

const renderWithToast = (ui) => {
  return render(<ToastProvider>{ui}</ToastProvider>);
};

describe('ChatBroadcastHistoryModal Component', () => {
  const mockCampaigns = [
    {
      id: 1,
      title: 'Aviso Mentoria 1',
      message: 'Olá alunos da mentoria!',
      filter_type: 'tag',
      filter_target_name: 'VIP Astro',
      total_recipients: 5,
      sent_count: 5,
      read_count: 3,
      read_percentage: 60.0,
      duration_seconds: 5.2,
      status: 'completed',
      created_at: '2026-10-06T12:00:00Z',
      created_by_name: 'Admin Teste',
    },
  ];

  const mockDetail = {
    ...mockCampaigns[0],
    recipients: [
      {
        id: 101,
        recipient_id: 10,
        recipient_name: 'Aluno Um',
        recipient_email: 'aluno1@test.com',
        status: 'sent',
        is_read: true,
        read_at: '2026-10-06T12:05:00Z',
      },
      {
        id: 102,
        recipient_id: 20,
        recipient_name: 'Aluno Dois',
        recipient_email: 'aluno2@test.com',
        status: 'sent',
        is_read: false,
        read_at: null,
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders list of broadcast campaigns with title, duration and view rate', async () => {
    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockCampaigns,
    });

    renderWithToast(<ChatBroadcastHistoryModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Histórico de Disparos em Massa')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Aviso Mentoria 1')).toBeInTheDocument();
      expect(screen.getByText(/VIP Astro/i)).toBeInTheDocument();
      expect(screen.getByText(/3 leram \(60%\)/i)).toBeInTheDocument();
      expect(screen.getByText(/5 segundos/i)).toBeInTheDocument();
    });
  });

  it('opens campaign detail view and displays recipients with read status', async () => {
    vi.spyOn(window, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampaigns,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockDetail,
      });

    renderWithToast(<ChatBroadcastHistoryModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('campaign-card-1')).toBeInTheDocument();
    });

    // Clicar para ver detalhes
    fireEvent.click(screen.getByTestId('campaign-card-1'));

    await waitFor(() => {
      expect(screen.getByTestId('campaign-detail-view')).toBeInTheDocument();
      expect(screen.getByText('Aluno Um')).toBeInTheDocument();
      expect(screen.getByText('Aluno Dois')).toBeInTheDocument();
      expect(screen.getByTestId('recipient-read-10')).toBeInTheDocument();
      expect(screen.getByTestId('recipient-unread-20')).toBeInTheDocument();
    });
  });

  it('paginates broadcast campaigns displaying 20 per page with pagination bar and navigation', async () => {
    const manyCampaigns = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      title: `Disparo Campanha #${i + 1}`,
      message: `Mensagem teste ${i + 1}`,
      filter_type: 'all',
      total_recipients: 10,
      sent_count: 10,
      read_count: 5,
      read_percentage: 50.0,
      duration_seconds: 10,
      status: 'completed',
      created_at: '2026-10-06T12:00:00Z',
      created_by_name: 'Admin Teste',
    }));

    vi.spyOn(window, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => manyCampaigns,
    });

    renderWithToast(<ChatBroadcastHistoryModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('campaign-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('campaign-card-20')).toBeInTheDocument();
      expect(screen.queryByTestId('campaign-card-21')).not.toBeInTheDocument();
    });

    // Valida a barra de paginação
    const paginationBar = screen.getByTestId('broadcast-history-pagination-bar');
    expect(paginationBar).toBeInTheDocument();
    expect(paginationBar).toHaveTextContent(/Exibindo 1–20 de 25 disparos/i);

    // Navega para a página 2
    fireEvent.click(screen.getByTestId('broadcast-history-page-2-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('campaign-card-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('campaign-card-21')).toBeInTheDocument();
      expect(screen.getByTestId('campaign-card-25')).toBeInTheDocument();
      expect(paginationBar).toHaveTextContent(/Exibindo 21–25 de 25 disparos/i);
    });
  });

  it('paginates recipients inside campaign detail view displaying 20 per page', async () => {
    const manyRecipients = Array.from({ length: 25 }, (_, i) => ({
      id: 200 + i,
      recipient_id: 500 + i,
      recipient_name: `Aluno Multi #${i + 1}`,
      recipient_email: `aluno${i + 1}@escola.com`,
      status: 'sent',
      is_read: i % 2 === 0,
      read_at: i % 2 === 0 ? '2026-10-06T12:00:00Z' : null,
    }));

    const detailWithManyRecipients = {
      ...mockCampaigns[0],
      total_recipients: 25,
      recipients: manyRecipients,
    };

    vi.spyOn(window, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCampaigns,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => detailWithManyRecipients,
      });

    renderWithToast(<ChatBroadcastHistoryModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByTestId('campaign-card-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('campaign-card-1'));

    await waitFor(() => {
      expect(screen.getByTestId('campaign-detail-view')).toBeInTheDocument();
      expect(screen.getByText('Aluno Multi #1')).toBeInTheDocument();
      expect(screen.getByText('Aluno Multi #20')).toBeInTheDocument();
      expect(screen.queryByText('Aluno Multi #21')).not.toBeInTheDocument();
    });

    const recipPaginationBar = screen.getByTestId('campaign-recipients-pagination-bar');
    expect(recipPaginationBar).toBeInTheDocument();
    expect(recipPaginationBar).toHaveTextContent(/Exibindo 1–20 de 25 alunos/i);

    // Navega para página 2 de destinatários
    fireEvent.click(screen.getByTestId('campaign-recipients-page-2-btn'));

    await waitFor(() => {
      expect(screen.queryByText('Aluno Multi #1')).not.toBeInTheDocument();
      expect(screen.getByText('Aluno Multi #21')).toBeInTheDocument();
      expect(screen.getByText('Aluno Multi #25')).toBeInTheDocument();
      expect(recipPaginationBar).toHaveTextContent(/Exibindo 21–25 de 25 alunos/i);
    });
  });
});
