import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationsModal from './NotificationsModal';
import NotificationItemCard from './NotificationItemCard';

describe('NotificationsModal and NotificationItemCard Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  const mockItemMention = {
    id: 101,
    type: 'mention',
    message_id: 50,
    parent_id: null,
    channel_type: 'general',
    course_id: null,
    message_text: 'Olá @Aryaraj vem dar uma olhada nisso!',
    sender: { id: 2, name: 'Lucas Sousa', avatar_url: null, role: 'aluno' },
    created_at: new Date().toISOString(),
    is_read: false,
  };

  const mockItemThread = {
    id: 102,
    type: 'thread_reply',
    message_id: 51,
    parent_id: 40,
    channel_type: 'course',
    course_id: 1,
    message_text: 'Também tive essa mesma dúvida!',
    sender: { id: 3, name: 'Promovaweb', avatar_url: null, role: 'aluno' },
    created_at: new Date().toISOString(),
    is_read: true,
  };

  it('renders NotificationItemCard correctly for mention and thread reply', () => {
    const handleSelect = vi.fn();
    const handleMarkRead = vi.fn();

    const { rerender } = render(
      <NotificationItemCard
        item={mockItemMention}
        onSelect={handleSelect}
        onMarkRead={handleMarkRead}
      />
    );

    expect(screen.getByText('Lucas Sousa')).toBeInTheDocument();
    expect(screen.getByText(/mencionou você no chat/i)).toBeInTheDocument();
    expect(screen.getByText(/"Olá @Aryaraj vem dar uma olhada nisso!"/i)).toBeInTheDocument();

    const markBtn = screen.getByText(/Marcar lida/i);
    fireEvent.click(markBtn);
    expect(handleMarkRead).toHaveBeenCalledWith(mockItemMention);

    // Rerender com thread_reply lida
    rerender(
      <NotificationItemCard
        item={mockItemThread}
        onSelect={handleSelect}
        onMarkRead={handleMarkRead}
      />
    );

    expect(screen.getByText('Promovaweb')).toBeInTheDocument();
    expect(screen.getByText(/respondeu à sua thread/i)).toBeInTheDocument();
  });

  it('renders NotificationsModal with tabs, counts and fetches list', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/counts')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ inbox: 2, mentions: 1, threads: 1, total_unread: 2 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [mockItemMention],
      });
    });

    render(
      <NotificationsModal
        isOpen={true}
        onClose={vi.fn()}
        onNavigateToMessage={vi.fn()}
      />
    );

    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(screen.getByTestId('tab-inbox')).toBeInTheDocument();
    expect(screen.getByTestId('tab-mentions')).toBeInTheDocument();
    expect(screen.getByTestId('tab-threads')).toBeInTheDocument();
    expect(screen.getByTestId('tab-all')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Lucas Sousa')).toBeInTheDocument();
      expect(screen.getByTestId('mark-all-read-btn')).toBeInTheDocument();
    });
  });

  it('locks body scroll when open and restores it when unmounted', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(
      <NotificationsModal
        isOpen={true}
        onClose={vi.fn()}
        onNavigateToMessage={vi.fn()}
      />
    );

    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});
