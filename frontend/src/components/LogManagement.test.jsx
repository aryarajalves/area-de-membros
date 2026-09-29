import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LogManagement from './LogManagement';
import { ToastProvider } from '../context/ToastContext';

describe('LogManagement Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
  });

  const mockLogsBackend = {
    service: 'backend',
    container: 'projeto_base_backend',
    available: true,
    logs: [
      '[INFO] [projeto_base]: Servidor iniciado com sucesso.',
      '[WARNING] [projeto_base]: Conexão lenta detectada.',
      '[ERROR] [projeto_base]: Falha simulada para teste de log.',
    ],
    total_lines: 3,
    error: null,
  };

  const mockLogsFrontend = {
    service: 'frontend',
    container: 'projeto_base_frontend',
    available: true,
    logs: [
      '172.31.0.1 - - [29/Sep/2026:17:35:00 +0000] "GET / HTTP/1.1" 200 450',
    ],
    total_lines: 1,
    error: null,
  };

  const setupFetchMock = () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/logs/frontend')) {
        return Promise.resolve({ ok: true, json: async () => mockLogsFrontend });
      }
      return Promise.resolve({ ok: true, json: async () => mockLogsBackend });
    });
  };

  it('renders log management header and service tabs', async () => {
    setupFetchMock();
    render(
      <ToastProvider>
        <LogManagement currentUser={{ role: 'superadmin' }} />
      </ToastProvider>
    );

    expect(screen.getByText('Gerenciamento de logs')).toBeInTheDocument();
    expect(screen.getByTestId('tab-service-backend')).toBeInTheDocument();
    expect(screen.getByTestId('tab-service-frontend')).toBeInTheDocument();
    expect(screen.getByTestId('tab-service-db')).toBeInTheDocument();

    // Aguarda carregar logs do backend
    await waitFor(() => {
      expect(screen.getByText('[INFO] [projeto_base]: Servidor iniciado com sucesso.')).toBeInTheDocument();
      expect(screen.getByText('[ERROR] [projeto_base]: Falha simulada para teste de log.')).toBeInTheDocument();
    });
  });

  it('switches container service and updates logs view', async () => {
    setupFetchMock();
    render(
      <ToastProvider>
        <LogManagement currentUser={{ role: 'superadmin' }} />
      </ToastProvider>
    );

    // Clica na aba frontend
    const frontTab = screen.getByTestId('tab-service-frontend');
    fireEvent.click(frontTab);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/logs/frontend'),
        expect.anything()
      );
      expect(screen.getByText('172.31.0.1 - - [29/Sep/2026:17:35:00 +0000] "GET / HTTP/1.1" 200 450')).toBeInTheDocument();
    });
  });

  it('filters logs by search input', async () => {
    setupFetchMock();
    render(
      <ToastProvider>
        <LogManagement currentUser={{ role: 'superadmin' }} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('[INFO] [projeto_base]: Servidor iniciado com sucesso.')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('log-search-input');
    fireEvent.change(searchInput, { target: { value: 'Falha simulada' } });

    // Apenas a linha do erro deve permanecer
    expect(screen.getByText('[ERROR] [projeto_base]: Falha simulada para teste de log.')).toBeInTheDocument();
    expect(screen.queryByText('[INFO] [projeto_base]: Servidor iniciado com sucesso.')).not.toBeInTheDocument();
  });

  it('copies logs to clipboard when clicking copy button', async () => {
    setupFetchMock();
    const writeTextMock = vi.fn().mockResolvedValue();
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <ToastProvider>
        <LogManagement currentUser={{ role: 'superadmin' }} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('[INFO] [projeto_base]: Servidor iniciado com sucesso.')).toBeInTheDocument();
    });

    const copyBtn = screen.getByTestId('copy-logs-btn');
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalled();
  });
});
