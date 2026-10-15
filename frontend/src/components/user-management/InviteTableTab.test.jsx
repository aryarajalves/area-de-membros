import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InviteTableTab from './InviteTableTab';

describe('InviteTableTab Component', () => {
  const mockInvites = [
    {
      id: 1,
      role: 'aluno',
      token: 'token_abc_1',
      is_used: false,
      is_expired: false,
      time_remaining: '23h 50m restantes',
      used_by_email: null,
      created_at: '2026-10-01T16:30:00Z', // 16:30 UTC -> 13:30 em Brasília
    },
    {
      id: 2,
      role: 'aluno',
      token: 'token_abc_2',
      is_used: true,
      is_expired: false,
      time_remaining: '10h restantes',
      used_by_email: 'aluno@teste.com',
      created_at: '2026-10-01T01:15:00Z', // 01:15 UTC -> 22:15 do dia anterior (30/09/2026) em Brasília
    },
  ];

  it('renders student invite rows displaying creation date and time in Brasilia timezone', () => {
    render(
      <InviteTableTab
        filteredInvites={mockInvites}
        paginatedInvites={mockInvites}
        inviteStatusFilter="all"
        setInviteStatusFilter={vi.fn()}
        selectedInviteIds={[]}
        setSelectedInviteIds={vi.fn()}
        paginatedInviteIds={[1, 2]}
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

    // Valida que o primeiro convite (16:30 UTC) exibe 13:30 no fuso de Brasília
    const inviteCell1 = screen.getByTestId('invite-created-at-1');
    expect(inviteCell1).toHaveTextContent('01/10/2026 às 13:30');

    // Valida que o segundo convite (01:15 UTC) exibe 30/09/2026 às 22:15 no fuso de Brasília
    const inviteCell2 = screen.getByTestId('invite-created-at-2');
    expect(inviteCell2).toHaveTextContent('30/09/2026 às 22:15');
  });

  it('handles empty invites state and status filter change', () => {
    const handleFilterChange = vi.fn();
    const handleSetPage = vi.fn();

    render(
      <InviteTableTab
        filteredInvites={[]}
        paginatedInvites={[]}
        inviteStatusFilter="all"
        setInviteStatusFilter={handleFilterChange}
        selectedInviteIds={[]}
        setSelectedInviteIds={vi.fn()}
        paginatedInviteIds={[]}
        isAllInvitesSelected={false}
        toggleSelectAllInvites={vi.fn()}
        toggleSelectInvite={vi.fn()}
        handleBulkDeleteInvites={vi.fn()}
        handleDeleteInvite={vi.fn()}
        copyToClipboard={vi.fn()}
        invitesPage={1}
        setInvitesPage={handleSetPage}
        totalInvitePages={1}
        pageSize={20}
      />
    );

    expect(
      screen.getByText('Nenhum convite encontrado com os filtros selecionados.')
    ).toBeInTheDocument();

    const select = screen.getByTestId('filter-invite-status-select');
    fireEvent.change(select, { target: { value: 'pending' } });
    expect(handleFilterChange).toHaveBeenCalledWith('pending');
    expect(handleSetPage).toHaveBeenCalledWith(1);
  });

  it('renders table within users-table-wrapper and contains responsive action classes', () => {
    const { container } = render(
      <InviteTableTab
        filteredInvites={mockInvites}
        paginatedInvites={mockInvites}
        inviteStatusFilter="all"
        setInviteStatusFilter={vi.fn()}
        selectedInviteIds={[]}
        setSelectedInviteIds={vi.fn()}
        paginatedInviteIds={[1, 2]}
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

    const wrapper = container.querySelector('.users-table-wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.querySelector('.users-table')).toBeInTheDocument();

    const actionsHeader = container.querySelector('.table-actions-header');
    expect(actionsHeader).toBeInTheDocument();
    expect(actionsHeader).toHaveTextContent('Ações');

    const actionCells = container.querySelectorAll('.table-actions-cell');
    expect(actionCells.length).toBeGreaterThan(0);
  });

  it('renders copy invite button for all invites including used and expired invites', () => {
    const mockCopy = vi.fn();
    const testInvites = [
      {
        id: 10,
        role: 'aluno',
        token: 'token_active',
        is_used: false,
        is_expired: false,
        time_remaining: '24h',
        used_by_email: null,
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 20,
        role: 'aluno',
        token: 'token_used',
        is_used: true,
        is_expired: false,
        time_remaining: '12h',
        used_by_email: 'user@used.com',
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 30,
        role: 'aluno',
        token: 'token_expired',
        is_used: false,
        is_expired: true,
        time_remaining: 'Expirado',
        used_by_email: null,
        created_at: '2026-10-01T10:00:00Z',
      },
      {
        id: 40,
        role: 'aluno',
        token: 'token_used_and_expired',
        is_used: true,
        is_expired: true,
        time_remaining: 'Expirado',
        used_by_email: 'expired@used.com',
        created_at: '2026-10-01T10:00:00Z',
      },
    ];

    render(
      <InviteTableTab
        filteredInvites={testInvites}
        paginatedInvites={testInvites}
        inviteStatusFilter="all"
        setInviteStatusFilter={vi.fn()}
        selectedInviteIds={[]}
        setSelectedInviteIds={vi.fn()}
        paginatedInviteIds={[10, 20, 30, 40]}
        isAllInvitesSelected={false}
        toggleSelectAllInvites={vi.fn()}
        toggleSelectInvite={vi.fn()}
        handleBulkDeleteInvites={vi.fn()}
        handleDeleteInvite={vi.fn()}
        copyToClipboard={mockCopy}
        invitesPage={1}
        setInvitesPage={vi.fn()}
        totalInvitePages={1}
        pageSize={20}
      />
    );

    const copyBtnActive = screen.getByTestId('copy-row-invite-10');
    const copyBtnUsed = screen.getByTestId('copy-row-invite-20');
    const copyBtnExpired = screen.getByTestId('copy-row-invite-30');
    const copyBtnUsedAndExpired = screen.getByTestId('copy-row-invite-40');

    expect(copyBtnActive).toBeInTheDocument();
    expect(copyBtnUsed).toBeInTheDocument();
    expect(copyBtnExpired).toBeInTheDocument();
    expect(copyBtnUsedAndExpired).toBeInTheDocument();

    fireEvent.click(copyBtnUsedAndExpired);
    expect(mockCopy).toHaveBeenCalledWith(
      expect.stringContaining('register?token=token_used_and_expired')
    );
  });
});

