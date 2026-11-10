import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeedLikesModal from './FeedLikesModal';
import * as communityApi from './communityFeedApi';

vi.mock('./communityFeedApi', () => ({
  fetchFeedPostLikes: vi.fn(),
}));

describe('FeedLikesModal', () => {
  it('renderiza lista de membros que curtiram a postagem', async () => {
    vi.mocked(communityApi.fetchFeedPostLikes).mockResolvedValue([
      { user_id: 1, name: 'Lucas Aluno', avatar_url: null, role: 'student', created_at: '2026-11-10T12:00:00Z' },
      { user_id: 2, name: 'Admin Master', avatar_url: null, role: 'admin', created_at: '2026-11-10T12:05:00Z' },
    ]);

    const onClose = vi.fn();
    render(<FeedLikesModal isOpen={true} postId={100} onClose={onClose} />);

    expect(screen.getByText('Quem Curtiu')).toBeInTheDocument();
    expect(screen.getByText('Carregando membros...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Lucas Aluno')).toBeInTheDocument();
      expect(screen.getByText('Admin Master')).toBeInTheDocument();
    });

    const closeBtn = screen.getByTestId('feed-likes-modal-close-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('exibe mensagem quando ninguém curtiu ainda', async () => {
    vi.mocked(communityApi.fetchFeedPostLikes).mockResolvedValue([]);

    render(<FeedLikesModal isOpen={true} postId={101} onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma curtida nesta publicação ainda.')).toBeInTheDocument();
    });
  });
});
