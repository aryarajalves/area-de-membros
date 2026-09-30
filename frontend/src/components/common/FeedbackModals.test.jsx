import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UploadProgressModal, FileDeleteConfirmModal, ActionConfirmModal } from './FeedbackModals';

describe('FeedbackModals Components', () => {
  describe('UploadProgressModal', () => {
    it('does not render when isOpen is false', () => {
      render(
        <UploadProgressModal
          isOpen={false}
          title="Enviando arquivo..."
        />
      );
      expect(screen.queryByTestId('upload-progress-modal')).not.toBeInTheDocument();
    });

    it('renders with title, subtitle and animated progress bar when isOpen is true', () => {
      render(
        <UploadProgressModal
          isOpen={true}
          title="Enviando vídeo da aula..."
          subtitle="Aguarde o envio seguro para o Backblaze B2."
        />
      );

      const modal = screen.getByTestId('upload-progress-modal');
      expect(modal).toBeInTheDocument();
      expect(screen.getByText('Enviando vídeo da aula...')).toBeInTheDocument();
      expect(screen.getByText('Aguarde o envio seguro para o Backblaze B2.')).toBeInTheDocument();
    });
  });

  describe('FileDeleteConfirmModal', () => {
    it('does not render when isOpen is false', () => {
      render(
        <FileDeleteConfirmModal
          isOpen={false}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.queryByTestId('file-delete-confirm-modal')).not.toBeInTheDocument();
    });

    it('renders confirmation modal with single cancel and single confirm button', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      render(
        <FileDeleteConfirmModal
          isOpen={true}
          title="Remover Arquivo?"
          message="Tem certeza que deseja apagar este arquivo permanentemente?"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );

      expect(screen.getByTestId('file-delete-confirm-modal')).toBeInTheDocument();
      expect(screen.getByText('Remover Arquivo?')).toBeInTheDocument();
      expect(screen.getByText('Tem certeza que deseja apagar este arquivo permanentemente?')).toBeInTheDocument();

      // Clicar em Cancelar
      const cancelBtn = screen.getByTestId('cancel-file-delete-btn');
      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalledTimes(1);

      // Clicar em Confirmar
      const confirmBtn = screen.getByTestId('confirm-file-delete-btn');
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it('disables buttons and shows loading state during deletion', () => {
      render(
        <FileDeleteConfirmModal
          isOpen={true}
          loading={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      const cancelBtn = screen.getByTestId('cancel-file-delete-btn');
      const confirmBtn = screen.getByTestId('confirm-file-delete-btn');

      expect(cancelBtn).toBeDisabled();
      expect(confirmBtn).toBeDisabled();
      expect(screen.getByText('Excluindo...')).toBeInTheDocument();
    });
  });

  describe('ActionConfirmModal', () => {
    it('does not render when isOpen is false', () => {
      render(
        <ActionConfirmModal
          isOpen={false}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.queryByTestId('action-confirm-modal')).not.toBeInTheDocument();
    });

    it('renders confirmation modal and handles cancel and confirm clicks', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      render(
        <ActionConfirmModal
          isOpen={true}
          title="Marcar como Resolvido?"
          message="Deseja confirmar a resolução deste problema?"
          confirmLabel="Marcar como Resolvido"
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      );

      expect(screen.getByTestId('action-confirm-modal')).toBeInTheDocument();
      expect(screen.getByText('Marcar como Resolvido?')).toBeInTheDocument();
      expect(screen.getByText('Deseja confirmar a resolução deste problema?')).toBeInTheDocument();

      const cancelBtn = screen.getByTestId('cancel-action-confirm-btn');
      fireEvent.click(cancelBtn);
      expect(handleCancel).toHaveBeenCalledTimes(1);

      const confirmBtn = screen.getByTestId('confirm-action-btn');
      fireEvent.click(confirmBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
