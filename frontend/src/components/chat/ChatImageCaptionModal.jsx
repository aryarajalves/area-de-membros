import React, { useState, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function ChatImageCaptionModal({
  imageFile,
  imageUrl,
  initialCaption = '',
  onConfirmSend,
  onCancel,
  isSending = false,
}) {
  const [caption, setCaption] = useState(initialCaption);
  const [previewSrc, setPreviewSrc] = useState(imageUrl || '');

  useEffect(() => {
    if (imageFile) {
      const objectUrl = URL.createObjectURL(imageFile);
      setPreviewSrc(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (imageUrl) {
      setPreviewSrc(imageUrl);
    }
  }, [imageFile, imageUrl]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending) {
        onConfirmSend(caption.trim());
      }
    }
  };

  const formattedSize = imageFile
    ? imageFile.size > 1024 * 1024
      ? `${(imageFile.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(imageFile.size / 1024)} KB`
    : null;

  return (
    <div
      className="chat-image-caption-backdrop"
      data-testid="chat-image-caption-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        className="chat-image-caption-panel"
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
          width: '100%',
          maxWidth: '520px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Cabeçalho */}
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
            <ImageIcon size={18} color="#38bdf8" />
            <span style={{ fontSize: '0.925rem', fontWeight: 600, color: '#f8fafc' }}>
              Pré-visualização da Imagem
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSending}
            data-testid="close-image-caption-modal"
            title="Cancelar e fechar"
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: isSending ? 'not-allowed' : 'pointer',
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

        {/* Área de Visualização da Imagem */}
        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            maxHeight: '360px',
            overflow: 'hidden',
          }}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Pré-visualização"
              data-testid="image-caption-preview"
              style={{
                maxWidth: '100%',
                maxHeight: '320px',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
              }}
            />
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Carregando imagem...</div>
          )}

          {formattedSize && (
            <div
              style={{
                marginTop: '8px',
                fontSize: '0.75rem',
                color: '#94a3b8',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '2px 8px',
                borderRadius: '10px',
              }}
            >
              {imageFile.name} • {formattedSize}
            </div>
          )}
        </div>

        {/* Input de Legenda e Ações */}
        <div style={{ padding: '16px', backgroundColor: '#0f172a' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: '#1e293b',
              borderRadius: '10px',
              padding: '8px 12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva uma legenda para a imagem... (Enter para enviar)"
              data-testid="image-caption-input"
              autoFocus
              disabled={isSending}
              maxLength={1000}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: '#f8fafc',
                fontSize: '0.875rem',
              }}
            />

            <button
              type="button"
              onClick={() => onConfirmSend(caption.trim())}
              disabled={isSending}
              data-testid="send-image-caption-btn"
              title="Enviar imagem"
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: isSending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
                transition: 'background-color 0.15s ease',
              }}
            >
              {isSending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Enviar</span>
                </>
              )}
            </button>
          </div>
          <div style={{ marginTop: '8px', textAlign: 'right' }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSending}
              data-testid="cancel-image-caption-btn"
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: isSending ? 'not-allowed' : 'pointer',
                fontSize: '0.8125rem',
                textDecoration: 'underline',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
