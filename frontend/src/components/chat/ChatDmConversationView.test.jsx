import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatDmConversationView from './ChatDmConversationView';
import { ToastProvider } from '../../context/ToastContext';

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
      <ToastProvider>
        <ChatDmConversationView
          selectedContact={mockContact}
          currentUser={mockUser}
          messages={mockMessages}
          loading={false}
          onSendMessage={vi.fn()}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Olá Carlos, tudo bem?')).toBeInTheDocument();
    expect(screen.getByText('Acesse nossa aula ao vivo:')).toBeInTheDocument();

    const ctaBtn = screen.getByTestId('dm-cta-button-102');
    expect(ctaBtn).toBeInTheDocument();
    expect(ctaBtn).toHaveTextContent('Assistir Aula Ao Vivo');
    expect(ctaBtn).toHaveAttribute('href', 'https://youtube.com/live/exemplo');
    expect(ctaBtn).toHaveAttribute('target', '_blank');

    // Valida o banner de criptografia de ponta a ponta
    expect(screen.getByTestId('dm-encryption-banner')).toBeInTheDocument();
    expect(screen.getByText('Mensagens e arquivos protegidos por criptografia de ponta a ponta')).toBeInTheDocument();
  });

  it('handles message submission and renders media input toolbar', async () => {
    const onSendMessage = vi.fn().mockResolvedValue(true);
    render(
      <ToastProvider>
        <ChatDmConversationView
          selectedContact={mockContact}
          currentUser={mockUser}
          messages={[]}
          loading={false}
          onSendMessage={onSendMessage}
        />
      </ToastProvider>
    );

    // Valida que a barra de ferramentas completa com todas as mídias está presente
    expect(screen.getByTestId('chat-input-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('chat-attach-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-image-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-gif-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-emoji-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-record-audio-btn')).toBeInTheDocument();
    expect(screen.getByTestId('chat-video-record-button')).toBeInTheDocument();

    const input = screen.getByTestId('chat-message-textarea');
    fireEvent.change(input, { target: { value: 'Nova mensagem teste' } });

    const sendBtn = screen.getByTestId('chat-send-button');
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(onSendMessage).toHaveBeenCalledWith('Nova mensagem teste', null, null);
    });
  });
});
