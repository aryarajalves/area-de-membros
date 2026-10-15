import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelNodeTagActionSection from './FunnelNodeTagActionSection';

describe('FunnelNodeTagActionSection Component', () => {
  const mockTags = [
    { id: 1, name: 'Lead Frio', color: '#3b82f6' },
    { id: 2, name: 'Comprador VIP', color: '#10b981' },
    { id: 3, name: 'Interesse Mentoria', color: '#f59e0b' },
  ];

  it('permite alternar entre Adicionar Tag e Remover Tag', () => {
    const onUpdateData = vi.fn();
    render(
      <FunnelNodeTagActionSection
        data={{ tag_action: 'add', tag_ids: [] }}
        tags={mockTags}
        nodeId="node_1"
        onUpdateData={onUpdateData}
        onOpenCreateTagModal={vi.fn()}
      />
    );

    const removeBtn = screen.getByTestId('funnel-node-tag-action-remove-node_1');
    fireEvent.click(removeBtn);

    expect(onUpdateData).toHaveBeenCalledWith('node_1', expect.objectContaining({
      tag_action: 'remove',
    }));
  });

  it('permite selecionar múltiplas tags no nó via dropdown', () => {
    const onUpdateData = vi.fn();
    render(
      <FunnelNodeTagActionSection
        data={{ tag_action: 'add', tag_ids: [1] }}
        tags={mockTags}
        nodeId="node_1"
        onUpdateData={onUpdateData}
        onOpenCreateTagModal={vi.fn()}
      />
    );

    const select = screen.getByTestId('funnel-node-tag-select-node_1');
    fireEvent.change(select, { target: { value: '2' } });

    expect(onUpdateData).toHaveBeenCalledWith('node_1', expect.objectContaining({
      tag_ids: [1, 2],
    }));
  });

  it('permite digitar no campo de busca e filtra as tags em tempo real', () => {
    render(
      <FunnelNodeTagActionSection
        data={{ tag_action: 'add', tag_ids: [] }}
        tags={mockTags}
        nodeId="node_1"
        onUpdateData={vi.fn()}
        onOpenCreateTagModal={vi.fn()}
      />
    );

    const searchInput = screen.getByTestId('funnel-node-tag-search-input-node_1');
    fireEvent.change(searchInput, { target: { value: 'Mentoria' } });

    // A lista filtrada deve aparecer com a tag correspondente
    expect(screen.getByTestId('funnel-node-tag-filtered-list-node_1')).toBeInTheDocument();
    expect(screen.getByText('Interesse Mentoria')).toBeInTheDocument();
    expect(screen.queryByText('Lead Frio')).not.toBeInTheDocument();
  });

  it('permite adicionar uma tag clicando no resultado filtrado', () => {
    const onUpdateData = vi.fn();
    render(
      <FunnelNodeTagActionSection
        data={{ tag_action: 'add', tag_ids: [] }}
        tags={mockTags}
        nodeId="node_1"
        onUpdateData={onUpdateData}
        onOpenCreateTagModal={vi.fn()}
      />
    );

    const searchInput = screen.getByTestId('funnel-node-tag-search-input-node_1');
    fireEvent.change(searchInput, { target: { value: 'VIP' } });

    const filterItem = screen.getByTestId('funnel-node-tag-filter-item-2');
    fireEvent.click(filterItem);

    expect(onUpdateData).toHaveBeenCalledWith('node_1', expect.objectContaining({
      tag_ids: [2],
      tag_id: 2,
      tag_name: 'Comprador VIP',
    }));
  });

  it('permite remover uma tag selecionada através do botão X do badge', () => {
    const onUpdateData = vi.fn();
    render(
      <FunnelNodeTagActionSection
        data={{ tag_action: 'add', tag_ids: [1, 2] }}
        tags={mockTags}
        nodeId="node_1"
        onUpdateData={onUpdateData}
        onOpenCreateTagModal={vi.fn()}
      />
    );

    const removeTag2Btn = screen.getByTestId('funnel-node-remove-selected-tag-2');
    fireEvent.click(removeTag2Btn);

    expect(onUpdateData).toHaveBeenCalledWith('node_1', expect.objectContaining({
      tag_ids: [1],
    }));
  });

  it('chama onOpenCreateTagModal com o texto digitado ao clicar no botão de criar', () => {
    const onOpenCreateTagModal = vi.fn();
    render(
      <FunnelNodeTagActionSection
        data={{ tag_action: 'add', tag_ids: [] }}
        tags={mockTags}
        nodeId="node_1"
        onUpdateData={vi.fn()}
        onOpenCreateTagModal={onOpenCreateTagModal}
      />
    );

    const searchInput = screen.getByTestId('funnel-node-tag-search-input-node_1');
    fireEvent.change(searchInput, { target: { value: 'Nova Tag Exclusiva' } });

    const openBtn = screen.getByTestId('funnel-node-open-create-tag-modal-btn-node_1');
    fireEvent.click(openBtn);

    expect(onOpenCreateTagModal).toHaveBeenCalledWith('Nova Tag Exclusiva');
  });

  it('chama onOpenCreateTagModal ao pressionar Enter no campo de busca', () => {
    const onOpenCreateTagModal = vi.fn();
    render(
      <FunnelNodeTagActionSection
        data={{ tag_action: 'add', tag_ids: [] }}
        tags={mockTags}
        nodeId="node_1"
        onUpdateData={vi.fn()}
        onOpenCreateTagModal={onOpenCreateTagModal}
      />
    );

    const searchInput = screen.getByTestId('funnel-node-tag-search-input-node_1');
    fireEvent.change(searchInput, { target: { value: 'Tag Via Enter' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(onOpenCreateTagModal).toHaveBeenCalledWith('Tag Via Enter');
  });

  it('exibe resumo condizente para múltiplas tags no modo remover', () => {
    render(
      <FunnelNodeTagActionSection
        data={{ tag_action: 'remove', tag_ids: [1, 2] }}
        tags={mockTags}
        nodeId="node_1"
        onUpdateData={vi.fn()}
        onOpenCreateTagModal={vi.fn()}
      />
    );

    expect(screen.getByText(/As tags "Lead Frio", "Comprador VIP" serão removidas do aluno ao passar por aqui/i)).toBeInTheDocument();
  });
});
