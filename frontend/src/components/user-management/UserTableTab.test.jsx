import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserTableTab from './UserTableTab';

describe('UserTableTab Component', () => {
  const mockUsers = [
    {
      id: 1,
      name: 'Super Usuário',
      email: 'super@test.com',
      role: 'superadmin',
      is_active: true,
      phone: null,
      created_at: '2026-09-29T10:00:00Z',
    },
    {
      id: 2,
      name: 'Aluno Com Zap',
      email: 'aluno@zap.com',
      role: 'aluno',
      is_active: true,
      phone: '+55 (11) 98765-4321',
      created_at: '2026-10-01T15:00:00Z',
    },
    {
      id: 3,
      name: 'Admin Sem Zap',
      email: 'admin@semzap.com',
      role: 'admin',
      is_active: true,
      phone: '',
      created_at: '2026-10-01T16:00:00Z',
    },
  ];

  it('renders WhatsApp column header and displays phone link or fallback dash', () => {
    render(
      <UserTableTab
        currentUser={{ id: 1, role: 'superadmin' }}
        filteredUsers={mockUsers}
        paginatedUsers={mockUsers}
        userRoleFilter="all"
        setUserRoleFilter={vi.fn()}
        selectedUserIds={[]}
        setSelectedUserIds={vi.fn()}
        selectableUserIds={[2, 3]}
        isAllUsersSelected={false}
        toggleSelectAllUsers={vi.fn()}
        toggleSelectUser={vi.fn()}
        handleBulkDeleteUsers={vi.fn()}
        handleOpenEdit={vi.fn()}
        handleRequestPasswordReset={vi.fn()}
        handleDeleteUser={vi.fn()}
        usersPage={1}
        setUsersPage={vi.fn()}
        totalUserPages={1}
        pageSize={20}
      />
    );

    // Valida o cabeçalho da coluna WhatsApp
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();

    // Valida link de WhatsApp quando coletado
    const zapLink = screen.getByTestId('user-whatsapp-link-2');
    expect(zapLink).toBeInTheDocument();
    expect(zapLink).toHaveTextContent('+55 (11) 98765-4321');
    expect(zapLink).toHaveAttribute('href', 'https://wa.me/5511987654321');
    expect(zapLink).toHaveAttribute('target', '_blank');

    // Valida fallback quando não possui WhatsApp coletado
    const noZap1 = screen.getByTestId('user-no-whatsapp-1');
    expect(noZap1).toHaveTextContent('—');

    const noZap3 = screen.getByTestId('user-no-whatsapp-3');
    expect(noZap3).toHaveTextContent('—');
  });
});
