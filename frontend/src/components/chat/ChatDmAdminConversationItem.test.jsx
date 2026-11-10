import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatDmAdminConversationItem from './ChatDmAdminConversationItem';

describe('ChatDmAdminConversationItem Component', () => {
  const sampleConversation = {
    student: {
      id: 10,
      name: 'Mariana Aluna',
      avatar_url: null,
      role: 'aluno',
    },
    admin: {
      id: 2,
      name: 'Professor Jordao',
      avatar_url: null,
      role: 'admin',
    },
    last_message: 'Professor, estou com dúvida no exercício',
    last_message_at: '2026-11-10T14:00:00Z',
    unread_by_admin: 2,
  };

  it('renders student name, admin name, message preview and unread badge', () => {
    const handleSelect = vi.fn();
    render(
      <ChatDmAdminConversationItem
        conversation={sampleConversation}
        onSelect={handleSelect}
      />
    );

    expect(screen.getByText('Mariana Aluna')).toBeInTheDocument();
    expect(screen.getByText('Professor Jordao')).toBeInTheDocument();
    expect(screen.getByText('Professor, estou com dúvida no exercício')).toBeInTheDocument();
    expect(screen.getByTestId('unread-badge-10-2')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('triggers onSelect when clicked', () => {
    const handleSelect = vi.fn();
    render(
      <ChatDmAdminConversationItem
        conversation={sampleConversation}
        onSelect={handleSelect}
      />
    );

    const card = screen.getByTestId('admin-dm-conversation-10-2');
    fireEvent.click(card);

    expect(handleSelect).toHaveBeenCalledWith(sampleConversation);
  });
});
