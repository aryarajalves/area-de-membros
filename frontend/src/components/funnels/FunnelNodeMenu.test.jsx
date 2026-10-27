import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelNodeMenu from './FunnelNodeMenu';

describe('FunnelNodeMenu Component', () => {
  it('renderiza o cabeçalho "ADICIONAR NÓ", busca e categorias principais', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();

    render(<FunnelNodeMenu onSelectNode={onSelect} onClose={onClose} />);

    expect(screen.getByText('ADICIONAR NÓ')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar nó...')).toBeInTheDocument();
    expect(screen.getByText('GATILHOS')).toBeInTheDocument();
    expect(screen.getByText('CONTEÚDO')).toBeInTheDocument();
    expect(screen.getByText('Aluno Criado')).toBeInTheDocument();
    expect(screen.getByText('Texto')).toBeInTheDocument();
  });

  it('permite buscar nós e filtra os resultados corretamente', () => {
    render(<FunnelNodeMenu onSelectNode={vi.fn()} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText('Buscar nó...');
    fireEvent.change(searchInput, { target: { value: 'Webhook' } });

    expect(screen.getByText('Webhook Externo')).toBeInTheDocument();
    expect(screen.queryByText('Aluno Criado')).not.toBeInTheDocument();
  });

  it('isola o evento wheel com stopPropagation sem alterar forçadamente o scrollTop', () => {
    const { container } = render(<FunnelNodeMenu onSelectNode={vi.fn()} onClose={vi.fn()} />);
    const menuEl = container.querySelector('[data-testid="funnel-node-menu"]');

    const wheelEvent = new Event('wheel', { bubbles: true, cancelable: true });
    const stopPropagationSpy = vi.spyOn(wheelEvent, 'stopPropagation');

    menuEl.dispatchEvent(wheelEvent);
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('chama onSelectNode ao clicar em um nó do catálogo', () => {
    const onSelect = vi.fn();
    render(<FunnelNodeMenu onSelectNode={onSelect} onClose={vi.fn()} />);

    const button = screen.getByTestId('add-node-message');
    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledWith('message', undefined);
  });
});
