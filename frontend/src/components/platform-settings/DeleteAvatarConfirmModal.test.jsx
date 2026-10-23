import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DeleteAvatarConfirmModal from './DeleteAvatarConfirmModal';

describe('DeleteAvatarConfirmModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(
      <DeleteAvatarConfirmModal
        isOpen={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByTestId('delete-avatar-confirm-modal')).not.toBeInTheDocument();
  });

  it('renders modal with title, message, avatar preview and action buttons when open', () => {
    render(
      <DeleteAvatarConfirmModal
        isOpen={true}
        avatarUrl="https://cdn.example.com/avatar.jpg"
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('delete-avatar-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Remover Foto de Perfil?')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza de que deseja remover sua foto de perfil atual/i)).toBeInTheDocument();
    expect(screen.getByAltText('Miniatura atual')).toHaveAttribute('src', 'https://cdn.example.com/avatar.jpg');
    expect(screen.getByTestId('cancel-delete-avatar-btn')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-avatar-btn')).toBeInTheDocument();
  });

  it('calls onClose when Cancel button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <DeleteAvatarConfirmModal
        isOpen={true}
        onConfirm={vi.fn()}
        onClose={handleClose}
      />
    );

    fireEvent.click(screen.getByTestId('cancel-delete-avatar-btn'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const handleConfirm = vi.fn();
    render(
      <DeleteAvatarConfirmModal
        isOpen={true}
        onConfirm={handleConfirm}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('confirm-delete-avatar-btn'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('disables buttons and displays loading indicator when loading is true', () => {
    render(
      <DeleteAvatarConfirmModal
        isOpen={true}
        loading={true}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('cancel-delete-avatar-btn')).toBeDisabled();
    expect(screen.getByTestId('confirm-delete-avatar-btn')).toBeDisabled();
    expect(screen.getByText('Removendo...')).toBeInTheDocument();
  });
});
