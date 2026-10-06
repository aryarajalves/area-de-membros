import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlatformLinksTab from './PlatformLinksTab';
import { ToastProvider } from '../../context/ToastContext';

describe('PlatformLinksTab Component', () => {
  const mockLinks = [
    {
      id: 1,
      title: 'Instagram Oficial',
      url: 'https://instagram.com/oficial',
      icon: 'instagram',
      order_index: 1,
      is_active: true,
    },
    {
      id: 2,
      title: 'YouTube Oficial',
      url: 'https://youtube.com/oficial',
      icon: 'youtube',
      order_index: 2,
      is_active: false,
    },
  ];

  beforeEach(() => {
    localStorage.setItem('auth_token', 'test-token');
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <ToastProvider>
        <PlatformLinksTab
          isLightBg={false}
          cardBg="rgba(255, 255, 255, 0.04)"
          cardBorder="1px solid rgba(255, 255, 255, 0.1)"
          textColor="#f8fafc"
          subTextColor="#94a3b8"
        />
      </ToastProvider>
    );
  };

  it('renders links list and displays active/hidden badges correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockLinks,
    });

    renderComponent();

    expect(await screen.findByText('Instagram Oficial')).toBeInTheDocument();
    expect(screen.getByText('YouTube Oficial')).toBeInTheDocument();
    expect(screen.getByTestId('link-status-1')).toHaveTextContent('Ativo');
    expect(screen.getByTestId('link-status-2')).toHaveTextContent('Oculto');
  });

  it('opens create modal, fills fields and saves a new link', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLinks,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 3,
          title: 'Grupo WhatsApp VIP',
          url: 'https://chat.whatsapp.com/123',
          icon: 'whatsapp',
          order_index: 3,
          is_active: true,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [...mockLinks, { id: 3, title: 'Grupo WhatsApp VIP', url: 'https://chat.whatsapp.com/123', icon: 'whatsapp', order_index: 3, is_active: true }],
      });

    renderComponent();

    await screen.findByText('Instagram Oficial');

    // Clica no botão de adicionar novo link
    const newBtn = screen.getByTestId('create-new-link-btn');
    fireEvent.click(newBtn);

    expect(screen.getByTestId('platform-link-modal-card')).toBeInTheDocument();

    // Preenche título e URL
    const titleInput = screen.getByTestId('link-title-input');
    const urlInput = screen.getByTestId('link-url-input');

    fireEvent.change(titleInput, { target: { value: 'Grupo WhatsApp VIP' } });
    fireEvent.change(urlInput, { target: { value: 'https://chat.whatsapp.com/123' } });

    // Seleciona ícone de WhatsApp
    const whatsappIconBtn = screen.getByTestId('icon-option-whatsapp');
    fireEvent.click(whatsappIconBtn);

    // Salva
    const saveBtn = screen.getByTestId('save-link-btn');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/platform-links',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('opens delete modal and confirms deletion with backdrop protection', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockLinks,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ detail: 'Link excluído com sucesso.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [mockLinks[1]],
      });

    renderComponent();

    await screen.findByText('Instagram Oficial');

    // Abre modal de exclusão do link 1
    const delBtn = screen.getByTestId('delete-link-btn-1');
    fireEvent.click(delBtn);

    expect(screen.getByTestId('delete-link-confirm-modal-backdrop')).toBeInTheDocument();
    expect(screen.getByText(/Tem certeza que deseja remover o link/i)).toBeInTheDocument();

    // Confirma exclusão
    const confirmBtn = screen.getByTestId('confirm-delete-link-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/platform-links/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
