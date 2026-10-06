import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatMessageItem from './ChatMessageItem';

describe('ChatMessageItem Component', () => {
  const mockMessageWithAvatar = {
    id: 1,
    channel_type: 'general',
    message: 'Mensagem com avatar',
    created_at: '2026-10-05T10:00:00Z',
    user: {
      id: 2,
      name: 'João Silva',
      email: 'joao@test.com',
      role: 'aluno',
      avatar_url: 'https://cdn.test.com/joao-avatar.png',
    },
    can_delete: false,
  };

  const mockMessageWithoutAvatar = {
    id: 2,
    channel_type: 'general',
    message: 'Mensagem sem foto',
    created_at: '2026-10-05T10:05:00Z',
    user: {
      id: 3,
      name: 'Maria Santos',
      email: 'maria@test.com',
      role: 'admin',
      avatar_url: null,
    },
    can_delete: false,
  };

  it('renders user avatar image when avatar_url is provided', () => {
    render(
      <ChatMessageItem
        message={mockMessageWithAvatar}
        currentUser={{ id: 1, role: 'superadmin' }}
        onDeleteMessage={vi.fn()}
      />
    );

    const img = screen.getByTestId('chat-avatar-img-1');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://cdn.test.com/joao-avatar.png');
    expect(img).toHaveAttribute('alt', 'João Silva');
  });

  it('falls back to initial when user has no avatar_url', () => {
    render(
      <ChatMessageItem
        message={mockMessageWithoutAvatar}
        currentUser={{ id: 1, role: 'superadmin' }}
        onDeleteMessage={vi.fn()}
      />
    );

    expect(screen.queryByTestId('chat-avatar-img-2')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-avatar-2')).toHaveTextContent('M');
  });

  it('falls back to initial when avatar image encounters error (onError)', () => {
    render(
      <ChatMessageItem
        message={mockMessageWithAvatar}
        currentUser={{ id: 1, role: 'superadmin' }}
        onDeleteMessage={vi.fn()}
      />
    );

    const img = screen.getByTestId('chat-avatar-img-1');
    fireEvent.error(img);

    expect(screen.queryByTestId('chat-avatar-img-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('chat-avatar-1')).toHaveTextContent('J');
  });

  it('uses currentUser avatar_url for own messages if currentUser has updated avatar', () => {
    const ownMessage = {
      id: 3,
      channel_type: 'general',
      message: 'Minha mensagem recente',
      created_at: '2026-10-05T10:10:00Z',
      user: {
        id: 1,
        name: 'Aryaraj',
        role: 'superadmin',
        avatar_url: null, // Na mensagem veio null, mas no currentUser tem avatar
      },
      can_delete: true,
    };

    render(
      <ChatMessageItem
        message={ownMessage}
        currentUser={{ id: 1, name: 'Aryaraj', role: 'superadmin', avatar_url: 'https://cdn.test.com/my-super-avatar.jpg' }}
        onDeleteMessage={vi.fn()}
      />
    );

    const img = screen.getByTestId('chat-avatar-img-3');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://cdn.test.com/my-super-avatar.jpg');
  });

  it('handles liking a chat message', () => {
    const handleLike = vi.fn();
    const msgWithLikes = { ...mockMessageWithAvatar, likes_count: 5, liked_by_me: true };

    render(
      <ChatMessageItem
        message={msgWithLikes}
        currentUser={{ id: 2, role: 'aluno' }}
        onDeleteMessage={vi.fn()}
        onToggleLike={handleLike}
      />
    );

    const likeBtn = screen.getByTestId('like-msg-btn-1');
    expect(likeBtn).toHaveTextContent('5');
    fireEvent.click(likeBtn);
    expect(handleLike).toHaveBeenCalledWith(1);
  });

  it('handles favoriting a chat message', () => {
    const handleFav = vi.fn();
    const msgFavorited = { ...mockMessageWithAvatar, is_favorited: true };

    render(
      <ChatMessageItem
        message={msgFavorited}
        currentUser={{ id: 2, role: 'aluno' }}
        onDeleteMessage={vi.fn()}
        onToggleFavorite={handleFav}
      />
    );

    const favBtn = screen.getByTestId('favorite-msg-btn-1');
    expect(favBtn).toHaveAttribute('title', 'Remover dos favoritos');
    fireEvent.click(favBtn);
    expect(handleFav).toHaveBeenCalledWith(1);
  });

  it('displays pin button for managers and allows toggling pin', () => {
    const handlePin = vi.fn();
    const pinnedMsg = { ...mockMessageWithAvatar, is_pinned: true };

    render(
      <ChatMessageItem
        message={pinnedMsg}
        currentUser={{ id: 99, role: 'admin' }}
        onDeleteMessage={vi.fn()}
        onTogglePin={handlePin}
      />
    );

    expect(screen.getByTestId('pinned-badge-1')).toHaveTextContent('Fixada');
    const pinBtn = screen.getByTestId('pin-msg-btn-1');
    expect(pinBtn).toHaveAttribute('title', 'Desafixar mensagem');
    fireEvent.click(pinBtn);
    expect(handlePin).toHaveBeenCalledWith(1);
  });

  it('hides pin button for regular students', () => {
    render(
      <ChatMessageItem
        message={mockMessageWithAvatar}
        currentUser={{ id: 2, role: 'aluno' }}
        onDeleteMessage={vi.fn()}
      />
    );

    expect(screen.queryByTestId('pin-msg-btn-1')).not.toBeInTheDocument();
  });

  it('renders attached image correctly', () => {
    const msgWithImage = {
      ...mockMessageWithAvatar,
      media_url: 'https://cdn.test.com/prints/foto.png',
      media_type: 'image',
    };

    render(
      <ChatMessageItem
        message={msgWithImage}
        currentUser={{ id: 2, role: 'aluno' }}
        onDeleteMessage={vi.fn()}
      />
    );

    const mediaImg = screen.getByTestId('chat-media-img-1');
    expect(mediaImg).toHaveAttribute('src', 'https://cdn.test.com/prints/foto.png');
  });

  it('renders attached document correctly', () => {
    const msgWithDoc = {
      ...mockMessageWithAvatar,
      media_url: 'https://cdn.test.com/docs/apostila.pdf',
      media_type: 'file',
    };

    render(
      <ChatMessageItem
        message={msgWithDoc}
        currentUser={{ id: 2, role: 'aluno' }}
        onDeleteMessage={vi.fn()}
      />
    );

    expect(screen.getByText('Visualizar Documento')).toBeInTheDocument();
  });

  it('renders with element id and highlights message when isHighlighted is true', () => {
    const { rerender } = render(
      <ChatMessageItem
        message={mockMessageWithAvatar}
        currentUser={{ id: 2, role: 'aluno' }}
        isHighlighted={false}
      />
    );

    const messageEl = screen.getByTestId('chat-message-item-1');
    expect(messageEl).toHaveAttribute('id', 'chat-message-1');
    expect(messageEl).toHaveAttribute('data-highlighted', 'false');
    expect(messageEl).not.toHaveClass('chat-message-highlighted');

    rerender(
      <ChatMessageItem
        message={mockMessageWithAvatar}
        currentUser={{ id: 2, role: 'aluno' }}
        isHighlighted={true}
      />
    );

    expect(messageEl).toHaveAttribute('data-highlighted', 'true');
    expect(messageEl).toHaveClass('chat-message-highlighted');
  });

  it('renders attached audio player when media_type is audio', () => {
    const msgWithAudio = {
      ...mockMessageWithAvatar,
      media_url: 'https://cdn.test.com/audio/gravacao.webm',
      media_type: 'audio',
    };

    render(
      <ChatMessageItem
        message={msgWithAudio}
        currentUser={{ id: 2, role: 'aluno' }}
      />
    );

    const audioWrapper = screen.getByTestId('chat-media-audio-1');
    expect(audioWrapper).toBeInTheDocument();
    const audioElement = audioWrapper.querySelector('audio');
    expect(audioElement).toHaveAttribute('src', 'https://cdn.test.com/audio/gravacao.webm');
  });

  it('renders attached video player when media_type is video', () => {
    const msgWithVideo = {
      ...mockMessageWithAvatar,
      media_url: 'https://cdn.test.com/videos/demo.mp4',
      media_type: 'video',
    };

    render(
      <ChatMessageItem
        message={msgWithVideo}
        currentUser={{ id: 2, role: 'aluno' }}
      />
    );

    const videoWrapper = screen.getByTestId('chat-media-video-1');
    expect(videoWrapper).toBeInTheDocument();
    const videoElement = videoWrapper.querySelector('video');
    expect(videoElement).toHaveAttribute('src', 'https://cdn.test.com/videos/demo.mp4');
  });

  it('renders thread button and reply count badge, and triggers onOpenThread', () => {
    const handleOpenThread = vi.fn();
    const msgWithReplies = {
      ...mockMessageWithAvatar,
      reply_count: 3,
    };

    render(
      <ChatMessageItem
        message={msgWithReplies}
        currentUser={{ id: 2, role: 'aluno' }}
        onOpenThread={handleOpenThread}
      />
    );

    const threadBtn = screen.getByTestId('reply-thread-btn-1');
    expect(threadBtn).toBeInTheDocument();
    fireEvent.click(threadBtn);
    expect(handleOpenThread).toHaveBeenCalledWith(msgWithReplies);

    const replyBadge = screen.getByTestId('thread-replies-badge-1');
    expect(replyBadge).toHaveTextContent('3 respostas');
  });

  it('renders highlighted contact mention in message text', () => {
    const msgWithMention = {
      ...mockMessageWithAvatar,
      message: 'Olá @Maria Santos tudo bem?',
    };

    render(
      <ChatMessageItem
        message={msgWithMention}
        currentUser={{ id: 2, role: 'aluno' }}
      />
    );

    const mentionSpan = screen.getByText('@Maria Santos');
    expect(mentionSpan).toBeInTheDocument();
    expect(mentionSpan).toHaveClass('chat-mention-tag');
  });

  it('renders interactive CTA button when message contains button_text and button_url', () => {
    const msgWithCta = {
      ...mockMessageWithAvatar,
      message: 'Confira nosso novo módulo especial!',
      button_text: 'Acessar Módulo',
      button_url: 'https://plataforma.com/modulo',
      button_action_type: 'url',
    };

    render(
      <ChatMessageItem
        message={msgWithCta}
        currentUser={{ id: 2, role: 'aluno' }}
      />
    );

    const ctaBtn = screen.getByTestId('chat-cta-button-1');
    expect(ctaBtn).toBeInTheDocument();
    expect(ctaBtn).toHaveTextContent('Acessar Módulo');
    expect(ctaBtn).toHaveAttribute('href', 'https://plataforma.com/modulo');
    expect(ctaBtn).toHaveAttribute('target', '_blank');
  });

  it('normalizes external URLs without protocol like www.google.com.br to https://www.google.com.br', () => {
    const msgWithRawUrl = {
      ...mockMessageWithAvatar,
      id: 99,
      message: 'Acesse o buscador!',
      button_text: 'Abrir Google',
      button_url: 'www.google.com.br',
      button_action_type: 'url',
    };

    render(
      <ChatMessageItem
        message={msgWithRawUrl}
        currentUser={{ id: 2, role: 'aluno' }}
      />
    );

    const ctaBtn = screen.getByTestId('chat-cta-button-99');
    expect(ctaBtn).toBeInTheDocument();
    expect(ctaBtn).toHaveAttribute('href', 'https://www.google.com.br');
    expect(ctaBtn).toHaveAttribute('target', '_blank');
  });
});

