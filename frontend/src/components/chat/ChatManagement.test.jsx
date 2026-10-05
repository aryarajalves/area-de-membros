import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatManagement from './ChatManagement';
import { ToastProvider } from '../../context/ToastContext';

const mockCurrentUser = {
  id: 1,
  name: 'Aryaraj Alves',
  email: 'aryaraj@test.com',
  role: 'superadmin',
};

const mockChannels = [
  {
    id: 'general',
    name: 'Comunidade Geral',
    type: 'general',
    course_id: null,
    description: 'Bate-papo aberto para todos os alunos',
    last_message: 'Última mensagem geral',
    last_message_at: '2026-10-05T10:00:00Z',
  },
  {
    id: 'course_10',
    name: 'Curso Bussola Astrologica',
    type: 'course',
    course_id: 10,
    description: 'Canal exclusivo dos alunos de Bussola',
    last_message: 'Dúvida aula 2',
    last_message_at: '2026-10-05T10:05:00Z',
  },
];

const mockGeneralMessages = [
  {
    id: 101,
    channel_type: 'general',
    course_id: null,
    message: 'Boas-vindas a todos os alunos!',
    created_at: '2026-10-05T10:00:00Z',
    user: {
      id: 1,
      name: 'Aryaraj Alves',
      email: 'aryaraj@test.com',
      role: 'superadmin',
    },
    can_delete: true,
  },
  {
    id: 102,
    channel_type: 'general',
    course_id: null,
    message: 'Muito animado para aprender!',
    created_at: '2026-10-05T10:02:00Z',
    user: {
      id: 2,
      name: 'Carlos Aluno',
      email: 'carlos@test.com',
      role: 'aluno',
    },
    can_delete: true, // superadmin can delete
  },
];

function renderChat(currentUser = mockCurrentUser) {
  return render(
    <ToastProvider>
      <ChatManagement currentUser={currentUser} />
    </ToastProvider>
  );
}

describe('ChatManagement Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'mock_chat_token');

    global.fetch = vi.fn().mockImplementation((url, options = {}) => {
      const urlStr = String(url);

      if (urlStr.includes('/api/v1/chat/channels')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockChannels),
        });
      }

      if (urlStr.includes('/api/v1/chat/messages') && options.method === 'POST') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 103,
              channel_type: body.channel_type,
              course_id: body.course_id,
              message: body.message,
              created_at: new Date().toISOString(),
              user: {
                id: mockCurrentUser.id,
                name: mockCurrentUser.name,
                email: mockCurrentUser.email,
                role: mockCurrentUser.role,
              },
              can_delete: true,
            }),
        });
      }

      if (urlStr.includes('/api/v1/chat/messages/') && options.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ ok: true, message: 'Mensagem excluída' }),
        });
      }

      if (urlStr.includes('/api/v1/chat/messages')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGeneralMessages),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders chat layout, channels in sidebar and general messages', async () => {
    renderChat();

    // Aguarda carregar os canais
    await waitFor(
      () => {
        expect(screen.getByTestId('channel-item-general')).toBeInTheDocument();
        expect(screen.getByTestId('channel-item-course_10')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Cabeçalho exibe o canal padrão ativo
    expect(screen.getByTestId('chat-header-title')).toHaveTextContent('Comunidade Geral');
    expect(screen.getByText('Chat Ativo')).toBeInTheDocument();

    // Mensagens renderizadas
    await waitFor(
      () => {
        expect(screen.getByText('Boas-vindas a todos os alunos!')).toBeInTheDocument();
        expect(screen.getByText('Muito animado para aprender!')).toBeInTheDocument();
        expect(screen.getByText('Carlos Aluno')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('allows selecting another channel from sidebar', async () => {
    renderChat();

    await waitFor(() => {
      expect(screen.getByText('Curso Bussola Astrologica')).toBeInTheDocument();
    });

    const courseChannelBtn = screen.getByTestId('channel-item-course_10');
    fireEvent.click(courseChannelBtn);

    await waitFor(() => {
      expect(screen.getByTestId('chat-header-title')).toHaveTextContent('Curso Bussola Astrologica');
    });
  });

  it('allows typing and sending a new message', async () => {
    renderChat();

    await waitFor(() => {
      expect(screen.getByTestId('chat-message-textarea')).toBeInTheDocument();
    });

    const textarea = screen.getByTestId('chat-message-textarea');
    fireEvent.change(textarea, { target: { value: 'Nova mensagem de teste!' } });

    const sendBtn = screen.getByTestId('chat-send-button');
    expect(sendBtn).not.toBeDisabled();

    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText('Nova mensagem de teste!')).toBeInTheDocument();
    });

    // O campo de texto é limpo após o envio com sucesso
    expect(textarea.value).toBe('');
  });

  it('opens confirmation modal to delete a message and deletes successfully', async () => {
    renderChat();

    await waitFor(() => {
      expect(screen.getByTestId('delete-msg-btn-101')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTestId('delete-msg-btn-101');
    fireEvent.click(deleteBtn);

    // Modal de confirmação aberto
    expect(screen.getByTestId('delete-chat-modal-content')).toBeInTheDocument();
    expect(screen.getByText('Excluir Mensagem?')).toBeInTheDocument();

    // Clicar no botão de confirmar exclusão
    const confirmBtn = screen.getByTestId('confirm-delete-chat-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.queryByTestId('delete-chat-modal-content')).not.toBeInTheDocument();
      expect(screen.queryByText('Boas-vindas a todos os alunos!')).not.toBeInTheDocument();
    });
  });

  it('allows cancelling deletion from the confirmation modal', async () => {
    renderChat();

    await waitFor(() => {
      expect(screen.getByTestId('delete-msg-btn-101')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-msg-btn-101'));
    expect(screen.getByTestId('delete-chat-modal-content')).toBeInTheDocument();

    const cancelBtn = screen.getByTestId('cancel-delete-chat-btn');
    fireEvent.click(cancelBtn);

    expect(screen.queryByTestId('delete-chat-modal-content')).not.toBeInTheDocument();
    expect(screen.getByText('Boas-vindas a todos os alunos!')).toBeInTheDocument();
  });
});
