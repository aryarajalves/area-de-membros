import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatAudioCaptionModal from './ChatAudioCaptionModal';

describe('ChatAudioCaptionModal Component', () => {
  it('não renderiza nada se recordedUrl for nulo', () => {
    const { container } = render(
      <ChatAudioCaptionModal
        recordedUrl={null}
        recordedDuration={0}
        caption=""
        setCaption={vi.fn()}
        onCancel={vi.fn()}
        onConfirmSend={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o modal com player de áudio, duração formatada e campo de legenda', () => {
    const setCaptionMock = vi.fn();
    const onCancelMock = vi.fn();
    const onConfirmSendMock = vi.fn();

    render(
      <ChatAudioCaptionModal
        recordedUrl="blob:http://localhost/audio-123"
        recordedDuration={65}
        caption="Texto da legenda"
        setCaption={setCaptionMock}
        onCancel={onCancelMock}
        onConfirmSend={onConfirmSendMock}
      />
    );

    expect(screen.getByTestId('chat-audio-caption-modal-backdrop')).toBeInTheDocument();
    expect(screen.getByTestId('chat-audio-caption-modal')).toBeInTheDocument();
    expect(screen.getByText('Revisar Áudio')).toBeInTheDocument();
    expect(screen.getByText('01:05')).toBeInTheDocument();

    const player = screen.getByTestId('audio-preview-player');
    expect(player).toBeInTheDocument();
    expect(player).toHaveAttribute('src', 'blob:http://localhost/audio-123');

    const input = screen.getByTestId('audio-caption-input');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Texto da legenda');

    // Botões
    expect(screen.getByTestId('chat-caption-cancel-btn')).toBeInTheDocument();
    expect(screen.getByTestId('chat-send-audio-btn')).toBeInTheDocument();
  });

  it('permite cancelar e enviar áudio através dos botões', () => {
    const onCancelMock = vi.fn();
    const onConfirmSendMock = vi.fn();

    render(
      <ChatAudioCaptionModal
        recordedUrl="blob:http://localhost/audio-123"
        recordedDuration={10}
        caption=""
        setCaption={vi.fn()}
        onCancel={onCancelMock}
        onConfirmSend={onConfirmSendMock}
      />
    );

    fireEvent.click(screen.getByTestId('chat-caption-cancel-btn'));
    expect(onCancelMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('chat-send-audio-btn'));
    expect(onConfirmSendMock).toHaveBeenCalledTimes(1);
  });
});
