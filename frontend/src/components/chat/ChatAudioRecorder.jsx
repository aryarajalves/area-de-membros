import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Trash2, Square } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ChatAudioCaptionModal from './ChatAudioCaptionModal';

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function ChatAudioRecorder({
  isRecording,
  onStartRecording,
  onCancelRecording,
  onSendAudio,
  sending = false,
}) {
  const { addToast } = useToast();
  const [duration, setDuration] = useState(0);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignora erro ao parar
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setDuration(0);
  }, []);

  const resetAll = useCallback(() => {
    cleanupRecording();
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setCaption('');
    setIsReviewing(false);
    setRecordedDuration(0);
  }, [cleanupRecording, recordedUrl]);

  const startRecording = async () => {
    try {
      resetAll();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addToast('Seu navegador não suporta gravação de áudio direta.', 'error');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg');

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mime });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setRecordedBlob(blob);
          setRecordedUrl(url);
          setRecordedDuration(duration);
          setIsReviewing(true);
        }
        audioChunksRef.current = [];
      };

      recorder.start(250);
      setDuration(0);
      if (onStartRecording) onStartRecording();

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      addToast('Não foi possível acessar o microfone. Verifique as permissões.', 'error');
      resetAll();
      if (onCancelRecording) onCancelRecording();
    }
  };

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Erro ao parar gravação:', err);
        resetAll();
      }
    }
  };

  const handleDiscard = () => {
    resetAll();
    if (onCancelRecording) onCancelRecording();
  };

  const handleSendAudioWithCaption = () => {
    if (!recordedBlob) return;
    if (onSendAudio) {
      onSendAudio(recordedBlob, caption.trim());
    }
    resetAll();
  };

  useEffect(() => {
    return () => {
      cleanupRecording();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [cleanupRecording, recordedUrl]);

  // Se não estiver gravando nem revisando áudio, renderiza o botão na barra
  if (!isRecording && !isReviewing) {
    return (
      <button
        type="button"
        onClick={startRecording}
        disabled={sending}
        title="Gravar áudio para o chat"
        data-testid="chat-record-audio-btn"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
        style={{
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        <Mic size={18} />
      </button>
    );
  }

  return (
    <>
      {/* Botão indicador ativo na barra de ferramentas */}
      <button
        type="button"
        disabled
        title="Gravação de áudio em andamento..."
        data-testid="chat-record-audio-active-btn"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-red-400 bg-red-500/10 border border-red-500/30"
      >
        <Mic size={18} className="animate-pulse" />
      </button>

      {/* POPUP 1: Gravação em Andamento */}
      {isRecording && !isReviewing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '16px',
          }}
          data-testid="chat-audio-recording-modal-backdrop"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              backgroundColor: '#0a0f1d',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(239, 68, 68, 0.15)',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '18px',
              color: '#f8fafc',
              textAlign: 'center',
            }}
            data-testid="chat-audio-recording-modal"
          >
            {/* Badge superior: Gravando Áudio */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '5px 14px',
                borderRadius: '20px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '0.78rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  boxShadow: '0 0 10px #ef4444',
                }}
                className="animate-ping"
              />
              <span>GRAVANDO ÁUDIO</span>
            </div>

            {/* Círculo com Microfone Glow */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ef4444',
                boxShadow: '0 0 25px rgba(239, 68, 68, 0.25)',
              }}
            >
              <Mic size={36} className="animate-pulse" />
            </div>

            {/* Barras de Ondas Sonoras */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                height: '32px',
                padding: '0 10px',
              }}
              data-testid="chat-audio-wave-visualizer"
            >
              {[14, 24, 32, 20, 28, 16, 26, 30, 18, 22].map((height, i) => (
                <div
                  key={i}
                  style={{
                    width: '3.5px',
                    height: `${height}px`,
                    backgroundColor: '#ef4444',
                    borderRadius: '2px',
                    opacity: 0.85,
                    animation: 'pulse 1s ease-in-out infinite alternate',
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>

            {/* Cronômetro */}
            <div>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: '2.1rem',
                  fontWeight: 800,
                  color: '#f8fafc',
                  letterSpacing: '2px',
                  textShadow: '0 0 15px rgba(255, 255, 255, 0.2)',
                }}
                data-testid="recording-timer"
              >
                {formatDuration(duration)}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Fale claramente no microfone
              </p>
            </div>

            {/* Botões de Ação: Descartar e Parar Gravação */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                marginTop: '4px',
              }}
            >
              {/* Descartar */}
              <button
                type="button"
                onClick={handleDiscard}
                disabled={sending}
                data-testid="chat-cancel-record-btn"
                title="Descartar gravação"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={16} />
                <span>Descartar</span>
              </button>

              {/* Parar Gravação */}
              <button
                type="button"
                onClick={handleStopRecording}
                disabled={sending}
                data-testid="chat-stop-record-btn"
                title="Parar gravação e revisar áudio"
                style={{
                  flex: 1.3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '11px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: sending ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(220, 38, 38, 0.35)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Square size={15} fill="currentColor" />
                <span>Parar Gravação</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP 2: Prévia do Áudio com Player e Campo de Legenda Opcional */}
      {isReviewing && recordedUrl && (
        <ChatAudioCaptionModal
          recordedUrl={recordedUrl}
          recordedDuration={recordedDuration}
          caption={caption}
          setCaption={setCaption}
          onCancel={handleDiscard}
          onConfirmSend={handleSendAudioWithCaption}
          sending={sending}
        />
      )}
    </>
  );
}
