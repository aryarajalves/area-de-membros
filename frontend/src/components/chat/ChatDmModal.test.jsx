import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatDmModal from './ChatDmModal';
import ChatDmConversationView from './ChatDmConversationView';

describe('ChatDmModal and ChatDmConversationView Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  const currentUser = { id: 1, name: 'Aryaraj', role: 'superadmin' };
  const mockContact = { id: 2, name: 'João Aluno', role: 'aluno', avatar_url: null };

  it('renders conversations list with inbox and unread tabs', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          contact: mockContact,
          last_message: 'Olá tudo bem?',
          last_message_at: '2026-10-06T10:00:00Z',
          unread_count: 2,
        },
      ],
    });

    render(
      <ChatDmModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={currentUser}
      />
    );

    expect(screen.getByText('DMs (Mensagens Diretas)')).toBeInTheDocument();
    expect(screen.getByTestId('dm-tab-inbox')).toBeInTheDocument();
    expect(screen.getByTestId('dm-tab-unread')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('João Aluno')).toBeInTheDocument();
      expect(screen.getByText('Olá tudo bem?')).toBeInTheDocument();
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });
  });

  it('switches to unread tab and filters conversations', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
    global.fetch = fetchMock;

    render(
      <ChatDmModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={currentUser}
      />
    );

    const unreadTab = screen.getByTestId('dm-tab-unread');
    fireEvent.click(unreadTab);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/chat/dm/conversations?unread_only=true'),
        expect.anything()
      );
    });
  });

  it('renders ChatDmConversationView and allows sending private message', async () => {
    const handleSend = vi.fn().mockResolvedValue(true);
    const messages = [
      {
        id: 1,
        message: 'Mensagem privada recebida',
        created_at: '2026-10-06T10:00:00Z',
        user: { id: 2, name: 'João Aluno' },
      },
      {
        id: 2,
        message: 'Minha resposta direta',
        created_at: '2026-10-06T10:01:00Z',
        user: { id: 1, name: 'Aryaraj' },
      },
    ];

    render(
      <ChatDmConversationView
        selectedContact={mockContact}
        currentUser={currentUser}
        messages={messages}
        loading={false}
        onSendMessage={handleSend}
      />
    );

    expect(screen.getByText('Mensagem privada recebida')).toBeInTheDocument();
    expect(screen.getByText('Minha resposta direta')).toBeInTheDocument();

    const input = screen.getByTestId('dm-message-input');
    fireEvent.change(input, { target: { value: 'Nova mensagem secreta' } });
    const sendBtn = screen.getByTestId('dm-send-btn');
    fireEvent.click(sendBtn);

    expect(handleSend).toHaveBeenCalledWith('Nova mensagem secreta');
  });

  it('locks body scroll when open and restores it when unmounted', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(
      <ChatDmModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={currentUser}
      />
    );
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });

  it('allows starting a new conversation via top button and empty state button', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/conversations')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.includes('/mention-contacts')) {
        return Promise.resolve({ ok: true, json: async () => [mockContact] });
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    });

    render(
      <ChatDmModal
        isOpen={true}
        onClose={vi.fn()}
        currentUser={currentUser}
      />
    );

    // Botão "+ Nova Conversa" no cabeçalho deve estar visível imediatamente
    expect(screen.getByTestId('dm-new-conversation-btn')).toBeInTheDocument();

    // Aguarda o término do loading para o empty state renderizar
    await waitFor(() => {
      expect(screen.getByTestId('dm-empty-state-new-conversation-btn')).toBeInTheDocument();
    });

    // Clica para iniciar nova conversa
    fireEvent.click(screen.getByTestId('dm-new-conversation-btn'));

    // Deve exibir o seletor de contatos
    await waitFor(() => {
      expect(screen.getByTestId('dm-new-contact-selector')).toBeInTheDocument();
      expect(screen.getByText('João Aluno')).toBeInTheDocument();
    });

    // Clica no contato para abrir conversa privada
    fireEvent.click(screen.getByTestId(`dm-contact-item-${mockContact.id}`));

    await waitFor(() => {
      expect(screen.getByText('Mensagens com João Aluno')).toBeInTheDocument();
    });
  });
});
