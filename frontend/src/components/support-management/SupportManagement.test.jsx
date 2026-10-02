import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SupportManagement from './SupportManagement';
import { ToastProvider } from '../../context/ToastContext';

describe('SupportManagement Component', () => {
  const mockUser = {
    id: 1,
    name: 'João Aluno',
    email: 'joao@test.com',
    role: 'aluno',
  };

  const mockCourses = [
    { id: 10, title: 'Curso de React' },
    { id: 20, title: 'Curso de Node' },
  ];

  const mockTopics = [
    {
      id: 101,
      title: 'Dúvida sobre Hooks',
      content: 'Como funciona useEffect?',
      image_url: null,
      likes_count: 5,
      liked_by_me: false,
      replies_count: 2,
      last_reply_user_name: 'Instrutor Carlos',
      last_reply_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      author: { id: 1, name: 'João Aluno', role: 'aluno' },
      course: { id: 10, title: 'Curso de React' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/v1/support/my-courses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCourses),
        });
      }
      if (url.includes('/api/v1/support/topics')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: mockTopics, total: 1 }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  const renderComponent = () =>
    render(
      <ToastProvider>
        <SupportManagement currentUser={mockUser} bgColor="#090d16" />
      </ToastProvider>
    );

  it('renders header, search bar, course filter, and new topic button', async () => {
    renderComponent();

    expect(screen.getByText('Suporte e Dúvidas')).toBeInTheDocument();
    expect(screen.getByTestId('search-topics-input')).toBeInTheDocument();
    expect(screen.getByTestId('filter-course-select')).toBeInTheDocument();
    expect(screen.getByTestId('sort-topics-select')).toBeInTheDocument();
    expect(screen.getByTestId('open-new-topic-btn')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Curso de React')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders topics list with cards and details', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dúvida sobre Hooks')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('opens new topic modal when clicking button', async () => {
    renderComponent();

    const openBtn = screen.getByTestId('open-new-topic-btn');
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByTestId('new-support-topic-modal')).toBeInTheDocument();
      expect(screen.getByText('Fazer uma pergunta')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('opens topic detail modal when clicking a topic card', async () => {
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/v1/support/my-courses')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCourses) });
      }
      if (url.includes('/api/v1/support/topics/101')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ...mockTopics[0],
              replies: [],
            }),
        });
      }
      if (url.includes('/api/v1/support/topics')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: mockTopics, total: 1 }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Dúvida sobre Hooks')).toBeInTheDocument();
    }, { timeout: 3000 });

    const card = screen.getByTestId('support-topic-card-101');
    fireEvent.click(card);

    await waitFor(() => {
      expect(screen.getByTestId('support-topic-detail-modal')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('submits new topic with auto-selected course successfully', async () => {
    let capturedBody = null;
    global.fetch = vi.fn((url, options) => {
      if (url.includes('/api/v1/support/my-courses')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCourses) });
      }
      if (url.includes('/api/v1/support/topics') && options?.method === 'POST') {
        capturedBody = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 999,
              title: capturedBody.title,
              content: capturedBody.content,
              course_id: capturedBody.course_id,
              author: { id: 1, name: 'João Aluno', role: 'aluno' },
              course: { id: 10, title: 'Curso de React' },
              likes_count: 0,
              liked_by_me: false,
              replies_count: 0,
              created_at: new Date().toISOString(),
            }),
        });
      }
      if (url.includes('/api/v1/support/topics')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ items: mockTopics, total: 1 }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    renderComponent();

    // Aguarda carregar cursos
    await waitFor(() => {
      expect(screen.getByText('Curso de React')).toBeInTheDocument();
    });

    // Abre o modal de nova dúvida
    const openBtn = screen.getByTestId('open-new-topic-btn');
    fireEvent.click(openBtn);

    await waitFor(() => {
      expect(screen.getByTestId('new-support-topic-modal')).toBeInTheDocument();
    });

    // Preenche título e descrição sem precisar alterar o select do curso
    const titleInput = screen.getByTestId('support-title-input');
    const contentInput = screen.getByTestId('support-content-input');
    fireEvent.change(titleInput, { target: { value: 'Minha dúvida sobre o curso' } });
    fireEvent.change(contentInput, { target: { value: 'Explicação detalhada da dúvida' } });

    // Clica em Publicar Dúvida
    const submitBtn = screen.getByTestId('submit-new-topic-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(capturedBody).not.toBeNull();
      expect(capturedBody.course_id).toBe(10);
      expect(capturedBody.title).toBe('Minha dúvida sobre o curso');
    });
  });
});
