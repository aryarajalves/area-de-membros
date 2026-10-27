import React, { useRef, useEffect } from 'react';
import { Mic, FileText, ExternalLink } from 'lucide-react';

export default function ChatMessageMediaAttachment({ message }) {
  const imgRef = useRef(null);

  if (!message?.media_url) return null;

  const isGif = Boolean(
    message.media_url && (
      /\.gif(\?.*)?$/i.test(message.media_url) ||
      message.media_url.includes('giphy.com') ||
      message.media_url.includes('tenor.com') ||
      message.media_type === 'gif'
    )
  );

  // Mecanismo para garantir que o Chromium não congele o GIF no primeiro quadro (Blink ImageDecoder wake-up)
  useEffect(() => {
    if (!isGif) return;

    // Se o elemento já estiver no DOM, forçamos o compositor a acordar o timer de animação
    const timer = setTimeout(() => {
      if (imgRef.current) {
        imgRef.current.style.transform = 'translateZ(0)';
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [isGif, message.media_url]);

  return (
    <div
      style={{
        marginBottom: message.message ? '6px' : '0',
        borderRadius: '10px',
        overflow: 'hidden',
        maxWidth: '320px',
        position: 'relative',
      }}
      data-testid={`chat-media-attachment-${message.id}`}
    >
      {message.media_type === 'audio' ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#1e293b',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          data-testid={`chat-media-audio-${message.id}`}
        >
          <Mic size={18} color="#10b981" />
          <audio
            controls
            src={message.media_url}
            style={{ maxHeight: '36px', maxWidth: '240px' }}
          />
        </div>
      ) : message.media_type === 'video' ? (
        <div
          style={{
            borderRadius: '10px',
            overflow: 'hidden',
            backgroundColor: '#000',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
          data-testid={`chat-media-video-${message.id}`}
        >
          <video
            controls
            src={message.media_url}
            style={{
              width: '100%',
              maxHeight: '220px',
              display: 'block',
              objectFit: 'contain',
            }}
          />
        </div>
      ) : message.media_type === 'file' ? (
        <a
          href={message.media_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#1e293b',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#f8fafc',
            textDecoration: 'none',
            fontSize: '0.8125rem',
          }}
        >
          <FileText size={18} color="#ef4444" />
          <span style={{ fontWeight: 600 }}>Visualizar Documento</span>
          <ExternalLink size={14} color="#94a3b8" />
        </a>
      ) : (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Clique para abrir imagem original"
            style={{ display: 'inline-block' }}
          >
            <img
              ref={imgRef}
              src={message.media_url}
              alt="Mídia da mensagem"
              loading="eager"
              decoding={isGif ? 'sync' : 'async'}
              onLoad={(e) => {
                if (isGif && e.currentTarget) {
                  e.currentTarget.style.transform = 'translateZ(0)';
                }
              }}
              style={{
                maxWidth: '280px',
                maxHeight: '240px',
                minWidth: isGif ? '160px' : 'auto',
                minHeight: isGif ? '120px' : 'auto',
                objectFit: 'cover',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'block',
                cursor: 'zoom-in',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                transform: 'translateZ(0)',
                willChange: isGif ? 'transform' : 'auto',
              }}
              data-testid={`chat-media-img-${message.id}`}
              data-is-gif={isGif ? 'true' : 'false'}
            />
          </a>
          {isGif && (
            <div
              data-testid={`chat-media-gif-badge-${message.id}`}
              style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                padding: '2px 6px',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(4px)',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#38bdf8',
                fontSize: '0.625rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                pointerEvents: 'none',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              GIF
            </div>
          )}
        </div>
      )}
    </div>
  );
}
