import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatDmAdminSupportList from './ChatDmAdminSupportList';

describe('ChatDmAdminSupportList Component', () => {
  const sampleData = [
    {
      student: { id: 10, name: 'Aluno Carlos', avatar_url: null, role: 'aluno' },
      admin: { id: 2, name: 'Admin Jordão', avatar_url: null, role: 'admin' },
      last_message: 'Mensagem de teste',
      last_message_at: '2026-11-10T12:00:00Z',
      unread_by_admin: 1,
    },
  ];

  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
    vi.stubGlobal('fetch', vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/chat/dm/admin-conversations')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(sampleData),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    }));
  });

  it('fetches and renders admin support conversations list', async () => {
    const onSelect = vi.fn();
    render(<ChatDmAdminSupportList onSelectConversation={onSelect} />);

    await waitFor(() => {
      expect(screen.getByText('Aluno Carlos')).toBeInTheDocument();
      expect(screen.getByText('Admin Jordão')).toBeInTheDocument();
    });

    const conversationCard = screen.getByTestId('admin-dm-conversation-10-2');
    fireEvent.click(conversationCard);
    expect(onSelect).toHaveBeenCalled();
  });

  it('filters by pending messages when clicking Pendentes tab', async () => {
    render(<ChatDmAdminSupportList onSelectConversation={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Aluno Carlos')).toBeInTheDocument();
    });

    const pendingBtn = screen.getByTestId('admin-filter-pending');
    fireEvent.click(pendingBtn);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('unread_only=true'),
      expect.any(Object)
    );
  });
});
