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
});
