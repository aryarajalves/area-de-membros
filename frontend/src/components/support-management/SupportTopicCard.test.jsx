import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SupportTopicCard from './SupportTopicCard';

describe('SupportTopicCard Component', () => {
  const dummyTopic = {
    id: 42,
    title: 'Problema Bussola',
    content: 'Não consigo criar o meu mapa.',
    likes_count: 3,
    liked_by_me: false,
    replies_count: 4,
    created_at: new Date().toISOString(),
    author: {
      id: 5,
      name: 'Aryaraj Instrutor',
      role: 'admin',
    },
    course: {
      id: 10,
      title: 'Bussola Astrologica',
    },
  };

  it('renders topic information, badges, and counters correctly', () => {
    render(
      <SupportTopicCard
        topic={dummyTopic}
        currentUser={{ id: 5, role: 'admin' }}
        onClick={vi.fn()}
      />
    );

    expect(screen.getByText('Problema Bussola')).toBeInTheDocument();
    expect(screen.getByText('Não consigo criar o meu mapa.')).toBeInTheDocument();
    expect(screen.getByText('Bussola Astrologica')).toBeInTheDocument();
    expect(screen.getByText('Instrutor')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('triggers like callback on clicking the like button', () => {
    const handleLike = vi.fn();
    render(
      <SupportTopicCard
        topic={dummyTopic}
        currentUser={{ id: 1, role: 'aluno' }}
        onLike={handleLike}
      />
    );

    const likeBtn = screen.getByTestId('like-topic-btn-42');
    fireEvent.click(likeBtn);

    expect(handleLike).toHaveBeenCalledWith(42);
  });

  it('triggers onToggleLike callback as alternative prop name', () => {
    const handleToggleLike = vi.fn();
    render(
      <SupportTopicCard
        topic={dummyTopic}
        currentUser={{ id: 1, role: 'aluno' }}
        onToggleLike={handleToggleLike}
      />
    );

    const likeBtn = screen.getByTestId('like-topic-btn-42');
    fireEvent.click(likeBtn);

    expect(handleToggleLike).toHaveBeenCalledWith(42);
  });

  it('triggers comment callback on clicking the comment button', () => {
    const handleComment = vi.fn();
    render(
      <SupportTopicCard
        topic={dummyTopic}
        currentUser={{ id: 1, role: 'aluno' }}
        onCommentClick={handleComment}
      />
    );

    const commentBtn = screen.getByTestId('comment-topic-btn-42');
    fireEvent.click(commentBtn);

    expect(handleComment).toHaveBeenCalledWith(dummyTopic);
  });

  it('triggers delete callback on clicking the delete button for manager or author', () => {
    const handleDelete = vi.fn();
    render(
      <SupportTopicCard
        topic={dummyTopic}
        currentUser={{ id: 5, role: 'admin' }}
        onDelete={handleDelete}
      />
    );

    const deleteBtn = screen.getByTestId('delete-topic-btn-42');
    fireEvent.click(deleteBtn);

    expect(handleDelete).toHaveBeenCalledWith(dummyTopic);
  });

  it('hides delete button when user is neither author nor manager', () => {
    render(
      <SupportTopicCard
        topic={dummyTopic}
        currentUser={{ id: 99, role: 'aluno' }}
      />
    );

    expect(screen.queryByTestId('delete-topic-btn-42')).not.toBeInTheDocument();
  });

  it('renders pinned badge and highlighted styling when topic.is_pinned is true', () => {
    const pinnedTopic = { ...dummyTopic, is_pinned: true };
    render(
      <SupportTopicCard
        topic={pinnedTopic}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    const badge = screen.getByTestId('topic-pinned-badge-42');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Fixada por você');
  });

  it('triggers onTogglePin callback when clicking the pin button', () => {
    const handleTogglePin = vi.fn();
    render(
      <SupportTopicCard
        topic={dummyTopic}
        currentUser={{ id: 1, role: 'aluno' }}
        onTogglePin={handleTogglePin}
      />
    );

    const pinBtn = screen.getByTestId('pin-topic-btn-42');
    expect(pinBtn).toBeInTheDocument();
    fireEvent.click(pinBtn);

    expect(handleTogglePin).toHaveBeenCalledWith(42);
  });

  it('triggers onToggleFavorite callback when clicking the favorite button', () => {
    const handleToggleFavorite = vi.fn();
    render(
      <SupportTopicCard
        topic={dummyTopic}
        currentUser={{ id: 1, role: 'aluno' }}
        onToggleFavorite={handleToggleFavorite}
      />
    );

    const favBtn = screen.getByTestId('favorite-topic-btn-42');
    expect(favBtn).toBeInTheDocument();
    fireEvent.click(favBtn);

    expect(handleToggleFavorite).toHaveBeenCalledWith(42);
  });
});

