import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IntegrationManagement from './IntegrationManagement';
import { ToastProvider } from '../../context/ToastContext';

const mockIntegrations = [
  {
    id: 1,
    name: 'Disparo n8n Boas-vindas e Marcos',
    url: 'https://webhook.n8n.cloud/webhook/marcos-alunos',
    is_active: true,
    secret_key: 'segredo123',
    course_id: null,
    events: ['lesson.completed', 'course.progress.25', 'course.progress.50', 'course.progress.75', 'course.progress.100'],
    created_at: '2026-09-30T10:00:00Z',
    updated_at: '2026-09-30T10:00:00Z',
    last_triggered_at: '2026-09-30T15:30:00Z',
    last_status_code: 200,
    total_dispatches: 12,
  },
  {
    id: 2,
    name: 'Zapier Conclusão de Curso',
    url: 'https://hooks.zapier.com/hooks/catch/123/curso',
    is_active: false,
    secret_key: null,
    course_id: 101,
    events: ['course.progress.100'],
    created_at: '2026-09-29T10:00:00Z',
    updated_at: '2026-09-29T10:00:00Z',
    last_triggered_at: '2026-09-29T11:00:00Z',
    last_status_code: 500,
    total_dispatches: 3,
  },
];

const mockCourses = [
  { id: 101, title: 'Bússola Astrológica' },
  { id: 102, title: 'Mapa Astral Avançado' },
];

const mockLogs = [
  {
    id: 1,
    webhook_id: 1,
    event: 'course.progress.100',
    url: 'https://webhook.n8n.cloud/webhook/marcos-alunos',
    request_headers: { 'Content-Type': 'application/json' },
    request_payload: { event: 'course.progress.100', data: { student_name: 'Fernandes' } },
    response_status: 200,
    response_body: '{"status":"ok"}',
    execution_time_ms: 154,
    created_at: '2026-09-30T15:30:00Z',
  },
];

const renderComponent = () => {
  return render(
    <ToastProvider>
      <IntegrationManagement bgColor="#090d16" />
    </ToastProvider>
  );
};

describe('IntegrationManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');

    global.fetch = vi.fn().mockImplementation((url, options) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      const method = options?.method || 'GET';

      if (urlStr.includes('/api/v1/integrations/1/logs')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockLogs,
        });
      }

      if (urlStr.includes('/api/v1/integrations/1/test') && method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            status_code: 200,
            response_body: '{"ok":true}',
            execution_time_ms: 120,
          }),
        });
      }

      if (urlStr.endsWith('/api/v1/integrations') && method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 3,
            name: 'ActiveCampaign 50% Concluído',
            url: 'https://webhook.activecampaign.com/teste',
            is_active: true,
            events: ['course.progress.50'],
            course_id: null,
            total_dispatches: 0,
          }),
        });
      }

      if (urlStr.includes('/api/v1/integrations/1') && method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockIntegrations[0],
            is_active: false,
          }),
        });
      }

      if (urlStr.includes('/api/v1/integrations/1') && method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Excluído com sucesso' }),
        });
      }

      if (urlStr.includes('/api/v1/integrations') && method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => mockIntegrations,
        });
      }

      if (urlStr.includes('/api/v1/courses')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCourses,
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  });

  it('renders header, stats metrics and integrations list', async () => {
    renderComponent();

    expect(screen.getByText('Integrações e Webhooks')).toBeInTheDocument();
    expect(screen.getByText(/Configure webhooks para receber notificações/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Disparo n8n Boas-vindas e Marcos')).toBeInTheDocument();
      expect(screen.getByText('Zapier Conclusão de Curso')).toBeInTheDocument();
    });

    // Cards de métricas
    expect(screen.getByText('Total de Integrações')).toBeInTheDocument();
    expect(screen.getByText('Integrações Ativas')).toBeInTheDocument();
    expect(screen.getByText('Disparos Realizados')).toBeInTheDocument();
  });

  it('filters webhooks by search term', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Disparo n8n Boas-vindas e Marcos')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-integrations-input');
    fireEvent.change(searchInput, { target: { value: 'Zapier' } });

    expect(screen.queryByText('Disparo n8n Boas-vindas e Marcos')).not.toBeInTheDocument();
    expect(screen.getByText('Zapier Conclusão de Curso')).toBeInTheDocument();
  });

  it('opens and closes new integration modal', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Disparo n8n Boas-vindas e Marcos')).toBeInTheDocument();
    });

    const newBtn = screen.getByTestId('open-create-integration-btn');
    fireEvent.click(newBtn);

    expect(screen.getByText('Nova Integração com Webhook')).toBeInTheDocument();
    expect(screen.getByTestId('integration-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('integration-url-input')).toBeInTheDocument();

    // Fecha modal
    const cancelBtn = screen.getByTestId('cancel-integration-btn');
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByText('Nova Integração com Webhook')).not.toBeInTheDocument();
    });
  });

  it('submits a new webhook integration successfully', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Disparo n8n Boas-vindas e Marcos')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('open-create-integration-btn'));

    const nameInput = screen.getByTestId('integration-name-input');
    const urlInput = screen.getByTestId('integration-url-input');

    fireEvent.change(nameInput, { target: { value: 'ActiveCampaign 50% Concluído' } });
    fireEvent.change(urlInput, { target: { value: 'https://webhook.activecampaign.com/teste' } });

    const submitBtn = screen.getByTestId('submit-integration-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/integrations',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('tests a webhook directly from the card button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Disparo n8n Boas-vindas e Marcos')).toBeInTheDocument();
    });

    const testBtn = screen.getByTestId('test-webhook-btn-1');
    fireEvent.click(testBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/integrations/1/test',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('opens and closes logs modal with execution history', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Disparo n8n Boas-vindas e Marcos')).toBeInTheDocument();
    });

    const logsBtn = await screen.findByTestId('view-logs-btn-1');
    fireEvent.click(logsBtn);

    await waitFor(() => {
      expect(screen.getByTestId('integration-logs-modal-content')).toBeInTheDocument();
    });

    expect(screen.getByText('Histórico de Disparos')).toBeInTheDocument();

    // Fechar modal de logs
    const closeBtn = screen.getByTestId('close-logs-modal-btn');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('integration-logs-modal-content')).not.toBeInTheDocument();
    });
  });

  it('opens delete confirmation modal and confirms deletion', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Disparo n8n Boas-vindas e Marcos')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId('delete-integration-btn-1');
    fireEvent.click(deleteBtn);

    expect(screen.getByText('Excluir Integração?')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja apagar esta integração/i)).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByTestId('confirm-delete-integration-btn');
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/integrations/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
