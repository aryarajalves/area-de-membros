import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatMemberProfileModal from './ChatMemberProfileModal';

describe('ChatMemberProfileModal Component', () => {
  const mockMember = {
    id: 10,
    name: 'Carlos Oliveira',
    email: 'carlos@exemplo.com',
    role: 'aluno',
    avatar_url: 'https://example.com/carlos.jpg',
    phone: '(11) 98765-4321',
    created_at: '2026-01-15T12:00:00Z',
    is_online: true,
  };

  const mockAdmin = {
    id: 1,
    name: 'Super Mestre',
    email: 'super@exemplo.com',
    role: 'superadmin',
    is_online: false,
  };

  const mockCurrentUser = {
    id: 99,
    name: 'Eu Mesmo',
    role: 'admin',
  };

  it('não renderiza quando isOpen é falso', () => {
    const { container } = render(
      <ChatMemberProfileModal
        isOpen={false}
        member={mockMember}
        currentUser={mockCurrentUser}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('não renderiza quando member é nulo', () => {
    const { container } = render(
      <ChatMemberProfileModal
        isOpen={true}
        member={null}
        currentUser={mockCurrentUser}
        onClose={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza dados do membro (nome, e-mail, telefone, papel e status online)', () => {
    render(
      <ChatMemberProfileModal
        isOpen={true}
        member={mockMember}
        currentUser={mockCurrentUser}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Carlos Oliveira')).toBeInTheDocument();
    expect(screen.getByText('carlos@exemplo.com')).toBeInTheDocument();
    expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();
    expect(screen.getByText('Aluno')).toBeInTheDocument();
    expect(screen.getByText('Online no chat')).toBeInTheDocument();

    const img = screen.getByAltText('Carlos Oliveira');
    expect(img).toHaveAttribute('src', 'https://example.com/carlos.jpg');
  });

  it('renderiza corretamente o papel de Super Admin e status offline', () => {
    render(
      <ChatMemberProfileModal
        isOpen={true}
        member={mockAdmin}
        currentUser={mockCurrentUser}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Super Mestre')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('aciona onClose ao clicar no botão fechar do topo ou do rodapé', () => {
    const handleClose = vi.fn();
    render(
      <ChatMemberProfileModal
        isOpen={true}
        member={mockMember}
        currentUser={mockCurrentUser}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByTestId('close-profile-modal-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    const footerCloseBtn = screen.getByTestId('profile-modal-close-action-btn');
    fireEvent.click(footerCloseBtn);
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('permite iniciar conversa privada (DM) ao clicar no botão de ação', () => {
    const handleStartDm = vi.fn();
    const handleClose = vi.fn();

    render(
      <ChatMemberProfileModal
        isOpen={true}
        member={mockMember}
        currentUser={mockCurrentUser}
        onClose={handleClose}
        onStartDm={handleStartDm}
      />
    );

    const dmBtn = screen.getByTestId('start-dm-btn');
    expect(dmBtn).toBeInTheDocument();
    fireEvent.click(dmBtn);

    expect(handleStartDm).toHaveBeenCalledWith(mockMember);
    expect(handleClose).toHaveBeenCalled();
  });

  it('não exibe botão de DM se o membro visualizado for o próprio usuário logado', () => {
    render(
      <ChatMemberProfileModal
        isOpen={true}
        member={mockMember}
        currentUser={{ id: 10, name: 'Carlos Oliveira' }}
        onClose={vi.fn()}
        onStartDm={vi.fn()}
      />
    );

    expect(screen.queryByTestId('start-dm-btn')).not.toBeInTheDocument();
    expect(screen.getByText('(Você)')).toBeInTheDocument();
  });
});
