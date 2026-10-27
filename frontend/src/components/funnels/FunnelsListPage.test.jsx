import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FunnelsListPage from './FunnelsListPage';
import { ToastProvider } from '../../context/ToastContext';

describe('FunnelsListPage with Folders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'fake-jwt-token');
  });

  const mockFolders = [
    { id: 1, name: 'Boas-vindas', color: '#10b981', funnels_count: 1 },
    { id: 2, name: 'Recuperação', color: '#ec4899', funnels_count: 1 },
  ];

  const mockFunnels = [
    {
      id: 101,
      name: 'Funil Boas-vindas 1',
      description: 'Funil inicial',
      folder_id: 1,
      folder_name: 'Boas-vindas',
      folder_color: '#10b981',
      nodes_count: 2,
      executions_count: 10,
      created_at: new Date().toISOString(),
    },
    {
      id: 102,
      name: 'Funil Recuperação Carrinho',
      description: 'Recuperar vendas',
      folder_id: 2,
      folder_name: 'Recuperação',
      folder_color: '#ec4899',
      nodes_count: 4,
      executions_count: 20,
      created_at: new Date().toISOString(),
    },
    {
      id: 103,
      name: 'Funil Solto Sem Pasta',
      description: 'Sem pasta',
      folder_id: null,
      folder_name: null,
      folder_color: null,
      nodes_count: 1,
      executions_count: 0,
      created_at: new Date().toISOString(),
    },
  ];

  it('renders funnels and folder bar, allowing filtering by folder and moving funnels', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url === '/api/v1/funnels/folders' && (!options || options.method === 'GET' || !options.method)) {
        return Promise.resolve({
          ok: true,
          json: async () => mockFolders,
        });
      }
      if (url === '/api/v1/funnels' && (!options || options.method === 'GET' || !options.method)) {
        return Promise.resolve({
          ok: true,
          json: async () => mockFunnels,
        });
      }
      if (url === '/api/v1/funnels/103/folder' && options?.method === 'PATCH') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ ...mockFunnels[2], folder_id: 1, folder_name: 'Boas-vindas' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <FunnelsListPage onSelectFunnel={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Funil Boas-vindas 1')).toBeInTheDocument();
      expect(screen.getByText('Funil Recuperação Carrinho')).toBeInTheDocument();
      expect(screen.getByText('Funil Solto Sem Pasta')).toBeInTheDocument();
    });

    // Confirma que os pills de pasta aparecem na barra
    expect(screen.getByTestId('folder-pill-1')).toBeInTheDocument();
    expect(screen.getByTestId('folder-pill-2')).toBeInTheDocument();
    expect(screen.getByTestId('folder-pill-unassigned')).toBeInTheDocument();

    // Filtra clicando na pasta "Boas-vindas"
    fireEvent.click(screen.getByTestId('folder-pill-1').querySelector('button'));

    // Agora apenas "Funil Boas-vindas 1" deve estar visível
    expect(screen.getByText('Funil Boas-vindas 1')).toBeInTheDocument();
    expect(screen.queryByText('Funil Recuperação Carrinho')).not.toBeInTheDocument();
    expect(screen.queryByText('Funil Solto Sem Pasta')).not.toBeInTheDocument();

    // Filtra por "Sem Pasta"
    fireEvent.click(screen.getByTestId('folder-pill-unassigned'));
    expect(screen.getByText('Funil Solto Sem Pasta')).toBeInTheDocument();
    expect(screen.queryByText('Funil Boas-vindas 1')).not.toBeInTheDocument();

    // Volta para "Todos os Funis"
    fireEvent.click(screen.getByTestId('folder-pill-all'));
    expect(screen.getByText('Funil Boas-vindas 1')).toBeInTheDocument();
    expect(screen.getByText('Funil Recuperação Carrinho')).toBeInTheDocument();
    expect(screen.getByText('Funil Solto Sem Pasta')).toBeInTheDocument();

    // Clica no botão Mover para Pasta no funil 103
    fireEvent.click(screen.getByTestId('move-funnel-btn-103'));
    expect(screen.getByText('Mover para Pasta')).toBeInTheDocument();

    // Seleciona a pasta Boas-vindas (ID 1) no modal e confirma
    fireEvent.click(screen.getByTestId('move-option-folder-1'));
    fireEvent.click(screen.getByTestId('confirm-move-folder-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/funnels/103/folder',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ folder_id: 1 }),
        })
      );
    });
  });
});
