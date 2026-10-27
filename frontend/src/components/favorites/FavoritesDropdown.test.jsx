import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FavoritesDropdown from './FavoritesDropdown';

describe('FavoritesDropdown Component', () => {
  const mockFavoritesData = {
    topics: [
      {
        id: 10,
        title: 'Como integrar API com n8n?',
        content: 'Estou com dificuldades para configurar os webhooks...',
        status: 'open',
        created_at: '2026-10-05T12:00:00Z',
        course_title: 'Curso de Integrações',
        author: { id: 1, name: 'Carlos Tech' },
      },
    ],
    lessons: [
      {
        id: 25,
        title: 'Arquitetura de Microsserviços',
        description: 'Visão geral da estrutura de backends modulares',
        duration: '18 min',
        created_at: '2026-10-05T13:00:00Z',
        course_id: 1,
        course_title: 'Backend Expert',
        module_id: 101,
        module_title: 'Módulo de Microsserviços',
      },
    ],
    comments: [
      {
        id: 42,
        content: 'Excelente explicação nesta aula!',
        created_at: '2026-10-05T14:00:00Z',
        course_id: 1,
        course_title: 'Backend Expert',
        module_id: 101,
        module_title: 'Módulo de Microsserviços',
        lesson_id: 25,
        lesson_title: 'Arquitetura de Microsserviços',
        author: { id: 2, name: 'Mariana Aluna' },
      },
    ],
    messages: [
      {
        id: 77,
        message: 'Link do material compartilhado no chat',
        channel_type: 'course',
        course_id: 1,
        course_title: 'Curso de Astrologia',
        created_at: '2026-10-05T15:00:00Z',
        author: { id: 3, name: 'Instrutor Ary' },
      },
      {
        id: 88,
        message: 'Olá, podemos tirar uma dúvida rápida?',
        channel_type: 'dm',
        other_user: { id: 9, name: 'Lucas Colega' },
        created_at: '2026-10-05T15:30:00Z',
        author: { id: 9, name: 'Lucas Colega' },
      },
    ],
    counts: {
      topics: 1,
      lessons: 1,
      comments: 1,
      messages: 2,
      total: 5,
    },
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockFavoritesData,
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(<FavoritesDropdown isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('favorites-dropdown')).not.toBeInTheDocument();
  });

  it('renders dropdown with tabs and items when isOpen is true', async () => {
    render(<FavoritesDropdown isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByTestId('favorites-dropdown')).toBeInTheDocument();
    expect(screen.getByText('Favoritos')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('favorites-total-count')).toHaveTextContent('5');
      expect(screen.getByTestId('fav-tab-duvidas')).toBeInTheDocument();
      expect(screen.getByTestId('fav-tab-aulas')).toBeInTheDocument();
      expect(screen.getByTestId('fav-tab-comentarios')).toBeInTheDocument();
      expect(screen.getByTestId('fav-tab-mensagens')).toBeInTheDocument();

      // Aba inicial: duvidas
      expect(screen.getByText('Como integrar API com n8n?')).toBeInTheDocument();
    });
  });

  it('switches between tabs and shows correct items', async () => {
    render(<FavoritesDropdown isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Como integrar API com n8n?')).toBeInTheDocument();
    });

    // Clica na aba Aulas
    fireEvent.click(screen.getByTestId('fav-tab-aulas'));
    expect(screen.getByText('Arquitetura de Microsserviços')).toBeInTheDocument();
    expect(screen.getByText(/Módulo: Módulo de Microsserviços/i)).toBeInTheDocument();

    // Clica na aba Comentários
    fireEvent.click(screen.getByTestId('fav-tab-comentarios'));
    expect(screen.getAllByText(/Excelente explicação nesta aula!/i).length).toBeGreaterThan(0);

    // Clica na aba Mensagens
    fireEvent.click(screen.getByTestId('fav-tab-mensagens'));
    expect(screen.getAllByText(/Link do material compartilhado no chat/i).length).toBeGreaterThan(0);
  });

  it('calls onNavigate and onClose when an item is clicked', async () => {
    const handleNavigate = vi.fn();
    const handleClose = vi.fn();

    render(
      <FavoritesDropdown
        isOpen={true}
        onClose={handleClose}
        onNavigate={handleNavigate}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('fav-item-duvidas-10')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('fav-item-duvidas-10'));
    expect(handleNavigate).toHaveBeenCalledWith('duvidas', expect.objectContaining({ id: 10 }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<FavoritesDropdown isOpen={true} onClose={handleClose} />);

    fireEvent.click(screen.getByTestId('close-favorites-dropdown-btn'));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders comment location (course > module > lesson) and navigates with correct parameters', async () => {
    const handleNavigate = vi.fn();
    const handleClose = vi.fn();

    render(
      <FavoritesDropdown
        isOpen={true}
        onClose={handleClose}
        onNavigate={handleNavigate}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('fav-tab-comentarios')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('fav-tab-comentarios'));

    await waitFor(() => {
      expect(screen.getByTestId('fav-comment-location')).toBeInTheDocument();
      expect(screen.getByText('Backend Expert')).toBeInTheDocument();
      expect(screen.getByText('Módulo de Microsserviços')).toBeInTheDocument();
      expect(screen.getByText('Arquitetura de Microsserviços')).toBeInTheDocument();
      expect(screen.getByText('"Excelente explicação nesta aula!"')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('fav-item-comentarios-42'));
    expect(handleNavigate).toHaveBeenCalledWith('comentarios', expect.objectContaining({
      id: 42,
      course_id: 1,
      course_title: 'Backend Expert',
      module_id: 101,
      module_title: 'Módulo de Microsserviços',
      lesson_id: 25,
      lesson_title: 'Arquitetura de Microsserviços'
    }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders group chat origin and DM origin in messages tab and navigates correctly', async () => {
    const handleNavigate = vi.fn();
    const handleClose = vi.fn();

    render(
      <FavoritesDropdown
        isOpen={true}
        onClose={handleClose}
        onNavigate={handleNavigate}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Como integrar API com n8n?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('fav-tab-mensagens'));

    await waitFor(() => {
      // Mensagem em grupo
      expect(screen.getByText('Curso de Astrologia')).toBeInTheDocument();
      expect(screen.getByText('"Link do material compartilhado no chat"')).toBeInTheDocument();

      // Mensagem em DM
      expect(screen.getAllByText('Lucas Colega').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('"Olá, podemos tirar uma dúvida rápida?"')).toBeInTheDocument();
    });

    // Clica na DM para abrir conversa
    fireEvent.click(screen.getByTestId('fav-item-mensagens-88'));
    expect(handleNavigate).toHaveBeenCalledWith('mensagens', expect.objectContaining({
      id: 88,
      channel_type: 'dm',
      other_user: expect.objectContaining({ name: 'Lucas Colega' })
    }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders with zIndex: 1000000 to ensure it stays above all other components and canvases', () => {
    render(<FavoritesDropdown isOpen={true} onClose={vi.fn()} />);
    const dropdown = screen.getByTestId('favorites-dropdown');
    expect(dropdown).toHaveStyle({ zIndex: '1000000' });
  });
});
