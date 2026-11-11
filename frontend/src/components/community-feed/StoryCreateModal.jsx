import React, { useState, useRef } from 'react';
import { X, UploadCloud, Film, Image as ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { uploadStoryMedia, createStory } from './communityStoriesApi';

export default function StoryCreateModal({ isOpen, onClose, onStoryCreated }) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mediaType, setMediaType] = useState('image');
  const [caption, setCaption] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
    const isVideo = ['mp4', 'webm', 'mov'].includes(ext);

    if (!isImage && !isVideo) {
      addToast('Formato não suportado. Use JPG, PNG ou vídeo MP4.', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      addToast('O arquivo deve ter no máximo 50MB.', 'error');
      return;
    }

    setSelectedFile(file);
    setMediaType(isVideo ? 'video' : 'image');
    setPreviewUrl(URL.createObjectURL(file));

    if (isVideo) {
      // Obter duração do vídeo
      const videoElement = document.createElement('video');
      videoElement.src = URL.createObjectURL(file);
      videoElement.onloadedmetadata = () => {
        const sec = Math.min(60, Math.max(3, Math.round(videoElement.duration)));
        setDurationSeconds(sec);
      };
    } else {
      setDurationSeconds(5);
    }
  };

  const handleClearMedia = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setCaption('');
    setDurationSeconds(5);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast('Selecione uma imagem ou vídeo para o seu story.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload do arquivo
      const uploadRes = await uploadStoryMedia(selectedFile);

      // 2. Criação do Story
      const newStory = await createStory({
        mediaUrl: uploadRes.media_url,
        mediaType: uploadRes.media_type,
        caption: caption.trim() || null,
        durationSeconds,
      });

      addToast('Story publicado com sucesso! +5 XP ganhos!', 'success');
      handleClearMedia();
      if (onStoryCreated) onStoryCreated(newStory);
      onClose();
    } catch (err) {
      addToast(err.message || 'Erro ao publicar story.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="feed-modal-backdrop"
      data-testid="story-create-modal"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="story-create-modal"
        data-testid="story-create-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="feed-profile-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#38bdf8" />
            <h3 className="feed-profile-title">Criar Story</h3>
          </div>
          <button
            type="button"
            className="feed-likes-modal-close-btn"
            onClick={onClose}
            disabled={isSubmitting}
            title="Fechar"
            data-testid="story-create-close-btn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp, video/mp4, video/webm"
            style={{ display: 'none' }}
            data-testid="story-file-input"
          />

          {!previewUrl ? (
            <div
              className="story-create-dropzone"
              onClick={() => fileInputRef.current?.click()}
              data-testid="story-dropzone"
            >
              <div style={{ display: 'flex', gap: '10px' }}>
                <ImageIcon size={32} color="#38bdf8" />
                <Film size={32} color="#a855f7" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: '#f1f5f9' }}>
                  Clique para enviar uma foto ou vídeo
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Imagens (JPG, PNG) ou Vídeos de até 60 segundos
                </p>
              </div>
            </div>
          ) : (
            <div className="story-create-preview" data-testid="story-preview-container">
              {mediaType === 'video' ? (
                <video src={previewUrl} controls autoPlay muted playsInline />
              ) : (
                <img src={previewUrl} alt="Preview do Story" />
              )}
              <button
                type="button"
                onClick={handleClearMedia}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Remover mídia"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Legenda Opcional */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
              Legenda (opcional):
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Escreva algo sobre este story..."
              maxLength={500}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                fontSize: '0.88rem',
                resize: 'none',
                outline: 'none',
              }}
              data-testid="story-caption-input"
            />
          </div>

          {/* Duração para exibição */}
          {previewUrl && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '16px' }}>
              <span>Duração do Story:</span>
              <strong style={{ color: '#38bdf8' }}>{durationSeconds} segundos</strong>
            </div>
          )}

          {/* Ações */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                borderRadius: '8px',
                background: selectedFile ? 'linear-gradient(135deg, #0284c7, #2563eb)' : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: selectedFile && !isSubmitting ? 'pointer' : 'not-allowed',
                boxShadow: selectedFile ? '0 2px 10px rgba(37, 99, 235, 0.35)' : 'none',
              }}
              data-testid="story-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="feed-spinner" />
                  <span>Publicando...</span>
                </>
              ) : (
                <span>Publicar Story (+5 XP)</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
