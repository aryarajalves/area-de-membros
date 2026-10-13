import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LogoutConfirmModal from './LogoutConfirmModal';

describe('LogoutConfirmModal Component', () => {
  it('does not render anything when isOpen is false', () => {
    const { container } = render(
      <LogoutConfirmModal isOpen={false} onConfirm={() => {}} onClose={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog properly when isOpen is true', () => {
    render(
      <LogoutConfirmModal isOpen={true} onConfirm={() => {}} onClose={() => {}} />
    );

    expect(screen.getByTestId('logout-modal-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('logout-modal-content')).toBeInTheDocument();
    expect(screen.getByTestId('logout-modal-title')).toHaveTextContent('Encerrar Sessão');
    expect(screen.getByTestId('logout-modal-message')).toHaveTextContent(
      'Tem certeza que deseja sair do sistema?'
    );
    expect(screen.getByTestId('cancel-logout-btn')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-logout-btn')).toBeInTheDocument();
  });

  it('ensures z-index is set to 2000 on overlay to stay above mobile sidebar drawer', () => {
    render(
      <LogoutConfirmModal isOpen={true} onConfirm={() => {}} onClose={() => {}} />
    );

    const overlay = screen.getByTestId('logout-modal-overlay');
    expect(overlay).toHaveStyle({ zIndex: '2000' });
    expect(overlay.className).toContain('logout-modal-overlay');
  });

  it('calls onClose when clicking Cancel button', () => {
    const handleClose = vi.fn();
    render(
      <LogoutConfirmModal isOpen={true} onConfirm={() => {}} onClose={handleClose} />
    );

    const cancelBtn = screen.getByTestId('cancel-logout-btn');
    fireEvent.click(cancelBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when clicking Confirm button', () => {
    const handleConfirm = vi.fn();
    render(
      <LogoutConfirmModal isOpen={true} onConfirm={handleConfirm} onClose={() => {}} />
    );

    const confirmBtn = screen.getByTestId('confirm-logout-btn');
    fireEvent.click(confirmBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it('does NOT trigger onClose when clicking the backdrop overlay (rule: close only via buttons)', () => {
    const handleClose = vi.fn();
    render(
      <LogoutConfirmModal isOpen={true} onConfirm={() => {}} onClose={handleClose} />
    );

    const overlay = screen.getByTestId('logout-modal-overlay');
    fireEvent.click(overlay);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('disables buttons and shows loading text when loading is true', () => {
    render(
      <LogoutConfirmModal
        isOpen={true}
        onConfirm={() => {}}
        onClose={() => {}}
        loading={true}
      />
    );

    const cancelBtn = screen.getByTestId('cancel-logout-btn');
    const confirmBtn = screen.getByTestId('confirm-logout-btn');

    expect(cancelBtn).toBeDisabled();
    expect(confirmBtn).toBeDisabled();
    expect(confirmBtn).toHaveTextContent('Saindo...');
  });
});
