import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AgentFlowCreateKbModal from './AgentFlowCreateKbModal';
import { ToastProvider } from '../../context/ToastContext';

describe('AgentFlowCreateKbModal Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <ToastProvider>
        <AgentFlowCreateKbModal
          isOpen={true}
          onClose={vi.fn()}
          courseTitle="Astrologia Moderna"
          isLightBg={false}
          onCreated={vi.fn()}
          {...props}
        />
      </ToastProvider>
    );
  };

  it('não deve renderizar quando isOpen for falso', () => {
    const { container } = render(
      <ToastProvider>
        <AgentFlowCreateKbModal
          isOpen={false}
          onClose={vi.fn()}
          onCreated={vi.fn()}
        />
      </ToastProvider>
    );
    expect(screen.queryByTestId('create-kb-modal-overlay')).not.toBeInTheDocument();
  });

  it('renderiza o formulário com o nome pré-preenchido baseado no curso', () => {
    renderComponent();

    expect(screen.getByText('Criar Base no AgentFlow')).toBeInTheDocument();
    const input = screen.getByTestId('input-new-kb-name');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Base: Astrologia Moderna');
  });

  it('submete o formulário com sucesso e dispara onCreated e onClose', async () => {
    const onCreated = vi.fn();
    const onClose = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 99, name: 'Base: Astrologia Moderna' })
    });

    renderComponent({ onCreated, onClose });

    const submitBtn = screen.getByTestId('btn-confirm-create-kb');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/agentflow/knowledge-bases',
        expect.objectContaining({
          method: 'POST'
        })
      );
      expect(onCreated).toHaveBeenCalledWith({ id: 99, name: 'Base: Astrologia Moderna' });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('não fecha o modal ao clicar no overlay de fundo (regra UX: popup não fecha por clique fora)', () => {
    const onClose = vi.fn();
    renderComponent({ onClose });

    const overlay = screen.getByTestId('create-kb-modal-overlay');
    fireEvent.click(overlay);

    expect(onClose).not.toHaveBeenCalled();
  });
});
