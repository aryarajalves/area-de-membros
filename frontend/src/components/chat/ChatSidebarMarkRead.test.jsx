import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatSidebar from './ChatSidebar';

describe('ChatSidebar Marcar Tudo Como Lido', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('chama /api/v1/chat/mark-all-read?scope=all e aciona onMarkAllRead ao clicar no botão', async () => {
    const onMarkAllRead = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ total_unread: 0 }),
    });

    render(
      <ChatSidebar
        channels={[
          { id: 'general', name: 'Comunidade Geral', type: 'general', unread_count: 1 },
        ]}
        selectedChannel={{ id: 'general', type: 'general' }}
        onSelectChannel={vi.fn()}
        onMarkAllRead={onMarkAllRead}
      />
    );

    const btn = screen.getByTestId('chat-mark-all-read-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/chat/mark-all-read?scope=all',
        expect.objectContaining({ method: 'POST' })
      );
      expect(onMarkAllRead).toHaveBeenCalledTimes(1);
    });
  });
});
