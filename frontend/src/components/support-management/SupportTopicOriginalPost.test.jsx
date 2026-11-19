import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SupportTopicOriginalPost from './SupportTopicOriginalPost';

describe('SupportTopicOriginalPost Component', () => {
  const mockTopic = {
    id: 1,
    title: 'Como rodar o build no Docker?',
    content: 'Estou com dúvida sobre o volume de dist no Nginx.',
    image_url: 'https://example.com/screenshot.png',
    status: 'open',
    has_solution: false,
    liked_by_me: false,
    likes_count: 3,
    replies: [{}, {}],
    created_at: new Date().toISOString(),
    author: {
      id: 10,
      name: 'Maria Dev',
      role: 'aluno',
    },
  };

  const mockUser = {
    id: 10,
    name: 'Maria Dev',
    role: 'aluno',
  };

  it('renders author, title, content and action buttons', () => {
    const handleLike = vi.fn();
    const handleStatus = vi.fn();
    const handleImageClick = vi.fn();

    render(
      <SupportTopicOriginalPost
        topic={mockTopic}
        currentUser={mockUser}
        onToggleLike={handleLike}
        onToggleStatus={handleStatus}
        updatingStatus={false}
        onImageClick={handleImageClick}
      />
    );

    expect(screen.getByText('Maria Dev')).toBeInTheDocument();
    expect(screen.getByText('Como rodar o build no Docker?')).toBeInTheDocument();
    expect(screen.getByText('Estou com dúvida sobre o volume de dist no Nginx.')).toBeInTheDocument();
    expect(screen.getByText('3 curtidas')).toBeInTheDocument();
    expect(screen.getByText('2 respostas')).toBeInTheDocument();

    const likeBtn = screen.getByTestId('detail-like-btn');
    fireEvent.click(likeBtn);
    expect(handleLike).toHaveBeenCalledTimes(1);

    const statusBtn = screen.getByTestId('toggle-topic-status-btn');
    expect(statusBtn).toHaveTextContent('Marcar como Resolvida');
    fireEvent.click(statusBtn);
    expect(handleStatus).toHaveBeenCalledTimes(1);

    const imagePreview = screen.getByTestId('topic-attached-image');
    fireEvent.click(imagePreview);
    expect(handleImageClick).toHaveBeenCalledWith('https://example.com/screenshot.png', 'Como rodar o build no Docker?');
  });

  it('shows badge Resolvida and button Reabrir Dúvida when status is resolved', () => {
    const resolvedTopic = { ...mockTopic, status: 'resolved', has_solution: true };

    render(
      <SupportTopicOriginalPost
        topic={resolvedTopic}
        currentUser={mockUser}
        onToggleLike={vi.fn()}
        onToggleStatus={vi.fn()}
        updatingStatus={false}
      />
    );

    expect(screen.getByTestId('detail-resolved-badge')).toHaveTextContent('Resolvida');
    const statusBtn = screen.getByTestId('toggle-topic-status-btn');
    expect(statusBtn).toHaveTextContent('✓ Resolvida (Reabrir)');
  });

  it('renders module and lesson context badges, allows clicking them to navigate to the lesson, and displays multiple attached images', async () => {
    const handleImageClick = vi.fn();
    const handleCloseModal = vi.fn();
    const navEvents = [];
    const lessonEvents = [];
    const onNav = (e) => navEvents.push(e.detail);
    const onLesson = (e) => lessonEvents.push(e.detail);
    window.addEventListener('app:navigate_tab', onNav);
    window.addEventListener('open_course_lesson', onLesson);

    const multiMediaTopic = {
      ...mockTopic,
      course: { id: 10, title: 'Astrowake' },
      module_id: 101,
      lesson_id: 1002,
      module_title: 'Módulo 1 - Fundamentos',
      lesson_title: 'Aula 2 - Mapa Astral',
      image_urls: [
        'https://example.com/print1.png',
        'https://example.com/print2.png',
      ],
    };

    render(
      <SupportTopicOriginalPost
        topic={multiMediaTopic}
        currentUser={mockUser}
        onToggleLike={vi.fn()}
        onToggleStatus={vi.fn()}
        onImageClick={handleImageClick}
        onCloseModal={handleCloseModal}
      />
    );

    const modBadge = screen.getByTestId('detail-module-badge');
    const lessonBadge = screen.getByTestId('detail-lesson-badge');
    expect(modBadge).toHaveTextContent('Módulo: Módulo 1 - Fundamentos');
    expect(lessonBadge).toHaveTextContent('Aula: Aula 2 - Mapa Astral');

    fireEvent.click(lessonBadge);
    expect(handleCloseModal).toHaveBeenCalledTimes(1);
    expect(navEvents).toEqual([{ tab: 'courses' }]);

    await new Promise((r) => setTimeout(r, 200));
    expect(lessonEvents).toEqual([{ courseId: 10, moduleId: 101, lessonId: 1002 }]);

    window.removeEventListener('app:navigate_tab', onNav);
    window.removeEventListener('open_course_lesson', onLesson);

    const img1 = screen.getByTestId('topic-attached-image');
    const img2 = screen.getByTestId('topic-attached-image-1');
    expect(img1).toBeInTheDocument();
    expect(img2).toBeInTheDocument();

    fireEvent.click(img2);
    expect(handleImageClick).toHaveBeenCalledWith('https://example.com/print2.png', 'Como rodar o build no Docker?');
  });
});
