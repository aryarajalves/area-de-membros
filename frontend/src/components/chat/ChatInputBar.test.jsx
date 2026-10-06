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

  it('renders record audio button and expanded file accept types', () => {
    renderComponent({ channelName: 'geral' });

    const recordBtn = screen.getByTestId('chat-record-audio-btn');
    expect(recordBtn).toBeInTheDocument();

    const fileInput = screen.getByTestId('chat-file-input');
    expect(fileInput).toHaveAttribute('accept', 'image/*,video/*,audio/*,.pdf,.docx,.xlsx,.txt,.zip');
  });

  it('triggers recording mode when record button is clicked and getUserMedia is available', async () => {
    const mockMediaStream = {
      getTracks: () => [{ stop: vi.fn() }],
    };
    const mockRecorderInstance = {
      start: vi.fn(),
      stop: vi.fn(),
      ondataavailable: null,
      onstop: null,
      state: 'recording',
    };

    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
      },
    });
    function MockMediaRecorder() {
      return mockRecorderInstance;
    }
    MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);
    vi.stubGlobal('MediaRecorder', MockMediaRecorder);

    renderComponent();

    const recordBtn = screen.getByTestId('chat-record-audio-btn');
    fireEvent.click(recordBtn);

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    });
  });
});
