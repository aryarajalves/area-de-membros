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
    expect(screen.getByText('Primeiro Login (1º Acesso)')).toBeInTheDocument();
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

  it('permite selecionar o nó de Primeiro Login (1º Acesso) no menu', () => {
    const onSelect = vi.fn();
    render(<FunnelNodeMenu onSelectNode={onSelect} onClose={vi.fn()} />);

    const button = screen.getByTestId('add-node-trigger_first_login');
    fireEvent.click(button);

    expect(onSelect).toHaveBeenCalledWith('trigger_first_login', { trigger_event: 'first_login' });
  });

  it('permite filtrar os nós por dropdown de categoria (Todas, Gatilhos, Conteúdo, Ações, Fluxo)', () => {
    render(<FunnelNodeMenu onSelectNode={vi.fn()} onClose={vi.fn()} />);

    // Seletor dropdown de categorias está visível
    const select = screen.getByTestId('funnel-node-category-select');
    expect(select).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Todas as Categorias/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /GATILHOS/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /CONTEÚDO/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /AÇÕES & CONTATOS/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /FLUXO E TEMPO/i })).toBeInTheDocument();

    // Seleciona o filtro de Conteúdo
    fireEvent.change(select, { target: { value: 'CONTEÚDO' } });
    expect(screen.getByText('Texto')).toBeInTheDocument();
    expect(screen.getByText('Mídia')).toBeInTheDocument();
    expect(screen.queryByText('Aluno Criado')).not.toBeInTheDocument();
    expect(screen.queryByText('Webhook Externo')).not.toBeInTheDocument();

    // Seleciona o filtro de Gatilhos
    fireEvent.change(select, { target: { value: 'GATILHOS' } });
    expect(screen.getByText('Aluno Criado')).toBeInTheDocument();
    expect(screen.queryByText('Texto')).not.toBeInTheDocument();

    // Seleciona o filtro de Ações
    fireEvent.change(select, { target: { value: 'AÇÕES & CONTATOS' } });
    expect(screen.getByText('Webhook Externo')).toBeInTheDocument();
    expect(screen.queryByText('Aluno Criado')).not.toBeInTheDocument();

    // Seleciona de volta Todas as Categorias
    fireEvent.change(select, { target: { value: 'ALL' } });
    expect(screen.getByText('Aluno Criado')).toBeInTheDocument();
    expect(screen.getByText('Texto')).toBeInTheDocument();
    expect(screen.getByText('Webhook Externo')).toBeInTheDocument();
  });

  it('permite arrastar a caixinha segurando com o botão esquerdo no cabeçalho', () => {
    const { container } = render(
      <div style={{ position: 'relative', width: '1000px', height: '800px' }}>
        <FunnelNodeMenu position={{ x: 300, y: 150 }} onSelectNode={vi.fn()} onClose={vi.fn()} />
      </div>
    );

    const menuEl = screen.getByTestId('funnel-node-menu');
    const header = screen.getByTestId('funnel-node-menu-header');

    // Simula getBoundingClientRect
    menuEl.getBoundingClientRect = vi.fn().mockReturnValue({
      left: 300,
      top: 150,
      width: 275,
      height: 400,
    });

    // Pressiona botão esquerdo do mouse (button 0) no cabeçalho
    fireEvent.mouseDown(header, {
      button: 0,
      clientX: 310,
      clientY: 160,
    });

    // Move o mouse pela janela
    fireEvent.mouseMove(window, {
      clientX: 360, // desloca +50 no X
      clientY: 210, // desloca +50 no Y
    });

    // Verifica que a posição do menu foi atualizada
    expect(menuEl.style.left).toBe('350px');
    expect(menuEl.style.top).toBe('200px');

    // Solta o botão do mouse
    fireEvent.mouseUp(window);
  });
});
