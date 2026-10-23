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
      pool_capacity: 50,
      pool_base: 20,
      overflow_reserve: 30,
      occupancy_pct: 2.0,
      idle_connections: 2,
      status: 'Saudável',
      peak_connections_today: 3,
      peak_pct_today: 6.0,
      peak_time_today: '22/10/2026 10:04:10 (Horário de Brasília)',
      history_24h: [
        {
          period: '22/10/2026 10:00',
          peak_connections: 3,
          pool_capacity: 50,
          occupancy_pct: 6.0,
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
