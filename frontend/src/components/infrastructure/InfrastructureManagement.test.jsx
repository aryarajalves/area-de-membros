import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import InfrastructureManagement from './InfrastructureManagement';
import * as api from './infrastructureApi';

describe('InfrastructureManagement Component', () => {
  const mockOverview = {
    hardware: {
      ram_used_gb: 2.31,
      ram_total_gb: 11.54,
      ram_free_gb: 9.23,
      ram_pct: 20.0,
      api_container_mb: 148.8,
      ram_status: 'Saudável',
      cpu_pct: 4.7,
      vcpus: 16,
      cpu_status: 'Normal',
      peak_ram_pct: 20.0,
      peak_ram_details: '20% (2.31 GB)',
      peak_ram_recorded_at: '22/10/2026 17:47:28 (Horário de Brasília)',
      peak_cpu_pct: 4.7,
      peak_cpu_recorded_at: '22/10/2026 17:47:28 (Horário de Brasília)',
    },
    database: {
      active_connections: 1,
      project_active_connections: 1,
      project_idle_connections: 17,
      project_total_open: 18,
      pool_capacity: 50,
      project_max_connections: 200,
      workers_count: 4,
      pool_base_per_worker: 30,
      overflow_per_worker: 20,
      pool_base: 30,
      overflow_reserve: 20,
      occupancy_pct: 0.5,
      idle_connections: 17,
      status: 'Saudável',
      peak_connections_today: 3,
      peak_pct_today: 1.5,
      peak_time_today: '22/10/2026 10:04:10 (Horário de Brasília)',
      global_connections_total: 23,
      global_active_connections: 2,
      global_idle_connections: 21,
      postgres_max_connections: 500,
      database_size_pretty: '20 MB',
      cluster_size_pretty: '28 MB',
      history_24h: [
        {
          period: '22/10/2026 10:00',
          peak_connections: 3,
          pool_capacity: 200,
          occupancy_pct: 1.5,
          status: 'Normal',
        },
      ],
    },
    alert_badge: 'Ativo',
  };

  const mockConfig = {
    pool_alert_enabled: true,
    pool_alert_threshold: 75,
    ram_alert_enabled: true,
    ram_alert_threshold: 80,
    cpu_alert_enabled: true,
    cpu_alert_threshold: 85,
    cooldown_minutes: 15,
    webhook_url: 'https://webhook.site/test-1234',
    notify_normalized: true,
    is_active: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(api, 'getInfrastructureOverviewApi').mockResolvedValue(mockOverview);
    vi.spyOn(api, 'getAlertConfigApi').mockResolvedValue(mockConfig);
    vi.spyOn(api, 'updateAlertConfigApi').mockResolvedValue({ ...mockConfig, pool_alert_threshold: 80 });
    vi.spyOn(api, 'testWebhookApi').mockResolvedValue({ success: true, message: 'Webhook testado com sucesso!' });
  });

  it('renders overview header, hardware metrics and badges correctly', async () => {
    render(<InfrastructureManagement currentUser={{ role: 'superadmin' }} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando métricas de infraestrutura...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Infraestrutura & Recursos do Servidor')).toBeInTheDocument();
    expect(screen.getByText('2.31 GB')).toBeInTheDocument();
    expect(screen.getAllByText(/4\.7%/).length).toBeGreaterThan(0);
    expect(screen.getByText('20% RAM')).toBeInTheDocument();
  });

  it('allows switching between subtabs (Database and Alerts)', async () => {
    render(<InfrastructureManagement currentUser={{ role: 'superadmin' }} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando métricas de infraestrutura...')).not.toBeInTheDocument();
    });

    // Clica na aba Conexões & Banco
    fireEvent.click(screen.getByTestId('subtab-database'));
    await waitFor(() => {
      expect(screen.getByText('Conexões em Uso Agora')).toBeInTheDocument();
    });
    expect(screen.getByText('Maior Pico Registrado Hoje')).toBeInTheDocument();
    expect(screen.getByText(/conexões simultâneas máx/i)).toBeInTheDocument();
    expect(screen.getByText('Conexões Globais do PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('Tamanho do Banco no Disco')).toBeInTheDocument();
    expect(screen.getAllByText(/20 MB/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/28 MB/i).length).toBeGreaterThan(0);

    // Clica na aba Configurações de Alertas
    fireEvent.click(screen.getByTestId('subtab-alerts'));
    await waitFor(() => {
      expect(screen.getByText('Central de Notificações e Webhooks')).toBeInTheDocument();
    });
  });

  it('triggers test webhook and saves configuration', async () => {
    render(<InfrastructureManagement currentUser={{ role: 'superadmin' }} />);

    await waitFor(() => {
      expect(screen.queryByText('Carregando métricas de infraestrutura...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('subtab-alerts'));

    await waitFor(() => {
      expect(screen.getByTestId('webhook-url-input')).toBeInTheDocument();
    });

    // Garante valor no input
    const input = screen.getByTestId('webhook-url-input');
    fireEvent.change(input, { target: { value: 'https://webhook.site/test-1234' } });

    // Testar webhook
    const testBtn = screen.getByTestId('test-webhook-btn');
    fireEvent.click(testBtn);
    await waitFor(() => {
      expect(api.testWebhookApi).toHaveBeenCalledWith('https://webhook.site/test-1234');
    });

    // Salvar configurações
    const saveBtn = screen.getByTestId('save-alert-config-btn');
    fireEvent.click(saveBtn);
    await waitFor(() => {
      expect(api.updateAlertConfigApi).toHaveBeenCalled();
    });
  });
});
