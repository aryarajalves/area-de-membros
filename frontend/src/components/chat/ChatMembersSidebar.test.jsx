import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatMembersSidebar from './ChatMembersSidebar';

describe('ChatMembersSidebar Component', () => {
  const mockChannel = {
    id: 'general',
    type: 'general',
    name: 'Comunidade Geral',
  };

  const mockCurrentUser = {
    id: 1,
    name: 'Super Mestre',
    role: 'superadmin',
  };

  const mockApiResponse = {
    channel_type: 'general',
    channel_name: 'Comunidade Geral',
    total_members: 3,
    superadmins: [
      { id: 1, name: 'Super Mestre', email: 'super@exemplo.com', role: 'superadmin', is_online: true },
    ],
    admins: [
      { id: 2, name: 'Admin Beatriz', email: 'beatriz@exemplo.com', role: 'admin', is_online: true },
    ],
    students: [
      { id: 3, name: 'Aluno Carlos', email: 'carlos@exemplo.com', role: 'aluno', is_online: false },
    ],
  };

  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      })
    );
  });

  it('não renderiza nada se isOpen for falso', () => {
    const { container } = render(
      <ChatMembersSidebar
        isOpen={false}
        channel={mockChannel}
        currentUser={mockCurrentUser}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza título, contador total e as seções de participantes', async () => {
    render(
      <ChatMembersSidebar
        isOpen={true}
        channel={mockChannel}
        currentUser={mockCurrentUser}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Membros do Chat')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Super Mestre')).toBeInTheDocument();
      expect(screen.getByText('Admin Beatriz')).toBeInTheDocument();
      expect(screen.getByText('Aluno Carlos')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Super Admin').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Administrador/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Aluno/i).length).toBeGreaterThan(0);
  });

  it('filtra participantes em tempo real com o campo de busca', async () => {
    render(
      <ChatMembersSidebar
        isOpen={true}
        channel={mockChannel}
        currentUser={mockCurrentUser}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Aluno Carlos')).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId('members-search-input');
    fireEvent.change(searchInput, { target: { value: 'Beatriz' } });

    expect(screen.getByText('Admin Beatriz')).toBeInTheDocument();
    expect(screen.queryByText('Aluno Carlos')).not.toBeInTheDocument();
  });

  it('aciona onSelectMember ao clicar no contato', async () => {
    const handleSelect = vi.fn();
    render(
      <ChatMembersSidebar
        isOpen={true}
        channel={mockChannel}
        currentUser={mockCurrentUser}
        onSelectMember={handleSelect}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Aluno Carlos')).toBeInTheDocument();
    });

    const memberItem = screen.getByTestId('chat-member-item-3');
    fireEvent.click(memberItem);

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, name: 'Aluno Carlos' })
    );
  });

  it('aciona onStartDm ao clicar no botão de DM rápida do contato', async () => {
    const handleStartDm = vi.fn();
    render(
      <ChatMembersSidebar
        isOpen={true}
        channel={mockChannel}
        currentUser={mockCurrentUser}
        onStartDm={handleStartDm}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('quick-dm-btn-3')).toBeInTheDocument();
    });

    const quickDmBtn = screen.getByTestId('quick-dm-btn-3');
    fireEvent.click(quickDmBtn);

    expect(handleStartDm).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, name: 'Aluno Carlos' })
    );
  });

  it('aciona onClose ao clicar no botão fechar da barra lateral', () => {
    const handleClose = vi.fn();
    render(
      <ChatMembersSidebar
        isOpen={true}
        channel={mockChannel}
        currentUser={mockCurrentUser}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByTestId('close-members-sidebar-btn');
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
