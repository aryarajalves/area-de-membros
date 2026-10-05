import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatInputBar from './ChatInputBar';
import { ToastProvider } from '../../context/ToastContext';

describe('ChatInputBar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <ToastProvider>
        <ChatInputBar onSendMessage={vi.fn().mockResolvedValue(true)} {...props} />
      </ToastProvider>
    );
  };

  it('renders input elements and attach button', () => {
    renderComponent({ channelName: 'geral' });

    expect(screen.getByPlaceholderText(/Enviar mensagem em #geral/i)).toBeInTheDocument();
    expect(screen.getByTestId('chat-attach-button')).toBeInTheDocument();
    expect(screen.getByTestId('chat-send-button')).toBeDisabled();
  });

  it('enables send button when text is typed and calls onSendMessage', async () => {
    const handleSend = vi.fn().mockResolvedValue(true);
    renderComponent({ onSendMessage: handleSend });

    const textarea = screen.getByTestId('chat-message-textarea');
    fireEvent.change(textarea, { target: { value: 'Olá mundo!' } });

    const sendBtn = screen.getByTestId('chat-send-button');
    expect(sendBtn).not.toBeDisabled();

    fireEvent.click(sendBtn);
    await waitFor(() => {
      expect(handleSend).toHaveBeenCalledWith('Olá mundo!', null, null);
    });
  });
});
