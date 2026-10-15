import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelNodeConfirmModal from './FunnelNodeConfirmModal';

describe('FunnelNodeConfirmModal Component', () => {
  const mockNode = {
    id: 'node_msg_1',
    type: 'message',
    data: { text: 'Olá aluno!' },
  };

  it('não renderiza nada se config for nulo ou sem nó', () => {
    const { container } = render(
      <FunnelNodeConfirmModal config={null} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza popup de exclusão de nó com detalhes e botões corretos', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <FunnelNodeConfirmModal
        config={{ type: 'delete', node: mockNode }}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByTestId('funnel-node-delete-modal')).toBeInTheDocument();
    expect(screen.getByText('Excluir Este Nó?')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja apagar o nó/i)).toBeInTheDocument();
    expect(screen.getByTestId('cancel-node-action-btn')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-node-action-btn')).toHaveTextContent('Sim, Excluir Nó');

    fireEvent.click(screen.getByTestId('cancel-node-action-btn'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('confirm-node-action-btn'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('renderiza popup de duplicação de nó com detalhes e botões corretos', () => {
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <FunnelNodeConfirmModal
        config={{ type: 'duplicate', node: mockNode }}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    );

    expect(screen.getByTestId('funnel-node-duplicate-modal')).toBeInTheDocument();
    expect(screen.getByText('Duplicar Este Nó?')).toBeInTheDocument();
    expect(screen.getByText(/Deseja criar uma cópia deste nó/i)).toBeInTheDocument();
    expect(screen.getByTestId('confirm-node-action-btn')).toHaveTextContent('Sim, Duplicar Nó');

    fireEvent.click(screen.getByTestId('confirm-node-action-btn'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('exibe nome de tipo correto para nós de Tag, Delay e Trigger', () => {
    const { rerender } = render(
      <FunnelNodeConfirmModal
        config={{ type: 'delete', node: { id: 'tag_1', type: 'tag', data: { tag_name: 'Lead VIP' } } }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/Lead VIP/)).toBeInTheDocument();

    rerender(
      <FunnelNodeConfirmModal
        config={{ type: 'delete', node: { id: 'delay_1', type: 'delay', data: {} } }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/Tempo de Espera/)).toBeInTheDocument();

    rerender(
      <FunnelNodeConfirmModal
        config={{ type: 'duplicate', node: { id: 'trig_1', type: 'trigger', data: {} } }}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText(/Gatilho Inicial/)).toBeInTheDocument();
  });

  it('impede fechamento ao clicar no painel interno do modal', () => {
    const handleClose = vi.fn();
    render(
      <FunnelNodeConfirmModal
        config={{ type: 'delete', node: mockNode }}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );
    const modalContent = screen.getByTestId('funnel-node-delete-modal');
    fireEvent.click(modalContent);
    expect(handleClose).not.toHaveBeenCalled();
  });
});
