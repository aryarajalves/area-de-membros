import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ChatMediaGalleryModal from './ChatMediaGalleryModal';

describe('ChatMediaGalleryModal Component', () => {
  const mockChannel = {
    id: 'general',
    name: 'Comunidade Geral',
    channel_type: 'general',
  };

  const mockItems = [
    {
      id: 101,
      message: 'Print do erro',
      media_url: 'https://cdn.test.com/foto1.png',
      media_type: 'image',
      created_at: '2026-10-05T14:30:00Z',
      user: { id: 1, name: 'Aluno VIP' },
    },
    {
      id: 102,
      message: 'Áudio sobre dúvidas',
      media_url: 'https://cdn.test.com/audio1.webm',
      media_type: 'audio',
      created_at: '2026-10-05T14:35:00Z',
      user: { id: 2, name: 'Instrutor João' },
    },
    {
      id: 103,
      message: 'Vídeo da aula prática',
      media_url: 'https://cdn.test.com/video1.mp4',
      media_type: 'video',
      created_at: '2026-10-05T14:40:00Z',
      user: { id: 3, name: 'Instrutora Ana' },
    },
    {
      id: 104,
      message: 'E-book em PDF',
      media_url: 'https://cdn.test.com/guia.pdf',
      media_type: 'file',
      created_at: '2026-10-05T14:45:00Z',
      user: { id: 1, name: 'Aluno VIP' },
    },
  ];

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        items: mockItems,
        total: 4,
        limit: 80,
        offset: 0,
      }),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ChatMediaGalleryModal
        isOpen={false}
        onClose={vi.fn()}
        channel={mockChannel}
      />
    );

    expect(screen.queryByTestId('chat-media-gallery-modal')).not.toBeInTheDocument();
  });

  it('renders modal with items and tabs when isOpen is true', async () => {
    render(
      <ChatMediaGalleryModal
        isOpen={true}
        onClose={vi.fn()}
        channel={mockChannel}
      />
    );

    expect(screen.getByTestId('chat-media-gallery-modal')).toBeInTheDocument();
    expect(screen.getByText('Mídias & Arquivos')).toBeInTheDocument();
    expect(screen.getByText('#Comunidade Geral')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('4 itens')).toBeInTheDocument();
      expect(screen.getByTestId('media-item-101')).toBeInTheDocument();
      expect(screen.getByTestId('media-item-102')).toBeInTheDocument();
      expect(screen.getByTestId('media-item-103')).toBeInTheDocument();
      expect(screen.getByTestId('media-item-104')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <ChatMediaGalleryModal
        isOpen={true}
        onClose={handleClose}
        channel={mockChannel}
      />
    );

    const closeBtn = screen.getByTestId('close-media-gallery-btn');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('filters by category tab when tab button is clicked', async () => {
    render(
      <ChatMediaGalleryModal
        isOpen={true}
        onClose={vi.fn()}
        channel={mockChannel}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('media-tab-image')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('media-tab-image'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('media_type=image'),
        expect.anything()
      );
    });
  });

  it('triggers onJumpToMessage and closes modal when "Ver no Chat" is clicked', async () => {
    const handleJump = vi.fn();
    const handleClose = vi.fn();
    render(
      <ChatMediaGalleryModal
        isOpen={true}
        onClose={handleClose}
        channel={mockChannel}
        onJumpToMessage={handleJump}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('jump-to-msg-btn-101')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('jump-to-msg-btn-101'));
    expect(handleJump).toHaveBeenCalledWith(101);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
