import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SupportReplyItem from './SupportReplyItem';

describe('SupportReplyItem Component', () => {
  const mockReply = {
    id: 501,
    content: 'Você deve rodar npm run build antes do docker restart.',
    image_url: 'https://example.com/solution-step.png',
    is_solution: false,
    is_instructor_reply: true,
    created_at: new Date().toISOString(),
    author: {
      id: 2,
      name: 'Carlos Instrutor',
      role: 'admin',
    },
  };

  const mockCurrentUser = {
    id: 1, // Autor do tópico
    role: 'aluno',
  };

  it('renders reply details, author badge and actions', () => {
    const handleToggleSolution = vi.fn();
    const handleDelete = vi.fn();
    const handleImageClick = vi.fn();

    render(
      <SupportReplyItem
        reply={mockReply}
        currentUser={mockCurrentUser}
        topicAuthorId={1}
        onToggleSolution={handleToggleSolution}
        onDeleteReply={handleDelete}
        onImageClick={handleImageClick}
      />
    );

    expect(screen.getByText('Carlos Instrutor')).toBeInTheDocument();
    expect(screen.getByText('Instrutor')).toBeInTheDocument();
    expect(screen.getByText('Você deve rodar npm run build antes do docker restart.')).toBeInTheDocument();

    const solutionBtn = screen.getByTestId('toggle-solution-btn-501');
    expect(solutionBtn).toBeInTheDocument();
    expect(solutionBtn).toHaveTextContent('Marcar Solução');
    fireEvent.click(solutionBtn);
    expect(handleToggleSolution).toHaveBeenCalledWith(501);

    const imagePreview = screen.getByTestId('reply-attached-image-501');
    fireEvent.click(imagePreview);
    expect(handleImageClick).toHaveBeenCalledWith('https://example.com/solution-step.png', 'Anexo da resposta');
  });

  it('highlights reply with golden theme and shows badge when is_solution is true', () => {
    const solutionReply = { ...mockReply, is_solution: true };

    render(
      <SupportReplyItem
        reply={solutionReply}
        currentUser={mockCurrentUser}
        topicAuthorId={1}
        onToggleSolution={vi.fn()}
      />
    );

    expect(screen.getByTestId('solution-badge-501')).toHaveTextContent('Solução Oficial');
    const solutionBtn = screen.getByTestId('toggle-solution-btn-501');
    expect(solutionBtn).toHaveTextContent('Solução');
  });
});
