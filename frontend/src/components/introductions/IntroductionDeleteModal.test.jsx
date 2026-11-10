import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IntroductionDeleteModal from './IntroductionDeleteModal';

describe('IntroductionDeleteModal Component', () => {
  it('não renderiza nada se isOpen for false', () => {
    const { container } = render(
      <IntroductionDeleteModal isOpen={false} onCancel={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza título, descrição, botões de cancelar e excluir quando aberto', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    render(
      <IntroductionDeleteModal
        isOpen={true}
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Excluir Apresentação?"
      />
    );

    expect(screen.getByTestId('intro-confirm-delete-overlay')).toBeInTheDocument();
    expect(screen.getByText('Excluir Apresentação?')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza de que deseja excluir permanentemente/)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cancel-delete-post-btn'));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('confirm-delete-post-btn'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('exibe estado de loading e desativa botões quando isDeleting for true', () => {
    render(
      <IntroductionDeleteModal
        isOpen={true}
        isDeleting={true}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Excluindo...')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-post-btn')).toBeDisabled();
    expect(screen.getByTestId('cancel-delete-post-btn')).toBeDisabled();
  });
});
