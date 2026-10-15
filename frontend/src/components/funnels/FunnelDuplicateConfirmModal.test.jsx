import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelDuplicateConfirmModal from './FunnelDuplicateConfirmModal';

describe('FunnelDuplicateConfirmModal Component', () => {
  it('não renderiza nada quando isOpen é false', () => {
    const { container } = render(
      <FunnelDuplicateConfirmModal
        isOpen={false}
        funnelName="Funil VIP"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o modal com o nome do funil quando isOpen é true', () => {
    render(
      <FunnelDuplicateConfirmModal
        isOpen={true}
        funnelName="Funil de Boas-Vindas"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByTestId('funnel-duplicate-modal')).toBeInTheDocument();
    expect(screen.getByText('Duplicar Funil de Mensagens?')).toBeInTheDocument();
    expect(screen.getByText(/Funil de Boas-Vindas/i)).toBeInTheDocument();
    expect(screen.getByTestId('cancel-duplicate-funnel-btn')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-duplicate-funnel-btn')).toBeInTheDocument();
  });

  it('chama onClose ao clicar em Cancelar', () => {
    const onCloseMock = vi.fn();
    render(
      <FunnelDuplicateConfirmModal
        isOpen={true}
        funnelName="Funil Teste"
        onClose={onCloseMock}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('cancel-duplicate-funnel-btn'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('chama onConfirm ao clicar em Sim, Duplicar Funil', () => {
    const onConfirmMock = vi.fn();
    render(
      <FunnelDuplicateConfirmModal
        isOpen={true}
        funnelName="Funil Teste"
        onClose={vi.fn()}
        onConfirm={onConfirmMock}
      />
    );

    fireEvent.click(screen.getByTestId('confirm-duplicate-funnel-btn'));
    expect(onConfirmMock).toHaveBeenCalledTimes(1);
  });

  it('desativa botões e mostra texto de loading durante duplicação', () => {
    render(
      <FunnelDuplicateConfirmModal
        isOpen={true}
        funnelName="Funil Teste"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        duplicating={true}
      />
    );

    expect(screen.getByText('Duplicando...')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-duplicate-funnel-btn')).toBeDisabled();
    expect(screen.getByTestId('confirm-duplicate-funnel-btn')).toBeDisabled();
  });
});
