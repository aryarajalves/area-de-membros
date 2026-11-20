import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OnlineUsersModal from './OnlineUsersModal';

describe('OnlineUsersModal Component', () => {
  const mockOnlineUsers = [
    { id: 1, name: 'Aryaraj Admin', email: 'aryaraj@test.com', role: 'superadmin' },
    { id: 2, name: 'Carla Aluna', email: 'carla@test.com', role: 'aluno' },
    { id: 3, name: 'Bruno Aluno', email: 'bruno@test.com', role: 'aluno' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'fake-token');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOnlineUsers,
    });
  });

  it('renderiza lista de contatos online, filtra por perfil/busca e permite iniciar DM', async () => {
    const onClose = vi.fn();
    const onStartDm = vi.fn();

    render(
      <OnlineUsersModal
        isOpen={true}
        onClose={onClose}
        onStartDm={onStartDm}
      />
    );

    expect(screen.getByTestId('online-users-modal')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Aryaraj Admin')).toBeInTheDocument();
      expect(screen.getByText('Carla Aluna')).toBeInTheDocument();
      expect(screen.getByText('Bruno Aluno')).toBeInTheDocument();
    });

    // Filtra apenas Alunos
    fireEvent.click(screen.getByTestId('online-role-filter-aluno'));
    expect(screen.queryByText('Aryaraj Admin')).not.toBeInTheDocument();
    expect(screen.getByText('Carla Aluna')).toBeInTheDocument();

    // Busca por nome
    fireEvent.change(screen.getByTestId('search-online-users-input'), {
      target: { value: 'Carla' },
    });
    expect(screen.getByText('Carla Aluna')).toBeInTheDocument();
    expect(screen.queryByText('Bruno Aluno')).not.toBeInTheDocument();

    // Inicia DM direta com Carla
    fireEvent.click(screen.getByTestId('online-user-dm-btn-2'));
    expect(onStartDm).toHaveBeenCalledWith(mockOnlineUsers[1]);

    // Fecha pelo botão Fechar
    fireEvent.click(screen.getByTestId('close-online-users-modal-btn'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
