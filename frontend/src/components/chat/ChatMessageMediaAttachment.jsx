import React from 'react';
import { Mic, FileText, ExternalLink } from 'lucide-react';

export default function ChatMessageMediaAttachment({ message }) {
  if (!message?.media_url) return null;

  return (
    <div
      style={{
        marginBottom: message.message ? '6px' : '0',
        borderRadius: '10px',
        overflow: 'hidden',
        maxWidth: '320px',
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
        <a
          href={message.media_url}
          target="_blank"
          rel="noopener noreferrer"
          title="Clique para abrir imagem original"
          style={{ display: 'inline-block' }}
        >
          <img
            src={message.media_url}
            alt="Mídia da mensagem"
            style={{
              maxWidth: '280px',
              maxHeight: '240px',
              objectFit: 'cover',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'block',
              cursor: 'zoom-in',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
            data-testid={`chat-media-img-${message.id}`}
          />
        </a>
      )}
    </div>
  );
}
