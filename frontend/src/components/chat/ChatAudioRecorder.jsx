import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Trash2, Send, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

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

  const startRecording = async () => {
    try {
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

      recorder.start(250);
      setDuration(0);
      if (onStartRecording) onStartRecording();

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      addToast('Não foi possível acessar o microfone. Verifique as permissões.', 'error');
      cleanupRecording();
      if (onCancelRecording) onCancelRecording();
    }
  };

  const handleCancel = () => {
    cleanupRecording();
    if (onCancelRecording) onCancelRecording();
  };

  const handleFinishAndSend = () => {
    if (!mediaRecorderRef.current) return;
    const recorder = mediaRecorderRef.current;

    recorder.onstop = () => {
      const mime = recorder.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mime });
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (audioBlob.size > 0 && onSendAudio) {
        onSendAudio(audioBlob, duration);
      }
      setDuration(0);
      audioChunksRef.current = [];
    };

    try {
      recorder.stop();
    } catch (err) {
      console.error('Erro ao parar gravação:', err);
      cleanupRecording();
    }
  };

  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, [cleanupRecording]);

  if (!isRecording) {
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
    <div
      data-testid="chat-audio-recording-bar"
      className="flex items-center gap-3 px-3 py-1.5 rounded-xl border animate-pulse"
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
        <span className="text-xs font-bold text-red-400">Gravando</span>
        <span className="text-xs font-mono font-bold text-white bg-black/40 px-2 py-0.5 rounded">
          {formatDuration(duration)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 ml-2">
        {/* Cancelar / Descartar */}
        <button
          type="button"
          onClick={handleCancel}
          disabled={sending}
          data-testid="chat-cancel-record-btn"
          title="Descartar gravação"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <Trash2 size={16} />
        </button>

        {/* Enviar Áudio Gravado */}
        <button
          type="button"
          onClick={handleFinishAndSend}
          disabled={sending}
          data-testid="chat-send-audio-btn"
          title="Enviar áudio gravado"
          className="px-2.5 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md"
          style={{
            backgroundColor: '#10b981',
          }}
        >
          {sending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Send size={13} />
              <span>Enviar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
