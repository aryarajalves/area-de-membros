import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IntroductionManagement from './IntroductionManagement';
import { ToastProvider } from '../../context/ToastContext';

describe('IntroductionManagement Component', () => {
  const mockUser = {
    id: 1,
    name: 'José Nedson',
    role: 'aluno',
    avatar_url: null,
  };

  const mockPosts = [
    {
      id: 101,
      user_id: 1,
      user_name: 'José Nedson',
      user_role: 'aluno',
      user_avatar: null,
      title: 'Apresentação - Nedson Lessa',
      content: 'Me chamo Nedson Lessa, sou de Maceió. Trabalho com contabilidade e busco aprender IA.',
      likes_count: 4,
      comments_count: 3,
      is_liked_by_me: false,
      last_comment_user_name: 'Matheus',
      last_comment_at: '2026-10-10T12:00:00Z',
      created_at: '2026-10-09T10:00:00Z',
      updated_at: '2026-10-09T10:00:00Z',
      comments: [
        {
          id: 501,
          post_id: 101,
          user_id: 2,
          user_name: 'Matheus',
          user_role: 'admin',
          user_avatar: null,
          content: 'Seja bem-vindo Nedson!',
          created_at: '2026-10-10T12:00:00Z',
        },
      ],
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
  });

  it('renderiza o banner com título, tópicos e botão de chamada para ação', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPosts,
    });

    render(
      <ToastProvider>
        <IntroductionManagement user={mockUser} bgColor="#090d16" />
      </ToastProvider>
    );

    expect(screen.getByTestId('introductions-banner')).toBeInTheDocument();
    expect(screen.getByText('Boas-vindas')).toBeInTheDocument();
    expect(screen.getByText('Conte quem você é')).toBeInTheDocument();
    expect(screen.getByTestId('banner-open-create-btn')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Apresentação - Nedson Lessa')).toBeInTheDocument();
    });
  });

  it('permite abrir o modal de criar apresentação e publicar novo post', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 102,
          user_id: 1,
          user_name: 'José Nedson',
          user_role: 'aluno',
          title: 'Novo Membro na Área',
          content: 'Muito animado para aprender com todo mundo aqui!',
          likes_count: 0,
          comments_count: 0,
          is_liked_by_me: false,
          created_at: '2026-10-13T10:00:00Z',
          updated_at: '2026-10-13T10:00:00Z',
          comments: [],
        }),
      });

    render(
      <ToastProvider>
        <IntroductionManagement user={mockUser} bgColor="#090d16" />
      </ToastProvider>
    );

    // Clica em "Quero me apresentar" no banner
    fireEvent.click(screen.getByTestId('banner-open-create-btn'));

    expect(screen.getByTestId('intro-create-modal')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('intro-post-title-input'), {
      target: { value: 'Novo Membro na Área' },
    });
    fireEvent.change(screen.getByTestId('intro-post-content-input'), {
      target: { value: 'Muito animado para aprender com todo mundo aqui!' },
    });

    fireEvent.click(screen.getByTestId('submit-create-post-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/introductions',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"title":"Novo Membro na Área"'),
        })
      );
      expect(screen.getByText('Novo Membro na Área')).toBeInTheDocument();
    });
  });

  it('permite clicar em um post para abrir o modal de detalhes, curtir e comentar', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts[0],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ liked: true, likes_count: 5 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 502,
          post_id: 101,
          user_id: 1,
          user_name: 'José Nedson',
          user_role: 'aluno',
          content: 'Obrigado pelas boas-vindas!',
          created_at: '2026-10-13T11:00:00Z',
        }),
      });

    render(
      <ToastProvider>
        <IntroductionManagement user={mockUser} bgColor="#090d16" />
      </ToastProvider>
    );

    // Espera listar o post
    const postRow = await screen.findByTestId('intro-post-row-101');
    fireEvent.click(postRow);

    // Modal de detalhes aberto
    expect(await screen.findByTestId('intro-post-modal')).toBeInTheDocument();
    expect(screen.getByTestId('intro-post-content')).toHaveTextContent('Me chamo Nedson Lessa, sou de Maceió');
    expect(screen.getByText('Seja bem-vindo Nedson!')).toBeInTheDocument();

    // Clica em Curtir
    const likeBtn = screen.getByTestId('toggle-like-post-btn');
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/introductions/101/like',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Envia novo comentário
    const inputComment = screen.getByTestId('new-comment-input');
    fireEvent.change(inputComment, { target: { value: 'Obrigado pelas boas-vindas!' } });
    fireEvent.click(screen.getByTestId('submit-comment-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/introductions/101/comments',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Obrigado pelas boas-vindas!' }),
        })
      );
      expect(screen.getByText('Obrigado pelas boas-vindas!')).toBeInTheDocument();
    });

    // Fecha o modal
    fireEvent.click(screen.getByTestId('close-intro-post-modal-btn'));
    expect(screen.queryByTestId('intro-post-modal')).not.toBeInTheDocument();
  });

  it('permite curtir a postagem diretamente na listagem sem abrir o modal', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ liked: true, likes_count: 5 }),
      });

    render(
      <ToastProvider>
        <IntroductionManagement user={mockUser} bgColor="#090d16" />
      </ToastProvider>
    );

    // Espera listar o post
    const likeBtn = await screen.findByTestId('like-post-btn-101');
    expect(likeBtn).toBeInTheDocument();

    // Clica diretamente no botão de like da linha
    fireEvent.click(likeBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/introductions/101/like',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Garante que o modal de detalhes NÃO foi aberto
    expect(screen.queryByTestId('intro-post-modal')).not.toBeInTheDocument();
  });

  it('exibe popup de confirmação estilizado com ícone ao excluir apresentação', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPosts[0],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Excluído com sucesso' }),
      });

    render(
      <ToastProvider>
        <IntroductionManagement user={mockUser} bgColor="#090d16" />
      </ToastProvider>
    );

    const postRow = await screen.findByTestId('intro-post-row-101');
    fireEvent.click(postRow);

    expect(await screen.findByTestId('intro-post-modal')).toBeInTheDocument();

    // Clica no ícone de exclusão
    const deleteTrigger = screen.getByTestId('delete-intro-post-trigger-btn');
    fireEvent.click(deleteTrigger);

    // Popup estilizado visível
    const overlay = screen.getByTestId('intro-confirm-delete-overlay');
    expect(overlay).toBeInTheDocument();
    expect(screen.getByText('Excluir Apresentação?')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-delete-post-btn')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-post-btn')).toBeInTheDocument();

    // Clica em Cancelar
    fireEvent.click(screen.getByTestId('cancel-delete-post-btn'));
    expect(screen.queryByTestId('intro-confirm-delete-overlay')).not.toBeInTheDocument();
  });

  it('dispara o evento open_direct_message e fecha modal ao clicar em Chamar na DM', async () => {
    const postOutroUsuario = {
      id: 202,
      user_id: 99,
      user_name: 'jordão',
      user_role: 'admin',
      user_email: 'jordao@exemplo.com',
      title: 'Me chamo jordao',
      content: 'Sou apaixonado por tecnologia.',
      likes_count: 1,
      comments_count: 0,
      is_liked_by_me: false,
      created_at: '2026-10-13T21:12:00Z',
      comments: [],
    };

    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [postOutroUsuario],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => postOutroUsuario,
      });

    const dmEventListener = vi.fn();
    window.addEventListener('open_direct_message', dmEventListener);

    render(
      <ToastProvider>
        <IntroductionManagement user={mockUser} bgColor="#090d16" />
      </ToastProvider>
    );

    // Abre o modal do post
    const postRow = await screen.findByTestId('intro-post-row-202');
    fireEvent.click(postRow);

    const modal = await screen.findByTestId('intro-post-modal');
    expect(modal).toBeInTheDocument();

    // Clica no botão Chamar na DM dentro do modal
    const dmBtn = within(modal).getByTestId('intro-link-dm');
    expect(dmBtn).toBeInTheDocument();
    fireEvent.click(dmBtn);

    // O evento global open_direct_message deve ter sido disparado com o contato
    expect(dmEventListener).toHaveBeenCalledTimes(1);
    const eventArg = dmEventListener.mock.calls[0][0];
    expect(eventArg.detail.contact).toEqual(
      expect.objectContaining({
        id: 99,
        name: 'jordão',
        email: 'jordao@exemplo.com',
        role: 'admin',
      })
    );

    // O modal da apresentação deve ter sido fechado para exibir a conversa da DM
    await waitFor(() => {
      expect(screen.queryByTestId('intro-post-modal')).not.toBeInTheDocument();
    });

    window.removeEventListener('open_direct_message', dmEventListener);
  });

  it('permite editar uma apresentação existente via PUT e atualiza a interface', async () => {
    const editablePost = {
      id: 303,
      user_id: mockUser.id,
      user_name: mockUser.name,
      user_role: mockUser.role,
      title: 'Apresentação Antiga',
      content: 'Texto inicial da minha apresentação.',
      niche: 'Astrologia',
      location: 'Florianópolis - SC',
      likes_count: 0,
      comments_count: 0,
      is_liked_by_me: false,
      is_pinned: false,
      created_at: '2026-10-06T12:00:00Z',
      comments: [],
    };

    const updatedPost = {
      ...editablePost,
      title: 'Apresentação Editada',
      content: 'Texto atualizado da minha apresentação.',
    };

    global.fetch = vi.fn((url, options) => {
      if (url === '/api/v1/introductions' && (!options || !options.method)) {
        return Promise.resolve({ ok: true, json: async () => [editablePost] });
      }
      if (url === '/api/v1/introductions/303' && (!options || !options.method)) {
        return Promise.resolve({ ok: true, json: async () => editablePost });
      }
      if (url === '/api/v1/introductions/303' && options?.method === 'PUT') {
        return Promise.resolve({ ok: true, json: async () => updatedPost });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <ToastProvider>
        <IntroductionManagement user={mockUser} bgColor="#090d16" />
      </ToastProvider>
    );

    const postRow = await screen.findByTestId('intro-post-row-303');
    fireEvent.click(postRow);

    const detailModal = await screen.findByTestId('intro-post-modal');
    const editBtn = within(detailModal).getByTestId('edit-intro-post-trigger-btn');
    fireEvent.click(editBtn);

    const editModal = await screen.findByTestId('intro-create-modal');
    expect(within(editModal).getByText('Editar Apresentação')).toBeInTheDocument();

    const titleInput = within(editModal).getByDisplayValue('Apresentação Antiga');
    fireEvent.change(titleInput, { target: { value: 'Apresentação Editada' } });

    const submitBtn = within(editModal).getByTestId('submit-create-post-btn');
    expect(submitBtn).toHaveTextContent('Salvar Alterações');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/introductions/303',
        expect.objectContaining({ method: 'PUT' })
      );
    });

    await waitFor(() => {
      expect(screen.queryByTestId('intro-create-modal')).not.toBeInTheDocument();
    });
    expect(screen.getAllByText('Apresentação Editada').length).toBeGreaterThanOrEqual(1);
  });
});
