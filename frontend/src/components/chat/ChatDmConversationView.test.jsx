import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatDmConversationView from './ChatDmConversationView';

describe('ChatDmConversationView Component', () => {
  const mockContact = {
    id: 5,
    name: 'Carlos Aluno',
    email: 'carlos@test.com',
    role: 'aluno',
  };

  const mockUser = {
    id: 1,
    name: 'Super Admin',
    email: 'admin@test.com',
    role: 'superadmin',
  };

  it('renders messages and interactive CTA button in private DM', () => {
    const mockMessages = [
      {
        id: 101,
        message: 'Olá Carlos, tudo bem?',
        created_at: '2026-10-06T10:00:00Z',
        user: { id: 1 },
      },
      {
        id: 102,
        message: 'Acesse nossa aula ao vivo:',
        button_text: 'Assistir Aula Ao Vivo',
        button_url: 'https://youtube.com/live/exemplo',
        button_action_type: 'url',
        created_at: '2026-10-06T10:01:00Z',
        user: { id: 1 },
      },
    ];

    render(
      <ChatDmConversationView
        selectedContact={mockContact}
        currentUser={mockUser}
        messages={mockMessages}
        loading={false}
        onSendMessage={vi.fn()}
      />
    );

    expect(screen.getByText('Olá Carlos, tudo bem?')).toBeInTheDocument();
    expect(screen.getByText('Acesse nossa aula ao vivo:')).toBeInTheDocument();

    const ctaBtn = screen.getByTestId('dm-cta-button-102');
    expect(ctaBtn).toBeInTheDocument();
    expect(ctaBtn).toHaveTextContent('Assistir Aula Ao Vivo');
    expect(ctaBtn).toHaveAttribute('href', 'https://youtube.com/live/exemplo');
    expect(ctaBtn).toHaveAttribute('target', '_blank');
  });

  it('handles message submission', async () => {
    const onSendMessage = vi.fn().mockResolvedValue(true);
    render(
      <ChatDmConversationView
        selectedContact={mockContact}
        currentUser={mockUser}
        messages={[]}
        loading={false}
        onSendMessage={onSendMessage}
      />
    );

    const input = screen.getByTestId('dm-message-input');
    fireEvent.change(input, { target: { value: 'Nova mensagem teste' } });

    const sendBtn = screen.getByTestId('dm-send-btn');
    fireEvent.click(sendBtn);

    expect(onSendMessage).toHaveBeenCalledWith('Nova mensagem teste');
  });
});
