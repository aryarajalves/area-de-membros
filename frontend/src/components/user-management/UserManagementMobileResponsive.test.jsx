import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import UserTableTab from './UserTableTab';
import InviteTableTab from './InviteTableTab';

describe('User Management Mobile Responsive Rules & Components', () => {
  it('ensures responsive.css eliminates sticky action column on mobile to prevent overlay bugs', () => {
    const cssPath = path.resolve(__dirname, '../../styles/responsive.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');

    // Valida que sticky na coluna de ações foi desativado no mobile
    expect(cssContent).toContain('.users-table th.table-actions-header');
    expect(cssContent).toContain('.users-table td.table-actions-cell');
    expect(cssContent).toContain('position: static !important');

    // Garante que não há sticky na coluna de ações na tabela de usuários
    const stickyActionsRegex = /\.users-table (?:th|td)\.table-actions-(?:header|cell)\s*\{[^}]*position:\s*sticky/i;
    expect(stickyActionsRegex.test(cssContent)).toBe(false);

    // Valida que o padding superior de .users-page no mobile garante respiro para o título
    expect(cssContent).toMatch(/\.users-page\s*\{\s*padding:\s*24px 14px 40px !important;/);

    // Valida que users-table-wrapper tem scroll horizontal suave configurado
    expect(cssContent).toContain('.users-table-wrapper');
    expect(cssContent).toContain('overflow-x: auto !important');
    expect(cssContent).toContain('scrollbar-width: thin !important');
  });

  it('renders UserTableTab with mobile responsive wrappers and action classes intact', () => {
    const mockUsers = [
      {
        id: 10,
        name: 'Aluno Teste',
        email: 'aluno@teste.com',
        role: 'aluno',
        is_active: true,
        phone: '11999998888',
        created_at: '2026-10-10T10:00:00Z',
      },
    ];

    const { container } = render(
      <UserTableTab
        currentUser={{ id: 1, role: 'superadmin' }}
        filteredUsers={mockUsers}
        paginatedUsers={mockUsers}
        userRoleFilter="all"
        setUserRoleFilter={vi.fn()}
        selectedUserIds={[]}
        setSelectedUserIds={vi.fn()}
        selectableUserIds={[10]}
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

    const tableWrapper = container.querySelector('.users-table-wrapper');
    expect(tableWrapper).toBeInTheDocument();

    const actionsHeader = container.querySelector('th.table-actions-header');
    expect(actionsHeader).toBeInTheDocument();

    const actionsCell = container.querySelector('td.table-actions-cell');
    expect(actionsCell).toBeInTheDocument();
  });

  it('renders InviteTableTab with mobile responsive wrappers and action classes intact', () => {
    const mockInvites = [
      {
        id: 20,
        role: 'aluno',
        token: 'token_inv_20',
        is_used: false,
        is_expired: false,
        time_remaining: '24h restantes',
        used_by_email: null,
        created_at: '2026-10-10T10:00:00Z',
      },
    ];

    const { container } = render(
      <InviteTableTab
        filteredInvites={mockInvites}
        paginatedInvites={mockInvites}
        inviteStatusFilter="all"
        setInviteStatusFilter={vi.fn()}
        selectedInviteIds={[]}
        setSelectedInviteIds={vi.fn()}
        paginatedInviteIds={[20]}
        isAllInvitesSelected={false}
        toggleSelectAllInvites={vi.fn()}
        toggleSelectInvite={vi.fn()}
        handleBulkDeleteInvites={vi.fn()}
        handleDeleteInvite={vi.fn()}
        copyToClipboard={vi.fn()}
        invitesPage={1}
        setInvitesPage={vi.fn()}
        totalInvitePages={1}
        pageSize={20}
      />
    );

    const tableWrapper = container.querySelector('.users-table-wrapper');
    expect(tableWrapper).toBeInTheDocument();

    const actionsHeader = container.querySelector('th.table-actions-header');
    expect(actionsHeader).toBeInTheDocument();

    const actionsCell = container.querySelector('td.table-actions-cell');
    expect(actionsCell).toBeInTheDocument();
  });
});
