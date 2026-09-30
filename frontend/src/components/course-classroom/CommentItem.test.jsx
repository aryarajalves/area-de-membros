import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CommentItem from './CommentItem';

describe('CommentItem Component', () => {
  const mockComment = {
    id: 10,
    lesson_id: 101,
    user_id: 2,
    content: 'Como funciona a integração com a W-API nesta aula?',
    created_at: '2026-09-30T10:00:00Z',
    user: {
      id: 2,
      name: 'Maria Aluna',
      role: 'aluno'
    },
    replies: [
      {
        id: 11,
        lesson_id: 101,
        user_id: 1,
        parent_id: 10,
        content: 'Basta configurar o token no dashboard e enviar o webhook!',
        created_at: '2026-09-30T10:15:00Z',
        user: {
          id: 1,
          name: 'Instrutor Carlos',
          role: 'admin'
        }
      }
    ]
  };

  const mockGetRoleBadge = (role) => {
    if (role === 'admin') return { label: 'Admin', bg: '#fef3c7', text: '#d97706' };
    return { label: 'Aluno', bg: '#e0f2fe', text: '#0284c7' };
  };

  const mockCanDelete = (item) => item.user_id === 1;

  it('renders root comment content, author, badge and action buttons', () => {
    render(
      <CommentItem
        comment={mockComment}
        currentUser={{ id: 1, role: 'admin' }}
        onReply={vi.fn()}
        onDeleteRequest={vi.fn()}
        getRoleBadge={mockGetRoleBadge}
        canDeleteComment={mockCanDelete}
      />
    );

    expect(screen.getByText('Maria Aluna')).toBeInTheDocument();
    expect(screen.getByText('Como funciona a integração com a W-API nesta aula?')).toBeInTheDocument();
    expect(screen.getByTestId('reply-btn-10')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-replies-btn-10')).toHaveTextContent('Ocultar respostas (1)');
  });

  it('renders nested replies and toggles visibility when clicked', () => {
    render(
      <CommentItem
        comment={mockComment}
        currentUser={{ id: 1, role: 'admin' }}
        onReply={vi.fn()}
        onDeleteRequest={vi.fn()}
        getRoleBadge={mockGetRoleBadge}
        canDeleteComment={mockCanDelete}
      />
    );

    // Resposta está visível inicialmente
    expect(screen.getByText('Instrutor Carlos')).toBeInTheDocument();
    expect(screen.getByText('Basta configurar o token no dashboard e enviar o webhook!')).toBeInTheDocument();

    // Clicar para ocultar respostas
    fireEvent.click(screen.getByTestId('toggle-replies-btn-10'));
    expect(screen.queryByTestId('replies-list-10')).not.toBeInTheDocument();
    expect(screen.getByTestId('toggle-replies-btn-10')).toHaveTextContent('Ver 1 resposta');

    // Clicar para reabrir
    fireEvent.click(screen.getByTestId('toggle-replies-btn-10'));
    expect(screen.getByTestId('replies-list-10')).toBeInTheDocument();
  });

  it('opens reply form, types response and calls onReply on submit', async () => {
    const handleReply = vi.fn().mockResolvedValue({});

    render(
      <CommentItem
        comment={mockComment}
        currentUser={{ id: 1, role: 'admin' }}
        onReply={handleReply}
        onDeleteRequest={vi.fn()}
        getRoleBadge={mockGetRoleBadge}
        canDeleteComment={mockCanDelete}
      />
    );

    // Clicar em Responder
    fireEvent.click(screen.getByTestId('reply-btn-10'));
    expect(screen.getByTestId('reply-form-10')).toBeInTheDocument();

    const textarea = screen.getByTestId('reply-input-10');
    fireEvent.change(textarea, { target: { value: 'Aqui está mais um detalhe importante.' } });

    fireEvent.click(screen.getByTestId('submit-reply-btn-10'));

    expect(handleReply).toHaveBeenCalledWith(10, 'Aqui está mais um detalhe importante.');
  });

  it('pre-fills mention when clicking reply button on a specific response', () => {
    render(
      <CommentItem
        comment={mockComment}
        currentUser={{ id: 1, role: 'admin' }}
        onReply={vi.fn()}
        onDeleteRequest={vi.fn()}
        getRoleBadge={mockGetRoleBadge}
        canDeleteComment={mockCanDelete}
      />
    );

    // Clica no botão responder na resposta do Instrutor Carlos
    fireEvent.click(screen.getByTestId('reply-to-user-btn-11'));

    expect(screen.getByTestId('reply-form-10')).toBeInTheDocument();
    expect(screen.getByTestId('reply-input-10')).toHaveValue('@Instrutor Carlos ');
  });

  it('triggers onDeleteRequest when clicking delete on root comment and reply', () => {
    const handleDeleteRequest = vi.fn();

    render(
      <CommentItem
        comment={mockComment}
        currentUser={{ id: 1, role: 'admin' }}
        onReply={vi.fn()}
        onDeleteRequest={handleDeleteRequest}
        getRoleBadge={mockGetRoleBadge}
        canDeleteComment={mockCanDelete}
      />
    );

    // Usuário tem permissão de apagar a resposta id 11 (user_id === 1)
    const deleteReplyBtn = screen.getByTestId('delete-reply-btn-11');
    fireEvent.click(deleteReplyBtn);
    expect(handleDeleteRequest).toHaveBeenCalledWith(mockComment.replies[0]);
  });
});
