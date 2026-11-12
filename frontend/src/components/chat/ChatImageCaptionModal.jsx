import React, { useState, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Loader2, Maximize2, Minimize2 } from 'lucide-react';

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
  const [isMaximized, setIsMaximized] = useState(false);

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

  return (
    <div
      className="chat-image-caption-backdrop"
      data-testid="chat-image-caption-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000010,
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
          maxWidth: isMaximized ? '680px' : '520px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          transition: 'max-width 0.25s ease',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              data-testid="toggle-maximize-caption-btn"
              title={isMaximized ? "Recolher campo de legenda" : "Maximizar campo de legenda para ver melhor o que está digitando"}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: isMaximized ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: isMaximized ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                color: isMaximized ? '#38bdf8' : '#cbd5e1',
                cursor: 'pointer',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span>{isMaximized ? 'Recolher' : 'Maximizar'}</span>
            </button>
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
        </div>

        {/* Área de Visualização da Imagem */}
        <div
          style={{
            padding: isMaximized ? '10px 16px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            maxHeight: isMaximized ? '240px' : '360px',
            overflow: 'hidden',
            transition: 'max-height 0.25s ease',
          }}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt="Pré-visualização"
              data-testid="image-caption-preview"
              style={{
                maxWidth: '100%',
                maxHeight: isMaximized ? '220px' : '320px',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                transition: 'max-height 0.25s ease',
              }}
            />
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Carregando imagem...</div>
          )}
        </div>

        {/* Input de Legenda e Ações */}
        <div style={{ padding: '16px', backgroundColor: '#0f172a' }}>
          {isMaximized ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                backgroundColor: '#1e293b',
                borderRadius: '10px',
                padding: '12px',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.15)',
              }}
            >
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escreva uma legenda detalhada para a imagem... (Pressione Enter para enviar ou Shift+Enter para quebrar linha)"
                data-testid="image-caption-input"
                autoFocus
                disabled={isSending}
                maxLength={1000}
                rows={4}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: '#f8fafc',
                  fontSize: '0.875rem',
                  lineHeight: '1.5',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  minHeight: '90px',
                  maxHeight: '200px',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '8px',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {caption.length}/1000 caracteres • Enter envia, Shift+Enter pula linha
                </span>
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
                    padding: '8px 16px',
                    cursor: isSending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)',
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
            </div>
          ) : (
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
          )}
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
