import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomeTutorials from './HomeTutorials';
import * as api from './tutorialsApi';

describe('HomeTutorials Component', () => {
  const mockTutorials = [
    {
      id: 1,
      title: '1. Boas-vindas e Navegação',
      description: 'Como navegar pelo menu e acessar seus cursos.',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      duration: '04:15',
      order_index: 1,
    },
    {
      id: 2,
      title: '2. Marcando Progresso e Aulas',
      description: 'Como concluir aulas e baixar anexos.',
      video_url: 'https://exemplo.com/video2.mp4',
      duration: '06:30',
      order_index: 2,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'mock_token_123');
  });

  it('renders empty state when there are no tutorials', async () => {
    vi.spyOn(api, 'fetchTutorialsApi').mockResolvedValueOnce([]);

    render(
      <HomeTutorials
        currentUser={{ role: 'aluno' }}
        addToast={vi.fn()}
        onGoToCourses={vi.fn()}
      />
    );

    expect(await screen.findByTestId('home-tutorials-empty')).toBeInTheDocument();
    expect(screen.getByText('Nenhum tutorial inicial publicado ainda')).toBeInTheDocument();
    expect(screen.getByTestId('go-to-courses-btn')).toBeInTheDocument();
  });

  it('renders player and playlist when tutorials exist', async () => {
    vi.spyOn(api, 'fetchTutorialsApi').mockResolvedValueOnce(mockTutorials);

    render(
      <HomeTutorials
        currentUser={{ role: 'aluno' }}
        addToast={vi.fn()}
      />
    );

    expect(await screen.findByTestId('home-tutorials-view')).toBeInTheDocument();
    const items = await screen.findAllByText('1. Boas-vindas e Navegação');
    expect(items.length).toBeGreaterThan(0);
    expect(screen.getByTestId('playlist-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-player-container')).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-iframe')).toBeInTheDocument();

    // Como é aluno, não exibe botões de gerenciamento
    expect(screen.queryByTestId('create-tutorial-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('edit-tutorial-btn-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-tutorial-btn-1')).not.toBeInTheDocument();
  });

  it('switches active tutorial when clicking on playlist item', async () => {
    vi.spyOn(api, 'fetchTutorialsApi').mockResolvedValueOnce(mockTutorials);

    render(
      <HomeTutorials
        currentUser={{ role: 'aluno' }}
        addToast={vi.fn()}
      />
    );

    await screen.findByTestId('playlist-item-1');

    // Clica no segundo item da playlist
    const secondItem = screen.getByTestId('playlist-item-2');
    fireEvent.click(secondItem);

    // Agora o vídeo ativo é o vídeo MP4 tag
    expect(await screen.findByTestId('tutorial-video-tag')).toBeInTheDocument();
    expect(screen.getByText('Como concluir aulas e baixar anexos.')).toBeInTheDocument();
  });

  it('shows create, edit and delete buttons for admin/superadmin', async () => {
    vi.spyOn(api, 'fetchTutorialsApi').mockResolvedValueOnce(mockTutorials);

    render(
      <HomeTutorials
        currentUser={{ role: 'superadmin' }}
        addToast={vi.fn()}
      />
    );

    expect(await screen.findByTestId('create-tutorial-btn')).toBeInTheDocument();
    expect(screen.getByTestId('edit-tutorial-btn-1')).toBeInTheDocument();
    expect(screen.getByTestId('delete-tutorial-btn-1')).toBeInTheDocument();
  });

  it('opens delete modal and confirms deletion of tutorial', async () => {
    vi.spyOn(api, 'fetchTutorialsApi').mockResolvedValue(mockTutorials);
    vi.spyOn(api, 'deleteTutorialApi').mockResolvedValueOnce({ detail: 'Ok' });

    render(
      <HomeTutorials
        currentUser={{ role: 'admin' }}
        addToast={vi.fn()}
      />
    );

    await screen.findByTestId('delete-tutorial-btn-1');
    fireEvent.click(screen.getByTestId('delete-tutorial-btn-1'));

    expect(screen.getByTestId('delete-tutorial-modal')).toBeInTheDocument();
    expect(screen.getByText('Excluir Aula de Tutorial?')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-delete-tutorial-btn'));

    await waitFor(() => {
      expect(api.deleteTutorialApi).toHaveBeenCalledWith(1, 'mock_token_123');
    });
  });
});
