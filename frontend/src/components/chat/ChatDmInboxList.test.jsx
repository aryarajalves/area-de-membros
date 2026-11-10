import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatDmInboxList from './ChatDmInboxList';

describe('ChatDmInboxList Component', () => {
  const sampleConversations = [
    {
      contact: { id: 5, name: 'Lucas Colega', role: 'aluno', avatar_url: null },
      last_message: 'Oi, tudo bem?',
      last_message_at: '2026-11-10T10:00:00Z',
      unread_count: 0,
    },
  ];

  it('renders conversations list when data is present', () => {
    const handleSelect = vi.fn();
    render(
      <ChatDmInboxList
        conversations={sampleConversations}
        loading={false}
        onSelectContact={handleSelect}
        onStartNewConversation={vi.fn()}
      />
    );

    expect(screen.getByText('Lucas Colega')).toBeInTheDocument();
    expect(screen.getByText('Oi, tudo bem?')).toBeInTheDocument();
  });

  it('renders empty state when no conversations and allows clicking new conversation', () => {
    const handleStartNew = vi.fn();
    render(
      <ChatDmInboxList
        conversations={[]}
        loading={false}
        activeTab="inbox"
        onSelectContact={vi.fn()}
        onStartNewConversation={handleStartNew}
      />
    );

    expect(screen.getByText('Nenhuma conversa na Inbox ainda.')).toBeInTheDocument();
    const newBtn = screen.getByTestId('dm-empty-state-new-conversation-btn');
    fireEvent.click(newBtn);
    expect(handleStartNew).toHaveBeenCalled();
  });
});
