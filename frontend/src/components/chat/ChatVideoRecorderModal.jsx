import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Video, Send, RotateCcw, Circle, Square, Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function ChatVideoRecorderModal({ onSendRecordedVideo, onClose }) {
  const { addToast } = useToast();
  const [stream, setStream] = useState(null);
  const [recorderState, setRecorderState] = useState('initializing'); // 'initializing' | 'ready' | 'recording' | 'preview' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const videoElementRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  const stopAllMediaTracks = useCallback((activeStream) => {
    const s = activeStream || stream;
    if (s) {
      s.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
    }
  }, [stream]);

  const initCamera = useCallback(async () => {
    setRecorderState('initializing');
    setErrorMessage('');
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('Seu navegador não suporta captura de vídeo pela câmera.');
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setStream(mediaStream);
      if (videoElementRef.current) {
        try {
          videoElementRef.current.srcObject = mediaStream;
        } catch {
          // fallback para navegadores antigos ou ambiente de teste
        }
        videoElementRef.current.muted = true;
        if (typeof videoElementRef.current.play === 'function') {
          try {
            await videoElementRef.current.play();
          } catch {
            // autoplay ignore
          }
        }
      }
      setRecorderState('ready');
    } catch (err) {
      console.error('Erro ao acessar câmera:', err);
      setRecorderState('error');
      setErrorMessage(
        err.name === 'NotAllowedError'
          ? 'Permissão de acesso à câmera/microfone foi negada.'
          : 'Não foi possível acessar a câmera ou microfone.'
      );
    }
  }, []);

  useEffect(() => {
    initCamera();
    return () => {
      stopAllMediaTracks();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const handleStartRecording = () => {
    if (!stream) return;
    recordedChunksRef.current = [];
    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setRecorderState('preview');

        // Mudar o player para reproduzir o blob gravado
        if (videoElementRef.current) {
          videoElementRef.current.srcObject = null;
          videoElementRef.current.src = url;
          videoElementRef.current.muted = false;
          videoElementRef.current.controls = true;
          videoElementRef.current.load();
        }
      };

      recorder.start(250);
      setRecorderState('recording');
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 180) { // Limite máximo de 3 minutos
            handleStopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Erro ao iniciar MediaRecorder:', err);
      addToast('Não foi possível iniciar a gravação de vídeo.', 'error');
    }
  };

  const handleStopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleRetake = async () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setRecordedBlob(null);
    setRecordingSeconds(0);
    await initCamera();
  };

  const handleClose = () => {
    stopAllMediaTracks();
    onClose();
  };

  const handleSend = async () => {
    if (!recordedBlob || isUploading) return;
    setIsUploading(true);
    try {
      const success = await onSendRecordedVideo(recordedBlob, caption.trim());
      if (success) {
        handleClose();
      }
    } catch (err) {
      console.error('Erro ao enviar vídeo:', err);
      addToast('Falha ao enviar vídeo gravado.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      className="chat-video-recorder-backdrop"
      data-testid="chat-video-recorder-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        className="chat-video-recorder-panel"
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.2)',
          width: '100%',
          maxWidth: '560px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
      >
        {/* Topo / Cabeçalho */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={18} color="#38bdf8" />
            <span style={{ fontSize: '0.925rem', fontWeight: 600, color: '#f8fafc' }}>
              Gravar Vídeo para o Chat
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            data-testid="close-video-recorder-btn"
            title="Fechar"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Área do Player / Câmera */}
        <div style={{ position: 'relative', backgroundColor: '#020617', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <video
            ref={videoElementRef}
            data-testid="video-recorder-preview-element"
            playsInline
            style={{ width: '100%', maxHeight: '340px', objectFit: 'contain', backgroundColor: '#000000', transform: recorderState !== 'preview' ? 'scaleX(-1)' : 'none' }}
          />

          {recorderState === 'initializing' && (
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#94a3b8' }}>
              <Loader2 size={32} className="animate-spin" color="#38bdf8" />
              <span style={{ fontSize: '0.875rem' }}>Iniciando câmera...</span>
            </div>
          )}

          {recorderState === 'error' && (
            <div style={{ position: 'absolute', padding: '20px', textAlign: 'center', color: '#f87171', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={36} />
              <p style={{ fontSize: '0.875rem', margin: 0 }}>{errorMessage}</p>
              <button
                type="button"
                onClick={initCamera}
                style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '0.8125rem', cursor: 'pointer' }}
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {recorderState === 'recording' && (
            <div
              data-testid="recording-timer-badge"
              style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: '#ffffff', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)' }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ffffff', animation: 'pulse 1s infinite' }} />
              <span>{formatTimer(recordingSeconds)}</span>
            </div>
          )}
        </div>

        <div style={{ padding: '16px', backgroundColor: '#0f172a' }}>
          {recorderState === 'preview' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Legenda do vídeo (opcional)..."
                data-testid="video-caption-input"
                disabled={isUploading}
                maxLength={500}
                style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#1e293b', borderRadius: '8px', padding: '8px 12px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#f8fafc', fontSize: '0.875rem', outline: 'none' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={handleRetake}
                  disabled={isUploading}
                  data-testid="retake-video-btn"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', border: 'none', borderRadius: '8px', padding: '8px 14px', fontSize: '0.8125rem', cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RotateCcw size={15} />
                  <span>Gravar Novamente</span>
                </button>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isUploading}
                  data-testid="send-recorded-video-btn"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '0.875rem', fontWeight: 600, cursor: isUploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 10px rgba(37, 99, 235, 0.4)' }}
                >
                  {isUploading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Enviando Vídeo...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Enviar Vídeo</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              {recorderState === 'ready' && (
                <button
                  type="button"
                  onClick={handleStartRecording}
                  data-testid="start-video-record-btn"
                  style={{ backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '24px', padding: '10px 22px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
                >
                  <Circle size={16} fill="#ffffff" />
                  <span>Iniciar Gravação</span>
                </button>
              )}

              {recorderState === 'recording' && (
                <button
                  type="button"
                  onClick={handleStopRecording}
                  data-testid="stop-video-record-btn"
                  style={{ backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '24px', padding: '10px 22px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.5)' }}
                >
                  <Square size={16} fill="#ffffff" />
                  <span>Parar Gravação ({formatTimer(recordingSeconds)})</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
