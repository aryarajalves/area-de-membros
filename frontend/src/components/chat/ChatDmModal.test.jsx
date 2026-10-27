import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatDmModal from './ChatDmModal';
import ChatDmConversationView from './ChatDmConversationView';
import { ToastProvider } from '../../context/ToastContext';

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
      <ToastProvider>
        <ChatDmModal
          isOpen={true}
          onClose={vi.fn()}
          currentUser={currentUser}
        />
      </ToastProvider>
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
      <ToastProvider>
        <ChatDmModal
          isOpen={true}
          onClose={vi.fn()}
          currentUser={currentUser}
        />
      </ToastProvider>
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

  it('renders ChatDmConversationView with all media action buttons (image, video, audio, gif, file/pdf)', async () => {
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
        message: 'Foto de confirmação',
        media_url: 'https://exemplo.com/foto.jpg',
        media_type: 'image',
        created_at: '2026-10-06T10:01:00Z',
        user: { id: 1, name: 'Aryaraj' },
      },
      {
        id: 3,
        message: 'Áudio gravado',
        media_url: 'https://exemplo.com/audio.webm',
        media_type: 'audio',
        created_at: '2026-10-06T10:02:00Z',
        user: { id: 2, name: 'João Aluno' },
      },
      {
        id: 4,
        message: 'Vídeo explicativo',
        media_url: 'https://exemplo.com/video.mp4',
        media_type: 'video',
        created_at: '2026-10-06T10:03:00Z',
        user: { id: 1, name: 'Aryaraj' },
      },
      {
        id: 5,
        message: 'Documento PDF com instruções',
        media_url: 'https://exemplo.com/guia.pdf',
        media_type: 'file',
        created_at: '2026-10-06T10:04:00Z',
        user: { id: 2, name: 'João Aluno' },
      },
    ];

    render(
      <ToastProvider>
        <ChatDmConversationView
          selectedContact={mockContact}
          currentUser={currentUser}
          messages={messages}
          loading={false}
          onSendMessage={handleSend}
        />
      </ToastProvider>
    );

    // Valida mensagens de texto e anexos de mídia renderizados
    expect(screen.getByText('Mensagem privada recebida')).toBeInTheDocument();
    expect(screen.getByTestId('chat-media-img-2')).toBeInTheDocument();
    expect(screen.getByTestId('chat-media-audio-3')).toBeInTheDocument();
    expect(screen.getByTestId('chat-media-video-4')).toBeInTheDocument();
    expect(screen.getByText('Visualizar Documento')).toBeInTheDocument();

    // Valida presença da barra de ferramentas completa com todas as ações de mídia
    expect(screen.getByTestId('chat-input-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('chat-attach-button')).toBeInTheDocument(); // Anexar qualquer arquivo / PDF
    expect(screen.getByTestId('chat-image-button')).toBeInTheDocument(); // Enviar imagem com legenda
    expect(screen.getByTestId('chat-gif-button')).toBeInTheDocument(); // GIFs animados
    expect(screen.getByTestId('chat-emoji-button')).toBeInTheDocument(); // Emojis
    expect(screen.getByTestId('chat-record-audio-btn')).toBeInTheDocument(); // Gravação de áudio nativa
    expect(screen.getByTestId('chat-video-record-button')).toBeInTheDocument(); // Gravação de vídeo pela câmera

    // Digitar e enviar mensagem de texto
    const textarea = screen.getByTestId('chat-message-textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Mensagem para João Aluno...');

    fireEvent.change(textarea, { target: { value: 'Nova mensagem secreta' } });
    const sendBtn = screen.getByTestId('chat-send-button');
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(handleSend).toHaveBeenCalledWith('Nova mensagem secreta', null, null);
    });
  });

  it('locks body scroll when open and restores it when unmounted', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = render(
      <ToastProvider>
        <ChatDmModal
          isOpen={true}
          onClose={vi.fn()}
          currentUser={currentUser}
        />
      </ToastProvider>
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
      <ToastProvider>
        <ChatDmModal
          isOpen={true}
          onClose={vi.fn()}
          currentUser={currentUser}
        />
      </ToastProvider>
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
      expect(screen.getByTestId('dm-encryption-badge')).toBeInTheDocument();
      expect(screen.getByText('Criptografada')).toBeInTheDocument();
    });
  });

  it('paginates active conversations to 20 per page and allows page navigation', async () => {
    const mockConversations = Array.from({ length: 25 }, (_, i) => ({
      contact: { id: i + 1, name: `Contato ${i + 1}`, role: 'aluno', avatar_url: null },
      last_message: `Mensagem ${i + 1}`,
      last_message_at: '2026-10-06T10:00:00Z',
      unread_count: 0,
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockConversations,
    });

    render(
      <ToastProvider>
        <ChatDmModal
          isOpen={true}
          onClose={vi.fn()}
          currentUser={currentUser}
        />
      </ToastProvider>
    );

    // Página 1: deve exibir Contato 1 até Contato 20
    await waitFor(() => {
      expect(screen.getByText('Contato 1')).toBeInTheDocument();
      expect(screen.getByText('Contato 20')).toBeInTheDocument();
      expect(screen.queryByText('Contato 21')).not.toBeInTheDocument();
      expect(screen.getByTestId('dm-pagination-info')).toHaveTextContent('Exibindo 1–20 de 25 DMs');
      expect(screen.getByTestId('dm-pagination-indicator')).toHaveTextContent('1 / 2');
    });

    // Clica para ir para a página 2
    fireEvent.click(screen.getByTestId('dm-pagination-next-btn'));

    // Página 2: deve exibir Contato 21 até Contato 25 e não mais o Contato 1
    await waitFor(() => {
      expect(screen.queryByText('Contato 1')).not.toBeInTheDocument();
      expect(screen.getByText('Contato 21')).toBeInTheDocument();
      expect(screen.getByText('Contato 25')).toBeInTheDocument();
      expect(screen.getByTestId('dm-pagination-info')).toHaveTextContent('Exibindo 21–25 de 25 DMs');
      expect(screen.getByTestId('dm-pagination-indicator')).toHaveTextContent('2 / 2');
    });

    // Clica no botão anterior para retornar à página 1
    fireEvent.click(screen.getByTestId('dm-pagination-prev-btn'));

    await waitFor(() => {
      expect(screen.getByText('Contato 1')).toBeInTheDocument();
      expect(screen.queryByText('Contato 21')).not.toBeInTheDocument();
      expect(screen.getByTestId('dm-pagination-info')).toHaveTextContent('Exibindo 1–20 de 25 DMs');
      expect(screen.getByTestId('dm-pagination-indicator')).toHaveTextContent('1 / 2');
    });
  });

  it('resets to page 1 when switching between inbox and unread tabs', async () => {
    const mockConversations = Array.from({ length: 25 }, (_, i) => ({
      contact: { id: i + 1, name: `Contato ${i + 1}`, role: 'aluno', avatar_url: null },
      last_message: `Mensagem ${i + 1}`,
      last_message_at: '2026-10-06T10:00:00Z',
      unread_count: 0,
    }));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockConversations,
    });

    render(
      <ToastProvider>
        <ChatDmModal
          isOpen={true}
          onClose={vi.fn()}
          currentUser={currentUser}
        />
      </ToastProvider>
    );

    // Navega para a página 2
    await waitFor(() => {
      expect(screen.getByText('Contato 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('dm-pagination-next-btn'));
    await waitFor(() => {
      expect(screen.getByText('Contato 25')).toBeInTheDocument();
      expect(screen.getByTestId('dm-pagination-indicator')).toHaveTextContent('2 / 2');
    });

    // Muda para a aba não lidas
    fireEvent.click(screen.getByTestId('dm-tab-unread'));

    // Deve resetar para a página 1
    await waitFor(() => {
      expect(screen.getByTestId('dm-pagination-indicator')).toHaveTextContent('1 / 2');
    });
  });

  it('renders modal with zIndex 1000002 to stay above all elements', () => {
    render(
      <ToastProvider>
        <ChatDmModal
          isOpen={true}
          onClose={vi.fn()}
          currentUser={currentUser}
        />
      </ToastProvider>
    );

    const modal = screen.getByTestId('chat-dm-modal');
    expect(modal).toHaveStyle({ zIndex: '1000002' });
  });

  it('renderiza links internos de cursos e abas como badges clicaveis nas mensagens da DM', () => {
    const messages = [
      {
        id: 101,
        message: '[📍 Apresente-se](internal://tab/introductions)',
        created_at: '2026-10-27T11:44:00Z',
        user: { id: 1, name: 'Aryaraj' },
      },
      {
        id: 102,
        message: '[📚 Astrowake](internal://course/3)',
        created_at: '2026-10-27T11:44:10Z',
        user: { id: 1, name: 'Aryaraj' },
      },
    ];

    render(
      <ToastProvider>
        <ChatDmConversationView
          selectedContact={mockContact}
          currentUser={currentUser}
          messages={messages}
          loading={false}
          onSendMessage={vi.fn()}
        />
      </ToastProvider>
    );

    // Deve renderizar os badges interativos ao inves do texto markdown cru
    const badges = screen.getAllByTestId('chat-internal-link');
    expect(badges.length).toBe(2);

    expect(screen.getByText(/Apresente-se/)).toBeInTheDocument();
    expect(screen.getByText(/Astrowake/)).toBeInTheDocument();
    expect(screen.queryByText('[📍 Apresente-se](internal://tab/introductions)')).not.toBeInTheDocument();
    expect(screen.queryByText('[📚 Astrowake](internal://course/3)')).not.toBeInTheDocument();
  });
});
