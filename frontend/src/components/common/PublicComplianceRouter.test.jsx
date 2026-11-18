import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockIsNativeApp } = vi.hoisted(() => ({
  mockIsNativeApp: vi.fn(),
}));

vi.mock('../../services/pushNotifications', () => ({
  isNativeApp: mockIsNativeApp,
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

import PublicComplianceRouter from './PublicComplianceRouter';
import BlockUserConfirmModal from '../community-feed/BlockUserConfirmModal';
import CourseSidebarUpsellCard from '../course-classroom/CourseSidebarUpsellCard';

describe('Play Store Compliance Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsNativeApp.mockReturnValue(false);
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'received', message: 'Solicitação registrada.' }),
    });
  });

  it('renderiza Política de Privacidade e Termos de Uso públicos', () => {
    const { rerender } = render(<PublicComplianceRouter pathname="/privacidade" onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /Política de Privacidade/i })).toBeInTheDocument();

    rerender(<PublicComplianceRouter pathname="/termos" onBack={vi.fn()} />);
    expect(screen.getByRole('heading', { name: /Termos de Uso/i })).toBeInTheDocument();
  });

  it('envia solicitação pública de exclusão de conta em /excluir-conta', async () => {
    render(<PublicComplianceRouter pathname="/excluir-conta" onBack={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('seu@email.com'), { target: { value: 'aluno@teste.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Solicitar Exclusão/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/auth/public-account-deletion',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(await screen.findByText('Solicitação registrada.')).toBeInTheDocument();
  });

  it('chama API de bloqueio no BlockUserConfirmModal', async () => {
    const onBlocked = vi.fn();
    const onClose = vi.fn();
    render(
      <BlockUserConfirmModal
        isOpen
        targetUser={{ id: 42, name: 'Usuário Spam' }}
        onBlocked={onBlocked}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByTestId('confirm-block-user-btn'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/blocks/42', expect.objectContaining({ method: 'POST' }));
    });
    expect(onBlocked).toHaveBeenCalledWith(42);
  });

  it('oculta CourseSidebarUpsellCard quando rodando no App Android nativo', () => {
    mockIsNativeApp.mockReturnValue(true);
    const { container } = render(
      <CourseSidebarUpsellCard offer={{ id: 1, title: 'Curso Extra', button_url: 'https://checkout.com' }} />,
    );
    expect(container.firstChild).toBeNull();
  });
});
