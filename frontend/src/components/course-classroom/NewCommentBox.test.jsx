import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NewCommentBox from './NewCommentBox';

describe('NewCommentBox Component', () => {
  const mockUser = {
    id: 10,
    name: 'Carlos Aluno',
    role: 'aluno'
  };

  const getRoleBadge = (role) => ({ label: 'Aluno', bg: '#e0f2fe', text: '#0284c7' });

  it('renders user info, initials, badge, and placeholder', () => {
    render(
      <NewCommentBox
        currentUser={mockUser}
        newComment=""
        setNewComment={vi.fn()}
        onSubmit={vi.fn()}
        submitting={false}
        isLightBg={false}
        getRoleBadge={getRoleBadge}
      />
    );

    expect(screen.getByText('Carlos Aluno')).toBeInTheDocument();
    expect(screen.getByText('CA')).toBeInTheDocument();
    expect(screen.getByText('Aluno')).toBeInTheDocument();
    expect(screen.getByTestId('comment-input')).toHaveAttribute(
      'placeholder',
      'Deixe sua dúvida, feedback ou comentário sobre esta aula...'
    );
    expect(screen.getByTestId('submit-comment-btn')).toBeDisabled();
  });

  it('allows clearing text with Limpar button', () => {
    const setNewComment = vi.fn();
    render(
      <NewCommentBox
        currentUser={mockUser}
        newComment="Texto digitado pelo usuário"
        setNewComment={setNewComment}
        onSubmit={vi.fn()}
        submitting={false}
        isLightBg={false}
        getRoleBadge={getRoleBadge}
      />
    );

    expect(screen.getByText('27 caracteres')).toBeInTheDocument();
    const clearBtn = screen.getByTestId('cancel-comment-btn');
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(setNewComment).toHaveBeenCalledWith('');
  });

  it('submits form via submit button click', () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <NewCommentBox
        currentUser={mockUser}
        newComment="Comentário válido"
        setNewComment={vi.fn()}
        onSubmit={onSubmit}
        submitting={false}
        isLightBg={false}
        getRoleBadge={getRoleBadge}
      />
    );

    const submitBtn = screen.getByTestId('submit-comment-btn');
    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('submits via Ctrl + Enter keypress', () => {
    const onSubmit = vi.fn((e) => e.preventDefault());
    render(
      <NewCommentBox
        currentUser={mockUser}
        newComment="Dúvida com atalho"
        setNewComment={vi.fn()}
        onSubmit={onSubmit}
        submitting={false}
        isLightBg={false}
        getRoleBadge={getRoleBadge}
      />
    );

    const textarea = screen.getByTestId('comment-input');
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    expect(onSubmit).toHaveBeenCalled();
  });
});
