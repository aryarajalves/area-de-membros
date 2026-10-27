import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatAudioRecorder from './ChatAudioRecorder';
import { ToastProvider } from '../../context/ToastContext';

describe('ChatAudioRecorder Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-audio');
    global.URL.revokeObjectURL = vi.fn();
  });

  const renderWithContext = (ui) => {
    return render(<ToastProvider>{ui}</ToastProvider>);
  };

  it('renderiza o botão de microfone na barra quando isRecording é falso', () => {
    renderWithContext(
      <ChatAudioRecorder
        isRecording={false}
        onStartRecording={vi.fn()}
        onCancelRecording={vi.fn()}
        onSendAudio={vi.fn()}
      />
    );

    expect(screen.getByTestId('chat-record-audio-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('chat-audio-recording-modal')).not.toBeInTheDocument();
  });

  it('renderiza o popup modal de gravação com botão Parar Gravação e Descartar', () => {
    renderWithContext(
      <ChatAudioRecorder
        isRecording={true}
        onStartRecording={vi.fn()}
        onCancelRecording={vi.fn()}
        onSendAudio={vi.fn()}
      />
    );

    // Modal e Backdrop centralizado
    expect(screen.getByTestId('chat-audio-recording-modal-backdrop')).toBeInTheDocument();
    expect(screen.getByTestId('chat-audio-recording-modal')).toBeInTheDocument();

    // Elementos do Modal de Gravação
    expect(screen.getByText('GRAVANDO ÁUDIO')).toBeInTheDocument();
    expect(screen.getByTestId('recording-timer')).toBeInTheDocument();
    expect(screen.getByText('00:00')).toBeInTheDocument();
    expect(screen.getByText('Fale claramente no microfone')).toBeInTheDocument();
    expect(screen.getByTestId('chat-audio-wave-visualizer')).toBeInTheDocument();

    // Botões
    expect(screen.getByTestId('chat-cancel-record-btn')).toBeInTheDocument();
    expect(screen.getByText('Descartar')).toBeInTheDocument();
    expect(screen.getByTestId('chat-stop-record-btn')).toBeInTheDocument();
    expect(screen.getByText('Parar Gravação')).toBeInTheDocument();
  });

  it('chama onCancelRecording ao clicar no botão Descartar durante a gravação', () => {
    const onCancelMock = vi.fn();
    renderWithContext(
      <ChatAudioRecorder
        isRecording={true}
        onStartRecording={vi.fn()}
        onCancelRecording={onCancelMock}
        onSendAudio={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('chat-cancel-record-btn'));
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('impede fechamento acidental ao clicar dentro do card do popup (stopPropagation)', () => {
    renderWithContext(
      <ChatAudioRecorder
        isRecording={true}
        onStartRecording={vi.fn()}
        onCancelRecording={vi.fn()}
        onSendAudio={vi.fn()}
      />
    );

    const modal = screen.getByTestId('chat-audio-recording-modal');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const spSpy = vi.spyOn(clickEvent, 'stopPropagation');

    modal.dispatchEvent(clickEvent);
    expect(spSpy).toHaveBeenCalled();
  });

  it('abre o popup de prévia com player de áudio e campo de legenda ao parar a gravação', async () => {
    let onStopCallback = null;
    let onDataAvailableCallback = null;

    class MockMediaRecorder {
      constructor(stream, options) {
        this.stream = stream;
        this.options = options;
        this.state = 'recording';
        this.mimeType = 'audio/webm';
      }
      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        if (onDataAvailableCallback) {
          onDataAvailableCallback({ data: new Blob(['fake-audio'], { type: 'audio/webm' }) });
        }
        if (onStopCallback) {
          onStopCallback();
        }
      }
      set ondataavailable(cb) {
        onDataAvailableCallback = cb;
      }
      set onstop(cb) {
        onStopCallback = cb;
      }
    }
    MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);

    global.MediaRecorder = MockMediaRecorder;
    navigator.mediaDevices = {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    };

    const onSendAudioMock = vi.fn();
    const onStartRecordingMock = vi.fn();

    const { rerender } = renderWithContext(
      <ChatAudioRecorder
        isRecording={false}
        onStartRecording={onStartRecordingMock}
        onCancelRecording={vi.fn()}
        onSendAudio={onSendAudioMock}
      />
    );

    // Inicia gravação
    await act(async () => {
      fireEvent.click(screen.getByTestId('chat-record-audio-btn'));
    });
    expect(onStartRecordingMock).toHaveBeenCalled();

    // Rerender com isRecording=true
    rerender(
      <ToastProvider>
        <ChatAudioRecorder
          isRecording={true}
          onStartRecording={onStartRecordingMock}
          onCancelRecording={vi.fn()}
          onSendAudio={onSendAudioMock}
        />
      </ToastProvider>
    );

    // Deve estar no popup 1 de gravação
    expect(screen.getByTestId('chat-audio-recording-modal')).toBeInTheDocument();

    // Clica em "Parar Gravação"
    await act(async () => {
      fireEvent.click(screen.getByTestId('chat-stop-record-btn'));
    });

    // Deve abrir o POPUP 2: Prévia e Legenda
    expect(screen.getByTestId('chat-audio-caption-modal')).toBeInTheDocument();
    expect(screen.getByText('Revisar Áudio')).toBeInTheDocument();
    expect(screen.getByTestId('audio-preview-player')).toBeInTheDocument();

    // Digita legenda opcional
    const captionInput = screen.getByTestId('audio-caption-input');
    fireEvent.change(captionInput, { target: { value: 'Segue o áudio explicativo da aula' } });

    // Clica em "Enviar Áudio"
    await act(async () => {
      fireEvent.click(screen.getByTestId('chat-send-audio-btn'));
    });

    expect(onSendAudioMock).toHaveBeenCalledWith(
      expect.any(Blob),
      'Segue o áudio explicativo da aula'
    );
  });
});
