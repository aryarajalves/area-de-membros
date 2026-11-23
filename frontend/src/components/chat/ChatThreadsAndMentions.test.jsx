import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastProvider } from '../../context/ToastContext';
import ChatThreadPanel from './ChatThreadPanel';
import ChatMentionsModal from './ChatMentionsModal';

describe('ChatThreadPanel & ChatMentionsModal Components', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'test-jwt-token');
  });

  const parentMessage = {
    id: 10,
    channel_type: 'general',
    message: 'Esta é a pergunta inicial da thread',
    created_at: '2026-10-05T10:00:00Z',
    user: {
      id: 1,
      name: 'Professor Rodrigo',
      role: 'admin',
    },
    reply_count: 1,
  };

  it('renders ChatThreadPanel with parent message and close action', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 11,
          parent_id: 10,
          channel_type: 'general',
          message: 'Minha resposta na thread',
          created_at: '2026-10-05T10:05:00Z',
          user: { id: 2, name: 'Aluno João', role: 'aluno' },
        },
      ],
    });

    const handleClose = vi.fn();
    render(
      <ToastProvider>
        <ChatThreadPanel
          parentMessage={parentMessage}
          currentUser={{ id: 2, role: 'aluno' }}
          onClose={handleClose}
        />
      </ToastProvider>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('chat-thread-backdrop')).toBeInTheDocument();
    expect(screen.getByText('Thread')).toBeInTheDocument();
    expect(screen.getByText('Esta é a pergunta inicial da thread')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Minha resposta na thread')).toBeInTheDocument();
    });

    // Clicar no backdrop NÃO deve fechar o popup
    fireEvent.click(screen.getByTestId('chat-thread-backdrop'));
    expect(handleClose).not.toHaveBeenCalled();

    const closeBtn = screen.getByTestId('close-thread-panel-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('updates reply likes and hides favorite and pin actions inside thread', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 11,
          parent_id: 10,
          channel_type: 'general',
          message: 'Resposta para curtir na thread',
          likes_count: 0,
          liked_by_me: false,
          is_pinned: true,
          created_at: '2026-10-05T10:05:00Z',
          user: { id: 2, name: 'Aluno João', role: 'aluno' },
        },
      ],
    });

    const handleToggleLike = vi.fn().mockResolvedValue({ likes_count: 1, liked: true });

    render(
      <ToastProvider>
        <ChatThreadPanel
          parentMessage={{ ...parentMessage, is_pinned: true }}
          currentUser={{ id: 1, role: 'superadmin' }}
          onClose={vi.fn()}
          onToggleLike={handleToggleLike}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Resposta para curtir na thread')).toBeInTheDocument();
    });

    // Não deve exibir favoritar, fixar, badge Fixada nem banner de fixada dentro da thread
    expect(screen.queryByTestId('favorite-msg-btn-10')).toBeNull();
    expect(screen.queryByTestId('favorite-msg-btn-11')).toBeNull();
    expect(screen.queryByTestId('pin-msg-btn-10')).toBeNull();
    expect(screen.queryByTestId('pin-msg-btn-11')).toBeNull();
    expect(screen.queryByTestId('pinned-badge-10')).toBeNull();
    expect(screen.queryByTestId('pinned-badge-11')).toBeNull();
    expect(screen.queryByTestId('thread-pinned-message-banner')).toBeNull();

    // Reagir (curtir) à resposta da thread deve atualizar o contador localmente
    const likeBtn = screen.getByTestId('like-msg-btn-11');
    fireEvent.click(likeBtn);
    await waitFor(() => {
      expect(handleToggleLike).toHaveBeenCalledWith(11);
      expect(likeBtn).toHaveTextContent('1');
    });
  });

  it('renders ChatMentionsModal with mentions list and allows jump to message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 101,
          message_id: 55,
          sender_name: 'Marcos Instrutor',
          message_preview: 'Ei @Aluno veja esta resposta',
          is_read: false,
          created_at: '2026-10-05T12:00:00Z',
        },
      ],
    });

    const handleJump = vi.fn();
    const handleClose = vi.fn();

    render(
      <ChatMentionsModal
        isOpen={true}
        onClose={handleClose}
        onJumpToMessage={handleJump}
      />
    );

    expect(screen.getByText('Minhas Menções')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Marcos Instrutor')).toBeInTheDocument();
      expect(screen.getByText('Ei @Aluno veja esta resposta')).toBeInTheDocument();
    });

    // Clicar para pular para mensagem
    const item = screen.getByText('Marcos Instrutor').closest('div');
    fireEvent.click(item);
    expect(handleJump).toHaveBeenCalledWith(55);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
