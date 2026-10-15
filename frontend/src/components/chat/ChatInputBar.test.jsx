import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatInputBar from './ChatInputBar';
import { ToastProvider } from '../../context/ToastContext';

describe('ChatInputBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-url');
    global.URL.revokeObjectURL = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <ToastProvider>
        <ChatInputBar onSendMessage={vi.fn().mockResolvedValue(true)} {...props} />
      </ToastProvider>
    );
  };

  it('renders input elements, toolbar and maximize button', () => {
    renderComponent({ channelName: 'geral' });

    expect(screen.getByPlaceholderText(/Enviar mensagem em #geral/i)).toBeInTheDocument();
    expect(screen.getByTestId('chat-attach-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-image-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-gif-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-video-record-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-maximize-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-send-button')).toBeDisabled();
  });

  it('toggles textarea maximize mode when clicking maximize button', () => {
    renderComponent();

    const maxBtn = screen.getByTestId('chat-maximize-button');
    const textarea = screen.getByTestId('chat-message-textarea');

    expect(textarea).toHaveAttribute('rows', '1');

    fireEvent.click(maxBtn);
    expect(textarea).toHaveAttribute('rows', '6');

    fireEvent.click(maxBtn);
    expect(textarea).toHaveAttribute('rows', '1');
  });

  it('opens and closes GIF picker popup when clicking GIF button', () => {
    renderComponent();

    const gifBtn = screen.getByTestId('chat-gif-button');
    expect(screen.queryByTestId('chat-gif-popup')).not.toBeInTheDocument();

    fireEvent.click(gifBtn);
    expect(screen.getByTestId('chat-gif-popup')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('close-gif-popup'));
    expect(screen.queryByTestId('chat-gif-popup')).not.toBeInTheDocument();
  });

  it('opens video recorder modal when clicking video camera button', () => {
    const mockMediaStream = { getTracks: () => [{ stop: vi.fn() }] };
    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
      },
    });

    renderComponent();

    const videoBtn = screen.getByTestId('chat-video-record-button');
    fireEvent.click(videoBtn);

    expect(screen.getByTestId('chat-video-recorder-modal')).toBeInTheDocument();
  });

  it('opens caption modal when an image is pasted from clipboard', () => {
    renderComponent();

    const fakeImageFile = new File(['fake image bytes'], 'colada.png', { type: 'image/png' });
    const textarea = screen.getByTestId('chat-message-textarea');

    fireEvent.paste(textarea, {
      clipboardData: {
        items: [
          {
            type: 'image/png',
            getAsFile: () => fakeImageFile,
          },
        ],
      },
    });

    expect(screen.getByTestId('chat-image-caption-modal')).toBeInTheDocument();
    expect(screen.getByTestId('image-caption-input')).toBeInTheDocument();
  });

  it('opens caption modal when an image is dragged and dropped', () => {
    renderComponent();

    const fakeImageFile = new File(['dragged image bytes'], 'arrastada.jpg', { type: 'image/jpeg' });
    const bar = screen.getByTestId('chat-input-bar');

    fireEvent.dragOver(bar);
    expect(screen.getByTestId('chat-drag-overlay')).toBeInTheDocument();

    fireEvent.drop(bar, {
      dataTransfer: {
        files: [fakeImageFile],
      },
    });

    expect(screen.getByTestId('chat-image-caption-modal')).toBeInTheDocument();
  });

  it('triggers drag overlay when dragging files anywhere on screen and drops to open caption modal', () => {
    renderComponent();

    const fakeImageFile = new File(['screen image'], 'meio_da_tela.png', { type: 'image/png' });

    fireEvent.dragEnter(window, {
      dataTransfer: {
        types: ['Files'],
      },
    });

    expect(screen.getByTestId('chat-drag-overlay')).toBeInTheDocument();

    fireEvent.drop(window, {
      dataTransfer: {
        types: ['Files'],
        files: [fakeImageFile],
      },
    });

    expect(screen.getByTestId('chat-image-caption-modal')).toBeInTheDocument();
  });

  it('opens internal link modal when clicking link button, shows attached link preview and sends link on submit', async () => {
    const handleSendMessage = vi.fn().mockResolvedValue(true);
    renderComponent({ onSendMessage: handleSendMessage });

    const linkBtn = screen.getByTestId('chat-insert-link-button');
    expect(screen.queryByTestId('chat-internal-link-modal')).not.toBeInTheDocument();

    fireEvent.click(linkBtn);
    expect(screen.getByTestId('chat-internal-link-modal')).toBeInTheDocument();

    const homeTabBtn = screen.getByTestId('select-tab-home');
    fireEvent.click(homeTabBtn);

    expect(screen.queryByTestId('chat-internal-link-modal')).not.toBeInTheDocument();

    // Em vez de markdown bruto na textarea, exibe o card de preview limpo e estilizado
    expect(screen.getByTestId('chat-attached-link-preview')).toBeInTheDocument();
    expect(screen.getByTestId('attached-link-label')).toHaveTextContent('📍 Início');

    // Botão de envio é habilitado mesmo sem digitar texto adicional
    const sendBtn = screen.getByTestId('chat-send-button');
    expect(sendBtn).not.toBeDisabled();

    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(handleSendMessage).toHaveBeenCalledWith(
        '[📍 Início](internal://tab/home)',
        null,
        null
      );
    });

    expect(screen.queryByTestId('chat-attached-link-preview')).not.toBeInTheDocument();
  });
});

