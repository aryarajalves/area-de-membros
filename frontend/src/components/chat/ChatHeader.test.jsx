import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatHeader from './ChatHeader';

describe('ChatHeader Component', () => {
  const mockChannel = {
    id: 'general',
    name: 'Comunidade Geral',
    type: 'general',
    description: 'Canal para todos os alunos',
  };

  const mockPinnedMessage = {
    id: 99,
    message: 'Regras da comunidade fixadas',
    user: {
      id: 1,
      name: 'Admin do Sistema',
    },
  };

  it('renders channel name, live badge and "Mais" button with secondary actions collapsed by default', () => {
    render(<ChatHeader selectedChannel={mockChannel} />);

    expect(screen.getByText('Comunidade Geral')).toBeInTheDocument();
    expect(screen.getByText('Chat Ativo')).toBeInTheDocument();
    expect(screen.getByTestId('chat-header-more-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-header-more-menu')).not.toBeInTheDocument();
    expect(screen.queryByText('Favoritas')).not.toBeInTheDocument();
  });

  it('toggles favorites filter when clicked inside "Mais" menu and closes menu', () => {
    const handleToggle = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        favoritesOnly={false}
        onToggleFavoritesOnly={handleToggle}
      />
    );

    fireEvent.click(screen.getByTestId('chat-header-more-btn'));
    expect(screen.getByTestId('chat-header-more-menu')).toBeInTheDocument();

    const favBtn = screen.getByTestId('chat-filter-favorites-btn');
    fireEvent.click(favBtn);
    expect(handleToggle).toHaveBeenCalled();
    expect(screen.queryByTestId('chat-header-more-menu')).not.toBeInTheDocument();
  });

  it('shows active indicator dot on "Mais" button when favoritesOnly is true and closes menu on Escape or outside click', () => {
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        favoritesOnly={true}
      />
    );

    expect(screen.getByTestId('chat-header-more-active-dot')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('chat-header-more-btn'));
    expect(screen.getByTestId('chat-header-more-menu')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('chat-header-more-menu')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('chat-header-more-btn'));
    expect(screen.getByTestId('chat-header-more-menu')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('chat-header-more-menu')).not.toBeInTheDocument();
  });

  it('renders pinned message banner when pinnedMessage is provided', () => {
    const handleUnpin = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        currentUser={{ id: 1, role: 'superadmin' }}
        pinnedMessage={mockPinnedMessage}
        onUnpinMessage={handleUnpin}
      />
    );

    expect(screen.getByTestId('chat-pinned-message-banner')).toBeInTheDocument();
    expect(screen.getByText(/Regras da comunidade fixadas/i)).toBeInTheDocument();

    const unpinBtn = screen.getByTestId('unpin-message-banner-btn');
    fireEvent.click(unpinBtn);
    expect(handleUnpin).toHaveBeenCalledWith(99);
  });

  it('does not render pinned message banner when pinnedMessage is a thread reply (has parent_id)', () => {
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        pinnedMessage={{ ...mockPinnedMessage, parent_id: 10 }}
      />
    );

    expect(screen.queryByTestId('chat-pinned-message-banner')).not.toBeInTheDocument();
  });

  it('triggers onJumpToMessage when clicking the pinned message banner', () => {
    const handleJump = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        pinnedMessage={mockPinnedMessage}
        onJumpToMessage={handleJump}
      />
    );

    const banner = screen.getByTestId('chat-pinned-message-banner');
    fireEvent.click(banner);
    expect(handleJump).toHaveBeenCalledWith(99);
  });

  it('stops propagation when unpin button is clicked so onJumpToMessage is not called', () => {
    const handleJump = vi.fn();
    const handleUnpin = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        currentUser={{ id: 1, role: 'superadmin' }}
        pinnedMessage={mockPinnedMessage}
        onJumpToMessage={handleJump}
        onUnpinMessage={handleUnpin}
      />
    );

    const unpinBtn = screen.getByTestId('unpin-message-banner-btn');
    fireEvent.click(unpinBtn);
    expect(handleUnpin).toHaveBeenCalledWith(99);
    expect(handleJump).not.toHaveBeenCalled();
  });

  it('renders back button inside "Mais" menu and triggers onBack when provided', () => {
    const handleBack = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        onBack={handleBack}
      />
    );

    fireEvent.click(screen.getByTestId('chat-header-more-btn'));
    const backBtn = screen.getByTestId('chat-header-back-btn');
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenMediaGallery when media gallery button is clicked inside "Mais" menu', () => {
    const handleOpenGallery = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        onOpenMediaGallery={handleOpenGallery}
      />
    );

    fireEvent.click(screen.getByTestId('chat-header-more-btn'));
    const mediaBtn = screen.getByTestId('chat-open-media-gallery-btn');
    expect(mediaBtn).toBeInTheDocument();
    expect(screen.getByText('Mídias & Arquivos')).toBeInTheDocument();
    fireEvent.click(mediaBtn);
    expect(handleOpenGallery).toHaveBeenCalledTimes(1);
  });

  it('renders all action buttons with responsive action classes and triggers mentions and DM callbacks inside "Mais" menu', () => {
    const handleOpenMentions = vi.fn();
    const handleOpenDm = vi.fn();
    const handleBackToChannels = vi.fn();

    const { container } = render(
      <ChatHeader
        selectedChannel={mockChannel}
        onOpenMediaGallery={vi.fn()}
        onOpenMentions={handleOpenMentions}
        onOpenDm={handleOpenDm}
        onBackToChannels={handleBackToChannels}
      />
    );

    // Valida container de ações responsivo
    const actionsContainer = container.querySelector('.chat-header-actions');
    expect(actionsContainer).toBeInTheDocument();

    // Valida botão de voltar para canais
    const backChannelsBtn = screen.getByTestId('chat-back-to-channels-btn');
    expect(backChannelsBtn).toBeInTheDocument();
    fireEvent.click(backChannelsBtn);
    expect(handleBackToChannels).toHaveBeenCalledTimes(1);

    // Abre menu "Mais" e valida botão de menções
    fireEvent.click(screen.getByTestId('chat-header-more-btn'));
    const mentionsBtn = screen.getByTestId('chat-open-mentions-btn');
    expect(mentionsBtn).toBeInTheDocument();
    expect(mentionsBtn).toHaveClass('chat-header-action-btn');
    fireEvent.click(mentionsBtn);
    expect(handleOpenMentions).toHaveBeenCalledTimes(1);

    // Abre menu "Mais" novamente e valida botão de DMs
    fireEvent.click(screen.getByTestId('chat-header-more-btn'));
    const dmBtn = screen.getByTestId('chat-open-dm-btn');
    expect(dmBtn).toBeInTheDocument();
    expect(dmBtn).toHaveClass('chat-header-action-btn');
    fireEvent.click(dmBtn);
    expect(handleOpenDm).toHaveBeenCalledTimes(1);

    // Valida indicador ao vivo com classe semântica
    const liveIndicator = container.querySelector('.chat-header-live-indicator');
    expect(liveIndicator).toBeInTheDocument();
  });

  it('renderiza botão de alternar membros e aciona onToggleMembers', () => {
    const handleToggleMembers = vi.fn();
    render(
      <ChatHeader
        selectedChannel={mockChannel}
        onToggleMembers={handleToggleMembers}
        isMembersOpen={true}
      />
    );

    const membersBtn = screen.getByTestId('chat-open-members-sidebar-btn');
    expect(membersBtn).toBeInTheDocument();
    expect(screen.getByText('Membros')).toBeInTheDocument();
    fireEvent.click(membersBtn);
    expect(handleToggleMembers).toHaveBeenCalledTimes(1);
  });

  it('guarantees horizontal layout for title and description with nowrap to prevent text squeezing', () => {
    const { container } = render(
      <ChatHeader
        selectedChannel={{
          ...mockChannel,
          description: 'Bate-papo aberto para todos os alunos e instrutores',
        }}
      />
    );

    const headerLeft = container.querySelector('.chat-header-left');
    expect(headerLeft).toHaveStyle({ minWidth: 'fit-content', flexShrink: '0' });

    const titleEl = screen.getByTestId('chat-header-title');
    expect(titleEl).toHaveStyle({ whiteSpace: 'nowrap' });

    const descEl = screen.getByTestId('chat-header-desc');
    expect(descEl).toHaveStyle({ whiteSpace: 'nowrap' });
    expect(descEl).toHaveTextContent('Bate-papo aberto para todos os alunos e instrutores');
  });
});

