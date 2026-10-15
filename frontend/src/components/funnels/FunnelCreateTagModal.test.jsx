import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FunnelCreateTagModal from './FunnelCreateTagModal';

const mockAddToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
    removeToast: vi.fn(),
  }),
}));

describe('FunnelCreateTagModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockAddToast.mockClear();
  });

  it('não renderiza quando isOpen é falso', () => {
    const { container } = render(
      <FunnelCreateTagModal
        isOpen={false}
        onClose={vi.fn()}
        onTagCreated={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza corretamente quando isOpen é verdadeiro com nome inicial e preview', () => {
    render(
      <FunnelCreateTagModal
        isOpen={true}
        initialName="Super Aluno"
        onClose={vi.fn()}
        onTagCreated={vi.fn()}
      />
    );

    expect(screen.getByTestId('funnel-create-tag-modal')).toBeInTheDocument();
    expect(screen.getByText('Nova Etiqueta')).toBeInTheDocument();
    const input = screen.getByTestId('funnel-create-tag-name-input');
    expect(input.value).toBe('Super Aluno');

    // Preview
    const preview = screen.getByTestId('funnel-create-tag-preview');
    expect(preview).toHaveTextContent('Super Aluno');
  });

  it('permite escolher uma cor diferente da paleta e atualiza o preview', () => {
    render(
      <FunnelCreateTagModal
        isOpen={true}
        initialName="Teste Cor"
        onClose={vi.fn()}
        onTagCreated={vi.fn()}
      />
    );

    // Selecionar cor azul neon (#3b82f6)
    const blueBtn = screen.getByTestId('funnel-create-tag-color-#3b82f6');
    fireEvent.click(blueBtn);

    const preview = screen.getByTestId('funnel-create-tag-preview');
    expect(preview.style.borderColor).toMatch(/#3b82f6|rgb\(59,\s*130,\s*246\)/);
  });

  it('chama onClose ao clicar no botão Cancelar', () => {
    const onClose = vi.fn();
    render(
      <FunnelCreateTagModal
        isOpen={true}
        onClose={onClose}
        onTagCreated={vi.fn()}
      />
    );

    const cancelBtn = screen.getByTestId('funnel-create-tag-cancel-btn');
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cria a etiqueta via API POST com nome e cor selecionados e dispara onTagCreated', async () => {
    const onTagCreated = vi.fn();
    const onClose = vi.fn();
    const createdTag = { id: 77, name: 'VIP Ouro', color: '#f59e0b' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createdTag),
    });

    render(
      <FunnelCreateTagModal
        isOpen={true}
        initialName=""
        onClose={onClose}
        onTagCreated={onTagCreated}
      />
    );

    const input = screen.getByTestId('funnel-create-tag-name-input');
    fireEvent.change(input, { target: { value: 'VIP Ouro' } });

    // Selecionar cor âmbar (#f59e0b)
    fireEvent.click(screen.getByTestId('funnel-create-tag-color-#f59e0b'));

    const submitBtn = screen.getByTestId('funnel-create-tag-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/students/tags',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'VIP Ouro', color: '#f59e0b' }),
        })
      );
      expect(mockAddToast).toHaveBeenCalledWith('Etiqueta "VIP Ouro" criada com sucesso!', 'success');
      expect(onTagCreated).toHaveBeenCalledWith(createdTag);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('exibe toast de erro quando a API falha ao criar etiqueta', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Nome de etiqueta já existente' }),
    });

    render(
      <FunnelCreateTagModal
        isOpen={true}
        initialName="Tag Duplicada"
        onClose={vi.fn()}
        onTagCreated={vi.fn()}
      />
    );

    const submitBtn = screen.getByTestId('funnel-create-tag-submit-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith('Nome de etiqueta já existente', 'error');
    });
  });
});
