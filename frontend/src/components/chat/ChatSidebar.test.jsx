import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatSidebar from './ChatSidebar';

describe('ChatSidebar Component', () => {
  const mockChannels = [
    {
      id: 'general',
      name: 'Comunidade Geral',
      type: 'general',
      description: 'Bate-papo geral',
    },
    {
      id: 'course-1',
      name: 'Curso de React',
      type: 'course',
      course_id: 1,
      description: 'Turma de React',
    },
  ];

  it('renders channels and search input', () => {
    render(
      <ChatSidebar
        channels={mockChannels}
        selectedChannel={mockChannels[0]}
        onSelectChannel={vi.fn()}
      />
    );

    expect(screen.getByText('Canais de Conversa')).toBeInTheDocument();
    expect(screen.getByText('Comunidade Geral')).toBeInTheDocument();
    expect(screen.getByText('Curso de React')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar canal ou curso...')).toBeInTheDocument();
  });

  it('renders back button and calls onBack when clicked', () => {
    const handleBack = vi.fn();
    render(
      <ChatSidebar
        channels={mockChannels}
        selectedChannel={mockChannels[0]}
        onSelectChannel={vi.fn()}
        onBack={handleBack}
      />
    );

    const backBtn = screen.getByTestId('chat-back-btn');
    expect(backBtn).toBeInTheDocument();
    expect(screen.getByText('Voltar aos Cursos')).toBeInTheDocument();

    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('filters course channels based on search term', () => {
    render(
      <ChatSidebar
        channels={mockChannels}
        selectedChannel={mockChannels[0]}
        onSelectChannel={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar canal ou curso...');
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });

    expect(screen.queryByText('Curso de React')).not.toBeInTheDocument();
    // O canal geral permanece visível
    expect(screen.getByText('Comunidade Geral')).toBeInTheDocument();
  });

  it('renders unread badges for general and course channels when unread_count > 0', () => {
    const channelsWithUnread = [
      {
        id: 'general',
        name: 'Comunidade Geral',
        type: 'general',
        description: 'Bate-papo geral',
        unread_count: 7,
      },
      {
        id: 'course-1',
        name: 'Curso de React',
        type: 'course',
        course_id: 1,
        description: 'Turma de React',
        unread_count: 3,
      },
    ];

    render(
      <ChatSidebar
        channels={channelsWithUnread}
        selectedChannel={channelsWithUnread[0]}
        onSelectChannel={vi.fn()}
      />
    );

    const generalBadge = screen.getByTestId('unread-badge-general');
    expect(generalBadge).toBeInTheDocument();
    expect(generalBadge).toHaveTextContent('7');

    const courseBadge = screen.getByTestId('unread-badge-course-1');
    expect(courseBadge).toBeInTheDocument();
    expect(courseBadge).toHaveTextContent('3');
  });
});
