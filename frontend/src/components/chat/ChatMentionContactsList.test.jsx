import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatMentionContactsList from './ChatMentionContactsList';

describe('ChatMentionContactsList', () => {
  const mockContacts = [
    { id: 1, name: 'Lucas Silva', email: 'lucas@test.com', role: 'aluno' },
    { id: 2, name: 'Mariana Lima', email: 'mariana@test.com', role: 'admin' },
    { id: 3, name: 'Carlos Souza', email: 'carlos@test.com', role: 'aluno' },
  ];

  it('renders contacts list matching filter', () => {
    render(
      <ChatMentionContactsList
        contacts={mockContacts}
        filterText=""
        onSelectContact={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Lucas Silva')).toBeInTheDocument();
    expect(screen.getByText('Mariana Lima')).toBeInTheDocument();
    expect(screen.getByText('Carlos Souza')).toBeInTheDocument();
  });

  it('renders empty message when no contact matches filter', () => {
    render(
      <ChatMentionContactsList
        contacts={mockContacts}
        filterText="inexistente"
        onSelectContact={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Nenhum contato encontrado para "@inexistente"/i)).toBeInTheDocument();
  });

  it('renders @todos option only for admin or superadmin', () => {
    const { rerender } = render(
      <ChatMentionContactsList
        contacts={mockContacts}
        filterText=""
        currentUser={{ role: 'aluno' }}
        onSelectContact={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('mention-contact-todos')).not.toBeInTheDocument();

    rerender(
      <ChatMentionContactsList
        contacts={mockContacts}
        filterText=""
        currentUser={{ role: 'admin' }}
        onSelectContact={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('mention-contact-todos')).toBeInTheDocument();
    expect(screen.getByText('@todos')).toBeInTheDocument();
  });

  it('filters contacts dynamically by name or email', () => {
    render(
      <ChatMentionContactsList
        contacts={mockContacts}
        filterText="mari"
        currentUser={{ role: 'aluno' }}
        onSelectContact={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Mariana Lima')).toBeInTheDocument();
    expect(screen.queryByText('Lucas Silva')).not.toBeInTheDocument();
    expect(screen.queryByText('Carlos Souza')).not.toBeInTheDocument();
  });

  it('paginates contacts displaying 20 per page and allows page navigation', () => {
    const twentyFiveContacts = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Contato ${i + 1}`,
      email: `contato${i + 1}@test.com`,
      role: 'aluno',
    }));

    render(
      <ChatMentionContactsList
        contacts={twentyFiveContacts}
        filterText=""
        currentUser={{ role: 'aluno' }}
        onSelectContact={vi.fn()}
        onClose={vi.fn()}
      />
    );

    // Página 1: Contato 1 a Contato 20
    expect(screen.getByText('Contato 1')).toBeInTheDocument();
    expect(screen.getByText('Contato 20')).toBeInTheDocument();
    expect(screen.queryByText('Contato 21')).not.toBeInTheDocument();
    expect(screen.getByTestId('mention-page-indicator')).toHaveTextContent('Pág. 1 de 2');

    const prevBtn = screen.getByTestId('mention-prev-page-btn');
    const nextBtn = screen.getByTestId('mention-next-page-btn');

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    // Clica para ir para a página 2
    fireEvent.click(nextBtn);

    expect(screen.getByTestId('mention-page-indicator')).toHaveTextContent('Pág. 2 de 2');
    expect(screen.queryByText('Contato 1')).not.toBeInTheDocument();
    expect(screen.getByText('Contato 21')).toBeInTheDocument();
    expect(screen.getByText('Contato 25')).toBeInTheDocument();
    expect(nextBtn).toBeDisabled();
    expect(prevBtn).not.toBeDisabled();

    // Clica para voltar para a página 1
    fireEvent.click(prevBtn);
    expect(screen.getByTestId('mention-page-indicator')).toHaveTextContent('Pág. 1 de 2');
    expect(screen.getByText('Contato 1')).toBeInTheDocument();
  });

  it('shows warning alert and disables items when common user reaches 5 mentions', () => {
    render(
      <ChatMentionContactsList
        contacts={mockContacts}
        filterText=""
        currentUser={{ role: 'aluno' }}
        currentMentionCount={5}
        onSelectContact={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('mention-limit-alert')).toBeInTheDocument();
    expect(screen.getByText(/Limite de 5 menções por mensagem atingido/i)).toBeInTheDocument();

    const contactBtn = screen.getByTestId('mention-contact-item-1');
    expect(contactBtn).toBeDisabled();
  });

  it('calls onSelectContact when contact is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <ChatMentionContactsList
        contacts={mockContacts}
        filterText=""
        currentUser={{ role: 'aluno' }}
        currentMentionCount={0}
        onSelectContact={handleSelect}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('mention-contact-item-1'));
    expect(handleSelect).toHaveBeenCalledWith(mockContacts[0]);
  });
});
