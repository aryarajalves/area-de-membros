import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FunnelExecutionsHistoryModal from './FunnelExecutionsHistoryModal';

describe('FunnelExecutionsHistoryModal Component', () => {
  const mockExecutionsData = {
    funnel_id: 1,
    funnel_name: 'Funil de Vendas Astrologia',
    total_executions: 2,
    running_count: 1,
    completed_count: 1,
    flow_nodes: [
      { id: 'node_trig', type: 'trigger', data: {} },
      { id: 'node_msg_1', type: 'message', data: { text: 'Olá aluno!' } },
      { id: 'node_delay', type: 'delay', data: { delay_seconds: 5 } },
    ],
    executions: [
      {
        id: 101,
        funnel_id: 1,
        funnel_name: 'Funil de Vendas Astrologia',
        user_id: 5,
        student_name: 'Carlos Alberto',
        student_email: 'carlos@teste.com',
        status: 'running',
        current_node_id: 'node_delay',
        started_at: '2026-10-14T15:00:00Z',
        logs: 'Gatilho iniciado\n(Nó node_trig)\nMensagem enviada (Nó node_msg_1)',
        visited_nodes: ['node_trig', 'node_msg_1'],
      },
      {
        id: 102,
        funnel_id: 1,
        funnel_name: 'Funil de Vendas Astrologia',
        user_id: 8,
        student_name: 'Mariana Silva',
        student_email: 'mariana@teste.com',
        status: 'completed',
        current_node_id: null,
        started_at: '2026-10-13T10:00:00Z',
        completed_at: '2026-10-13T10:02:00Z',
        logs: 'Concluído com sucesso',
        visited_nodes: ['node_trig', 'node_msg_1', 'node_delay'],
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/executions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockExecutionsData),
        });
      }
      if (url.includes('/active-funnels')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                execution_id: 101,
                funnel_id: 1,
                funnel_name: 'Funil de Vendas Astrologia',
                status: 'running',
                progress_percentage: 66,
                visited_nodes_count: 2,
                total_nodes_count: 3,
              },
            ]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  it('não renderiza o modal quando isOpen é false', () => {
    const { container } = render(
      <FunnelExecutionsHistoryModal
        isOpen={false}
        funnelId={1}
        funnelName="Funil VIP"
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza título, estatísticas e lista de execuções ao abrir', async () => {
    render(
      <FunnelExecutionsHistoryModal
        isOpen={true}
        funnelId={1}
        funnelName="Funil de Vendas Astrologia"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('funnel-executions-modal')).toBeInTheDocument();
    expect(screen.getByText('Histórico de Execuções do Funil')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('execution-item-101')).toBeInTheDocument();
      expect(screen.getByTestId('execution-item-102')).toBeInTheDocument();
    });

    expect(screen.getByText('2 execuções')).toBeInTheDocument();
    expect(screen.getByText('1 rodando agora')).toBeInTheDocument();
  });

  it('permite filtrar contatos por nome ou e-mail na busca', async () => {
    render(
      <FunnelExecutionsHistoryModal
        isOpen={true}
        funnelId={1}
        funnelName="Funil de Vendas Astrologia"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('execution-item-101')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('search-executions-input');
    fireEvent.change(searchInput, { target: { value: 'Mariana' } });

    expect(screen.queryByTestId('execution-item-101')).not.toBeInTheDocument();
    expect(screen.getByTestId('execution-item-102')).toBeInTheDocument();
  });

  it('renderiza o progresso visual do fluxo com nós visitados e nó ativo', async () => {
    render(
      <FunnelExecutionsHistoryModal
        isOpen={true}
        funnelId={1}
        funnelName="Funil de Vendas Astrologia"
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('funnel-execution-flow-progress')).toBeInTheDocument();
    });

    expect(screen.getByTestId('progress-node-node_trig')).toBeInTheDocument();
    expect(screen.getByTestId('progress-node-node_msg_1')).toBeInTheDocument();
    expect(screen.getByTestId('progress-node-node_delay')).toBeInTheDocument();
    expect(screen.getByText('Nó Ativo Agora')).toBeInTheDocument();
  });

  it('chama onClose ao clicar no botão de fechar', () => {
    const onCloseMock = vi.fn();
    render(
      <FunnelExecutionsHistoryModal
        isOpen={true}
        funnelId={1}
        funnelName="Funil de Vendas Astrologia"
        onClose={onCloseMock}
      />
    );

    fireEvent.click(screen.getByTestId('close-executions-modal-btn'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
