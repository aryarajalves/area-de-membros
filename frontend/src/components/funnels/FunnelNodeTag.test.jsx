import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FunnelNodeTag from './FunnelNodeTag';

const mockAddToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
    removeToast: vi.fn(),
  }),
}));

describe('FunnelNodeTag Component', () => {
  const mockTags = [
    { id: 1, name: 'Lead Quente', color: '#ef4444' },
    { id: 2, name: 'Interessado em Astrologia', color: '#8b5cf6' },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    mockAddToast.mockClear();
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/students/tags')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockTags),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });
  });

  const defaultNode = {
    id: 'tag_node_1',
    type: 'tag',
    position: { x: 200, y: 100 },
    data: {
      tag_ids: [],
      tag_id: null,
      tag_name: '',
      tag_color: '#a855f7',
    },
  };

  it('renderiza o nó de tag com título, badge AÇÃO e handles de conexão', () => {
    render(
      <FunnelNodeTag
        node={defaultNode}
        isSelected={false}
        onUpdateData={vi.fn()}
        onDeleteNode={vi.fn()}
        onDuplicateNode={vi.fn()}
      />
    );

    expect(screen.getByTestId('funnel-node-tag-tag_node_1')).toBeInTheDocument();
    expect(screen.getByText('ADICIONAR TAG')).toBeInTheDocument();
    expect(screen.getByText('AÇÃO')).toBeInTheDocument();
    expect(screen.getByTestId('node-input-handle-tag_node_1')).toBeInTheDocument();
    expect(screen.getByTestId('node-output-handle-tag_node_1')).toBeInTheDocument();
    expect(screen.getByTestId('funnel-node-tag-select-tag_node_1')).toBeInTheDocument();
  });

  it('carrega etiquetas via API e permite selecionar múltiplas tags no nó', async () => {
    const onUpdateData = vi.fn();
    render(
      <FunnelNodeTag
        node={defaultNode}
        isSelected={false}
        onUpdateData={onUpdateData}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Interessado em Astrologia')).toBeInTheDocument();
    });

    const select = screen.getByTestId('funnel-node-tag-select-tag_node_1');
    fireEvent.change(select, { target: { value: '2' } });

    expect(onUpdateData).toHaveBeenCalledWith('tag_node_1', expect.objectContaining({
      tag_ids: [2],
      tag_id: 2,
      tag_name: 'Interessado em Astrologia',
      tag_color: '#8b5cf6',
    }));
  });

  it('exibe badges visuais para múltiplas tags selecionadas', async () => {
    const selectedNode = {
      ...defaultNode,
      data: {
        tag_ids: [1, 2],
        tag_id: 1,
        tag_name: 'Lead Quente',
        tag_color: '#ef4444',
      },
    };

    render(
      <FunnelNodeTag
        node={selectedNode}
        isSelected={true}
        onUpdateData={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('funnel-node-selected-tag-1')).toBeInTheDocument();
      expect(screen.getByTestId('funnel-node-selected-tag-2')).toBeInTheDocument();
      expect(screen.getByText(/O aluno receberá as tags "Lead Quente", "Interessado em Astrologia" ao passar por aqui/i)).toBeInTheDocument();
    });
  });

  it('permite duplicar e excluir o nó através dos botões do cabeçalho', () => {
    const onDuplicateNode = vi.fn();
    const onDeleteNode = vi.fn();

    render(
      <FunnelNodeTag
        node={defaultNode}
        isSelected={false}
        onUpdateData={vi.fn()}
        onDuplicateNode={onDuplicateNode}
        onDeleteNode={onDeleteNode}
      />
    );

    const duplicateBtn = screen.getByTitle('Duplicar nó');
    fireEvent.click(duplicateBtn);
    expect(onDuplicateNode).toHaveBeenCalledWith('tag_node_1');

    const deleteBtn = screen.getByTitle('Excluir nó');
    fireEvent.click(deleteBtn);
    expect(onDeleteNode).toHaveBeenCalledWith('tag_node_1');
  });

  it('abre o modal de criação de etiqueta com seleção de cor ao clicar no botão', async () => {
    render(
      <FunnelNodeTag
        node={defaultNode}
        isSelected={false}
        onUpdateData={vi.fn()}
      />
    );

    const openModalBtn = screen.getByTestId('funnel-node-open-create-tag-modal-btn-tag_node_1');
    fireEvent.click(openModalBtn);

    expect(screen.getByTestId('funnel-create-tag-modal')).toBeInTheDocument();
    expect(screen.getByText('Nova Etiqueta')).toBeInTheDocument();
    expect(screen.getByTestId('funnel-create-tag-color-palette')).toBeInTheDocument();
  });

  it('permite digitar no campo de busca do nó e abre o modal com o nome já pré-preenchido', async () => {
    render(
      <FunnelNodeTag
        node={defaultNode}
        isSelected={false}
        onUpdateData={vi.fn()}
      />
    );

    const searchInput = screen.getByTestId('funnel-node-tag-search-input-tag_node_1');
    fireEvent.change(searchInput, { target: { value: 'Lead Qualificado' } });

    const openModalBtn = screen.getByTestId('funnel-node-open-create-tag-modal-btn-tag_node_1');
    fireEvent.click(openModalBtn);

    expect(screen.getByTestId('funnel-create-tag-modal')).toBeInTheDocument();
    const modalInput = screen.getByTestId('funnel-create-tag-name-input');
    expect(modalInput.value).toBe('Lead Qualificado');
  });

  it('permite criar etiqueta com cor via modal e adiciona automaticamente à lista de tags do nó', async () => {
    const onUpdateData = vi.fn();
    const createdTag = { id: 99, name: 'Comprador VIP', color: '#10b981' };

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/v1/students/tags') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(createdTag),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockTags),
      });
    });

    render(
      <FunnelNodeTag
        node={defaultNode}
        isSelected={false}
        onUpdateData={onUpdateData}
      />
    );

    // Abre o modal
    const openModalBtn = screen.getByTestId('funnel-node-open-create-tag-modal-btn-tag_node_1');
    fireEvent.click(openModalBtn);

    // Preenche o nome
    const input = screen.getByTestId('funnel-create-tag-name-input');
    fireEvent.change(input, { target: { value: 'Comprador VIP' } });

    // Escolhe a cor esmeralda
    fireEvent.click(screen.getByTestId('funnel-create-tag-color-#10b981'));

    // Submete
    const submitBtn = screen.getByTestId('funnel-create-tag-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onUpdateData).toHaveBeenCalledWith('tag_node_1', expect.objectContaining({
        tag_ids: [99],
        tag_id: 99,
        tag_name: 'Comprador VIP',
        tag_color: '#10b981',
      }));
    });
  });

  it('permite alternar entre Adicionar Tag e Remover Tag', () => {
    const onUpdateData = vi.fn();
    render(
      <FunnelNodeTag
        node={defaultNode}
        isSelected={false}
        onUpdateData={onUpdateData}
      />
    );

    const removeBtn = screen.getByTestId('funnel-node-tag-action-remove-tag_node_1');
    fireEvent.click(removeBtn);

    expect(onUpdateData).toHaveBeenCalledWith('tag_node_1', expect.objectContaining({
      tag_action: 'remove',
    }));
  });

  it('exibe título REMOVER TAG e texto de desvinculação quando tag_action for remove', () => {
    const removeNode = {
      ...defaultNode,
      data: {
        tag_action: 'remove',
        tag_ids: [1],
        tag_id: 1,
        tag_name: 'Lead Quente',
        tag_color: '#ef4444',
      },
    };

    render(
      <FunnelNodeTag
        node={removeNode}
        isSelected={false}
        onUpdateData={vi.fn()}
      />
    );

    expect(screen.getByText('REMOVER TAG')).toBeInTheDocument();
    expect(screen.getByText(/A tag "Lead Quente" será removida do aluno ao passar por aqui/i)).toBeInTheDocument();
  });

  it('permite ativar condição de tags, alternar modo e selecionar operador AND/OR', () => {
    const onUpdateData = vi.fn();
    const condNode = {
      ...defaultNode,
      data: {
        tag_action: 'condition',
        tag_ids: [1],
        tag_id: 1,
        tag_name: 'Lead Quente',
        has_condition: true,
        condition_mode: 'has_tags',
        condition_tag_ids: [1, 2],
        condition_operator: 'AND',
      },
    };

    render(
      <FunnelNodeTag
        node={condNode}
        isSelected={true}
        onUpdateData={onUpdateData}
      />
    );

    expect(screen.getByText('VERIFICAR TAG')).toBeInTheDocument();
    expect(screen.getByText('BIFURCAÇÃO')).toBeInTheDocument();
    expect(screen.getByTestId('node-output-handle-yes-tag_node_1')).toBeInTheDocument();
    expect(screen.getByTestId('node-output-handle-no-tag_node_1')).toBeInTheDocument();
    expect(screen.getByTestId('condition-mode-has-tag_node_1')).toBeInTheDocument();
    expect(screen.getByTestId('condition-mode-nothas-tag_node_1')).toBeInTheDocument();

    // Alternar para NÃO possui
    fireEvent.click(screen.getByTestId('condition-mode-nothas-tag_node_1'));
    expect(onUpdateData).toHaveBeenCalledWith('tag_node_1', expect.objectContaining({
      condition_mode: 'not_has_tags',
    }));

    // Alternar para OR
    const orBtn = screen.getByTestId('condition-operator-or-tag_node_1');
    fireEvent.click(orBtn);
    expect(onUpdateData).toHaveBeenCalledWith('tag_node_1', expect.objectContaining({
      condition_operator: 'OR',
    }));
  });

  it('permite alternar para a aba Verificar Tag e dispara conexão pela saída SIM e NÃO', () => {
    const onUpdateData = vi.fn();
    const onStartConnect = vi.fn();

    const { rerender } = render(
      <FunnelNodeTag
        node={defaultNode}
        isSelected={false}
        onUpdateData={onUpdateData}
        onStartConnect={onStartConnect}
      />
    );

    // Clica na 3ª aba: Verificar Tag
    const conditionTabBtn = screen.getByTestId('funnel-node-tag-action-condition-tag_node_1');
    fireEvent.click(conditionTabBtn);
    expect(onUpdateData).toHaveBeenCalledWith('tag_node_1', expect.objectContaining({
      tag_action: 'condition',
    }));

    // Re-renderiza com tag_action = 'condition'
    const conditionNode = {
      ...defaultNode,
      data: {
        ...defaultNode.data,
        tag_action: 'condition',
      },
    };

    rerender(
      <FunnelNodeTag
        node={conditionNode}
        isSelected={true}
        onUpdateData={onUpdateData}
        onStartConnect={onStartConnect}
      />
    );

    const yesHandle = screen.getByTestId('node-output-handle-yes-tag_node_1');
    const noHandle = screen.getByTestId('node-output-handle-no-tag_node_1');
    expect(yesHandle).toBeInTheDocument();
    expect(noHandle).toBeInTheDocument();

    // Clica na saída SIM
    fireEvent.click(yesHandle);
    expect(onStartConnect).toHaveBeenCalledWith('tag_node_1', expect.anything(), conditionNode, 'output_yes');

    // Clica na saída NÃO
    fireEvent.click(noHandle);
    expect(onStartConnect).toHaveBeenCalledWith('tag_node_1', expect.anything(), conditionNode, 'output_no');
  });
});
