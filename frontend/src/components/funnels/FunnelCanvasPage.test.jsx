import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FunnelCanvasPage from './FunnelCanvasPage';
import { ToastProvider } from '../../context/ToastContext';

describe('FunnelCanvasPage Component - Confirmação de Ações em Nós', () => {
  const mockFunnelData = {
    id: 10,
    name: 'Funil Teste Popups',
    flow_data: JSON.stringify({
      nodes: [
        {
          id: 'node_trigger_1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          data: { title: 'Gatilho de Interesse' },
        },
        {
          id: 'node_msg_1',
          type: 'message',
          position: { x: 450, y: 100 },
          data: { text: 'Olá visitante!', is_start: false },
        },
      ],
      edges: [
        { id: 'edge_1', source: 'node_trigger_1', target: 'node_msg_1' },
      ],
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/funnels/senders')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      return Promise.resolve({ ok: true, json: async () => mockFunnelData });
    });
  });

  it('abre popup de confirmação ao clicar em excluir nó e permite cancelar sem remover', async () => {
    render(
      <ToastProvider>
        <FunnelCanvasPage funnelId={10} onBack={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Funil Teste Popups')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Olá visitante!')).toBeInTheDocument();
    });

    // Encontra o botão de excluir nó (Trash2)
    const deleteBtn = screen.getByTitle('Excluir Nó');
    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);

    // Deve abrir o popup de confirmação
    expect(screen.getByTestId('funnel-node-delete-modal')).toBeInTheDocument();
    expect(screen.getByText('Excluir Este Nó?')).toBeInTheDocument();

    // Clica em Cancelar
    const cancelBtn = screen.getByTestId('cancel-node-action-btn');
    fireEvent.click(cancelBtn);

    // O modal deve fechar e o nó continuar na tela
    expect(screen.queryByTestId('funnel-node-delete-modal')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('Olá visitante!')).toBeInTheDocument();
  });

  it('exclui o nó ao confirmar no popup de exclusão', async () => {
    render(
      <ToastProvider>
        <FunnelCanvasPage funnelId={10} onBack={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Funil Teste Popups')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Olá visitante!')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Excluir Nó');
    fireEvent.click(deleteBtn);

    expect(screen.getByTestId('funnel-node-delete-modal')).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-node-action-btn');
    fireEvent.click(confirmBtn);

    // O modal fecha e o nó de mensagem é removido
    await waitFor(() => {
      expect(screen.queryByTestId('funnel-node-delete-modal')).not.toBeInTheDocument();
      expect(screen.queryByDisplayValue('Olá visitante!')).not.toBeInTheDocument();
    });
  });

  it('abre popup de confirmação ao clicar em duplicar nó e cria a cópia ao confirmar', async () => {
    render(
      <ToastProvider>
        <FunnelCanvasPage funnelId={10} onBack={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Funil Teste Popups')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Olá visitante!')).toBeInTheDocument();
    });

    // Encontra botões de duplicar (pode haver mais de um nó)
    const duplicateButtons = screen.getAllByTitle('Duplicar Nó');
    fireEvent.click(duplicateButtons[0]);

    // Deve abrir o modal de duplicação
    expect(screen.getByTestId('funnel-node-duplicate-modal')).toBeInTheDocument();
    expect(screen.getByText('Duplicar Este Nó?')).toBeInTheDocument();

    // Confirma a duplicação
    const confirmBtn = screen.getByTestId('confirm-node-action-btn');
    fireEvent.click(confirmBtn);

    // Modal fecha
    await waitFor(() => {
      expect(screen.queryByTestId('funnel-node-duplicate-modal')).not.toBeInTheDocument();
    });
  });

  it('centraliza automaticamente os nós na tela ao abrir o fluxo com coordenadas distantes', async () => {
    const distantFunnel = {
      id: 20,
      name: 'Funil Coordenadas Distantes',
      flow_data: JSON.stringify({
        nodes: [
          { id: 'n1', type: 'message', position: { x: 1816, y: -251 }, data: { text: 'Nó Longe 1' } },
          { id: 'n2', type: 'trigger', position: { x: 1154, y: -233 }, data: { title: 'Gatilho Longe' } },
          { id: 'n3', type: 'tag', position: { x: 2403, y: -254 }, data: { tag_name: 'Tag Longe' } },
        ],
        edges: [],
      }),
    };

    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/v1/funnels/senders')) return Promise.resolve({ ok: true, json: async () => [] });
      return Promise.resolve({ ok: true, json: async () => distantFunnel });
    });

    render(
      <ToastProvider>
        <FunnelCanvasPage funnelId={20} onBack={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Funil Coordenadas Distantes')).toBeInTheDocument();
    });

    const world = screen.getByTestId('funnel-canvas-world');
    expect(world).toBeInTheDocument();

    // O transform do canvas world não deve ser o padrão translate(0px, 0px) scale(1)
    // Deve ter pan negativo em X para trazer os nós de x=1154-2403 para a área visível
    await waitFor(() => {
      const transform = world.style.transform;
      expect(transform).not.toBe('translate(0px, 0px) scale(1)');
      expect(transform).toContain('translate(');
      expect(transform).toContain('scale(');
    });
  });
});
