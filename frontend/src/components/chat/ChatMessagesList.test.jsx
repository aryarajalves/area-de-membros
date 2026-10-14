import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatMessagesList from './ChatMessagesList';

describe('ChatMessagesList Component', () => {
  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it('renders loading state when loading is true', () => {
    render(<ChatMessagesList loading={true} />);

    expect(screen.getByTestId('chat-loading-state')).toBeInTheDocument();
    expect(screen.getByText(/Carregando mensagens da conversa/i)).toBeInTheDocument();
  });

  it('renders empty state when there are no messages', () => {
    render(<ChatMessagesList loading={false} messages={[]} selectedChannel={{ name: 'Geral' }} />);

    expect(screen.getByTestId('chat-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Nenhuma mensagem ainda/i)).toBeInTheDocument();
  });

  it('renders date separators dividing messages sent on different days', () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const mockMessages = [
      {
        id: 1,
        message: 'Primeira mensagem de ontem',
        created_at: yesterday.toISOString(),
        user: { id: 1, name: 'Aryaraj', role: 'superadmin' },
      },
      {
        id: 2,
        message: 'Segunda mensagem de ontem',
        created_at: yesterday.toISOString(),
        user: { id: 1, name: 'Aryaraj', role: 'superadmin' },
      },
      {
        id: 3,
        message: 'Mensagem de hoje',
        created_at: today.toISOString(),
        user: { id: 2, name: 'Aluno', role: 'aluno' },
      },
      {
        id: 4,
        message: 'Outra mensagem de hoje',
        created_at: today.toISOString(),
        user: { id: 2, name: 'Aluno', role: 'aluno' },
      },
    ];

    render(
      <ChatMessagesList
        loading={false}
        messages={mockMessages}
        currentUser={{ id: 1, role: 'superadmin' }}
        onDeleteMessage={vi.fn()}
      />
    );

    // Deve encontrar exatamente 2 separadores de data (Ontem e Hoje)
    const separators = screen.getAllByTestId('chat-date-separator');
    expect(separators).toHaveLength(2);

    expect(screen.getByText('Ontem')).toBeInTheDocument();
    expect(screen.getByText('Hoje')).toBeInTheDocument();

    // Todas as 4 mensagens devem ser renderizadas
    expect(screen.getByText('Primeira mensagem de ontem')).toBeInTheDocument();
    expect(screen.getByText('Segunda mensagem de ontem')).toBeInTheDocument();
    expect(screen.getByText('Mensagem de hoje')).toBeInTheDocument();
    expect(screen.getByText('Outra mensagem de hoje')).toBeInTheDocument();
  });
});
