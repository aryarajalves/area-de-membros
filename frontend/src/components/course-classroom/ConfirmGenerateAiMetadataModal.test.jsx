import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmGenerateAiMetadataModal from './ConfirmGenerateAiMetadataModal';

describe('ConfirmGenerateAiMetadataModal Component', () => {
  it('não renderiza quando isOpen for false', () => {
    const { container } = render(
      <ConfirmGenerateAiMetadataModal
        isOpen={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o popup de confirmação com título, mensagem e botões quando isOpen for true', () => {
    render(
      <ConfirmGenerateAiMetadataModal
        isOpen={true}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('confirm-generate-ai-metadata-modal')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-generate-ai-metadata-title')).toHaveTextContent(
      'Gerar Título e Descrição com IA?'
    );
    expect(screen.getByTestId('confirm-generate-ai-metadata-message')).toHaveTextContent(
      'A Inteligência Artificial analisará a transcrição completa desta aula'
    );
    expect(screen.getByTestId('cancel-generate-ai-metadata-btn')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-generate-ai-metadata-btn')).toBeInTheDocument();
  });

  it('chama onClose ao clicar em Cancelar', () => {
    const onClose = vi.fn();
    render(
      <ConfirmGenerateAiMetadataModal
        isOpen={true}
        onConfirm={vi.fn()}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByTestId('cancel-generate-ai-metadata-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('chama onConfirm ao clicar no botão de confirmação', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmGenerateAiMetadataModal
        isOpen={true}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('confirm-generate-ai-metadata-btn'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('exibe estado de loading e desabilita botões durante a geração', () => {
    render(
      <ConfirmGenerateAiMetadataModal
        isOpen={true}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
        loading={true}
      />
    );

    const confirmBtn = screen.getByTestId('confirm-generate-ai-metadata-btn');
    const cancelBtn = screen.getByTestId('cancel-generate-ai-metadata-btn');

    expect(confirmBtn).toBeDisabled();
    expect(cancelBtn).toBeDisabled();
    expect(screen.getByText('Gerando com IA...')).toBeInTheDocument();
  });
});
