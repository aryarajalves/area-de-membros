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
      },
    ],
    comments: [
      {
        id: 42,
        content: 'Excelente explicação nesta aula!',
        created_at: '2026-10-05T14:00:00Z',
        lesson_id: 25,
        lesson_title: 'Arquitetura de Microsserviços',
        author: { id: 2, name: 'Mariana Aluna' },
      },
    ],
    messages: [
      {
        id: 77,
        message: 'Link do material compartilhado no chat',
        created_at: '2026-10-05T15:00:00Z',
        author: { id: 3, name: 'Instrutor Ary' },
      },
    ],
    counts: {
      topics: 1,
      lessons: 1,
      comments: 1,
      messages: 1,
      total: 4,
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
      expect(screen.getByTestId('favorites-total-count')).toHaveTextContent('4');
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

    // Clica na aba Comentários
    fireEvent.click(screen.getByTestId('fav-tab-comentarios'));
    expect(screen.getAllByText('Excelente explicação nesta aula!').length).toBeGreaterThan(0);

    // Clica na aba Mensagens
    fireEvent.click(screen.getByTestId('fav-tab-mensagens'));
    expect(screen.getAllByText('Link do material compartilhado no chat').length).toBeGreaterThan(0);
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
});
