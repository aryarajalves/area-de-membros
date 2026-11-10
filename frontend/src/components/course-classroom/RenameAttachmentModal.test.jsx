import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RenameAttachmentModal from './RenameAttachmentModal';

describe('RenameAttachmentModal Component', () => {
  const mockAttachment = {
    id: 10,
    title: 'Checklist Bússola Astrológica (1).pdf',
    file_type: 'pdf'
  };

  it('não renderiza quando isOpen é falso', () => {
    const { container } = render(
      <RenameAttachmentModal
        isOpen={false}
        attachment={mockAttachment}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o título do modal e pré-carrega o nome atual do anexo', () => {
    render(
      <RenameAttachmentModal
        isOpen={true}
        attachment={mockAttachment}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Renomear Material Complementar')).toBeInTheDocument();
    const input = screen.getByTestId('rename-attachment-input');
    expect(input).toHaveValue('Checklist Bússola Astrológica (1).pdf');
    expect(screen.getByText('PDF')).toBeInTheDocument();
  });

  it('exibe erro caso o usuário tente salvar com o campo vazio', () => {
    const handleConfirm = vi.fn();
    render(
      <RenameAttachmentModal
        isOpen={true}
        attachment={mockAttachment}
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByTestId('rename-attachment-input');
    fireEvent.change(input, { target: { value: '   ' } });

    const form = input.closest('form');
    fireEvent.submit(form);

    expect(screen.getByTestId('rename-attachment-error')).toHaveTextContent(
      'O nome do material complementar não pode ser vazio.'
    );
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it('chama onConfirm com o novo nome limpo ao submeter com sucesso', () => {
    const handleConfirm = vi.fn();
    render(
      <RenameAttachmentModal
        isOpen={true}
        attachment={mockAttachment}
        onConfirm={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByTestId('rename-attachment-input');
    fireEvent.change(input, { target: { value: 'Checklist Oficial Completo.pdf' } });

    const saveBtn = screen.getByTestId('confirm-rename-modal-btn');
    fireEvent.click(saveBtn);

    expect(handleConfirm).toHaveBeenCalledWith('Checklist Oficial Completo.pdf');
  });

  it('chama onCancel ao clicar no botão Cancelar ou no botão X', () => {
    const handleCancel = vi.fn();
    render(
      <RenameAttachmentModal
        isOpen={true}
        attachment={mockAttachment}
        onConfirm={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const cancelBtn = screen.getByTestId('cancel-rename-modal-btn');
    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledTimes(1);

    const closeBtn = screen.getByTestId('close-rename-modal-btn');
    fireEvent.click(closeBtn);
    expect(handleCancel).toHaveBeenCalledTimes(2);
  });

  it('desabilita os botões durante o estado de loading', () => {
    render(
      <RenameAttachmentModal
        isOpen={true}
        attachment={mockAttachment}
        loading={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText('Salvando...')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-rename-modal-btn')).toBeDisabled();
    expect(screen.getByTestId('cancel-rename-modal-btn')).toBeDisabled();
  });
});
