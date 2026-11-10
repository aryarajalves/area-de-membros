import React, { useState, useRef } from 'react';
import { Image, Video, Send, X, Loader2, Sparkles, BookOpen } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { createFeedPost, uploadFeedMedia } from './communityFeedApi';
import FeedMentionAutocomplete from './FeedMentionAutocomplete';

export default function FeedCreatePostCard({ user, courses = [], onPostCreated, onOpenProfile }) {
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [mediaUrls, setMediaUrls] = useState([]);
  const [mediaType, setMediaType] = useState('none'); // 'none', 'image', 'carousel', 'video'
  const [mediaThumbnailUrl, setMediaThumbnailUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mentionQuery, setMentionQuery] = useState(null);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);
  const textareaRef = useRef(null);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'M';

  const handleTextChange = (e) => {
    const val = e.target.value;
    setContent(val);

    const cursor = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_À-ÿ]*)$/);
    if (match) {
      setMentionQuery(match[1]);
    } else {
      setMentionQuery(null);
    }
  };

  const handleSelectMention = (candidate) => {
    if (!textareaRef.current) return;
    const cursor = textareaRef.current.selectionStart || content.length;
    const textBeforeCursor = content.slice(0, cursor);
    const textAfterCursor = content.slice(cursor);
    const updatedBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_À-ÿ]*)$/, `@${candidate.name} `);
    const nextContent = updatedBefore + textAfterCursor;
    setContent(nextContent);
    setMentionQuery(null);
  };

  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (mediaType === 'video') {
      addToast('Não é possível misturar vídeo e fotos no mesmo post.', 'error');
      return;
    }

    if (mediaUrls.length + files.length > 10) {
      addToast('O limite máximo é de 10 fotos por publicação.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          addToast(`Arquivo ${file.name} não é uma imagem válida.`, 'error');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          addToast(`Imagem ${file.name} excede o limite de 10MB.`, 'error');
          continue;
        }
        const res = await uploadFeedMedia(file);
        if (res?.url) uploadedUrls.push(res.url);
      }

      if (uploadedUrls.length > 0) {
        const nextList = [...mediaUrls, ...uploadedUrls];
        setMediaUrls(nextList);
        setMediaType(nextList.length > 1 ? 'carousel' : 'image');
        addToast(
          uploadedUrls.length > 1
            ? `${uploadedUrls.length} fotos adicionadas ao carrossel!`
            : 'Foto adicionada com sucesso!',
          'success'
        );
      }
    } catch (err) {
      addToast(err.message || 'Erro ao enviar fotos.', 'error');
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mediaUrls.length > 0) {
      addToast('Não é possível misturar vídeo e fotos no mesmo post. Remova as fotos primeiro.', 'error');
      return;
    }

    if (!file.type.startsWith('video/')) {
      addToast('Por favor, selecione um arquivo de vídeo (MP4, WebM, MOV).', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      addToast('O vídeo não pode ultrapassar 50MB.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadFeedMedia(file);
      if (res?.url) {
        setMediaUrls([res.url]);
        setMediaType('video');
        addToast('Vídeo carregado com sucesso!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao enviar o vídeo.', 'error');
    } finally {
      setIsUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleThumbnailSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('A capa deve ser um arquivo de imagem (JPG, PNG, WebP).', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('A imagem de capa não pode ultrapassar 10MB.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadFeedMedia(file);
      if (res?.url) {
        setMediaThumbnailUrl(res.url);
        addToast('Capa do vídeo definida com sucesso! 🖼️', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao enviar a capa.', 'error');
    } finally {
      setIsUploading(false);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (index) => {
    const next = mediaUrls.filter((_, i) => i !== index);
    setMediaUrls(next);
    if (next.length === 0) {
      setMediaType('none');
      setMediaThumbnailUrl(null);
    } else if (mediaType === 'video') {
      setMediaType('video');
    } else {
      setMediaType(next.length > 1 ? 'carousel' : 'image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      addToast('Escreva algo para publicar.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalType = mediaUrls.length === 0 ? 'none' : mediaType;
      const newPost = await createFeedPost({
        content: content.trim(),
        courseId: selectedCourseId ? Number(selectedCourseId) : null,
        mediaUrls,
        mediaType: finalType,
        mediaThumbnailUrl: finalType === 'video' ? mediaThumbnailUrl : null,
      });
      addToast('Publicação compartilhada na comunidade! 🎉', 'success');
      setContent('');
      setSelectedCourseId('');
      setMediaUrls([]);
      setMediaType('none');
      setMediaThumbnailUrl(null);
      if (onPostCreated) {
        onPostCreated(newPost);
      }
    } catch (err) {
      addToast(err.message || 'Erro ao criar publicação.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feed-create-card" data-testid="feed-create-post-card">
      <div className="feed-create-header">
        <div
          className="feed-user-avatar clickable"
          onClick={() => onOpenProfile?.(user?.id)}
          title="Ver meu perfil"
          data-testid="feed-create-user-avatar"
          style={{ cursor: 'pointer' }}
        >
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} />
          ) : (
            <span>{userInitial}</span>
          )}
        </div>
        <div className="feed-create-user-info">
          <span
            className="feed-create-user-name clickable"
            onClick={() => onOpenProfile?.(user?.id)}
            title="Ver meu perfil"
            style={{ cursor: 'pointer' }}
          >
            {user?.name || 'Membro'}
          </span>
          <span className="feed-create-subtitle">
            <Sparkles size={12} className="feed-sparkle-icon" /> Compartilhe aprendizados, carrossel ou vídeos
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="feed-create-form">
        <div className="feed-create-textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="feed-create-textarea"
            rows={3}
            placeholder="No que você está pensando ou qual foi sua vitória de hoje? Use @ para mencionar colegas..."
            value={content}
            onChange={handleTextChange}
            maxLength={2200}
            data-testid="feed-create-textarea"
          />

          {mentionQuery !== null && (
            <FeedMentionAutocomplete
              query={mentionQuery}
              onSelectCandidate={handleSelectMention}
              onClose={() => setMentionQuery(null)}
            />
          )}
        </div>

        {mediaUrls.length > 0 && (
          <div className="feed-create-media-preview" data-testid="feed-create-media-preview">
            {mediaType === 'video' ? (
              <div className="feed-video-preview-wrapper" data-testid="feed-video-preview-wrapper">
                <div className="feed-media-preview-item video">
                  <video
                    src={mediaUrls[0]}
                    poster={mediaThumbnailUrl || undefined}
                    className="feed-preview-video-thumb"
                  />
                  <span className="feed-media-preview-badge">Vídeo</span>
                  <button
                    type="button"
                    className="feed-media-preview-remove"
                    onClick={() => handleRemoveMedia(0)}
                    title="Remover vídeo"
                    data-testid="feed-remove-media-btn"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Bloco de Capa / Thumbnail do Vídeo */}
                {mediaThumbnailUrl ? (
                  <div className="feed-media-preview-item thumbnail" data-testid="feed-thumbnail-preview-item">
                    <img src={mediaThumbnailUrl} alt="Capa do Vídeo" />
                    <span className="feed-media-preview-badge thumb">Capa</span>
                    <button
                      type="button"
                      className="feed-media-preview-remove"
                      onClick={() => setMediaThumbnailUrl(null)}
                      title="Remover capa"
                      data-testid="feed-remove-thumbnail-btn"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="feed-add-thumb-card"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={isUploading}
                    title="Definir imagem de capa para o vídeo"
                    data-testid="feed-add-thumbnail-btn"
                  >
                    <Image size={18} className="feed-add-thumb-icon" />
                    <span>+ Capa / Thumbnail</span>
                  </button>
                )}
              </div>
            ) : (
              mediaUrls.map((url, idx) => (
                <div key={idx} className="feed-media-preview-item">
                  <img src={url} alt={`Upload ${idx + 1}`} />
                  <span className="feed-media-preview-badge">{idx + 1}</span>
                  <button
                    type="button"
                    className="feed-media-preview-remove"
                    onClick={() => handleRemoveMedia(idx)}
                    title="Remover foto"
                    data-testid={`feed-remove-media-btn-${idx}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        <div className="feed-create-footer">
          <div className="feed-create-tools">
            {/* Input para Fotos / Carrossel */}
            <input
              type="file"
              ref={imageInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              data-testid="feed-media-file-input"
            />
            <button
              type="button"
              className="feed-create-tool-btn"
              onClick={() => imageInputRef.current?.click()}
              disabled={isUploading || isSubmitting || mediaType === 'video'}
              title="Adicionar fotos (Carrossel)"
              data-testid="feed-add-photo-btn"
            >
              <Image size={16} />
              <span>Fotos / Carrossel</span>
            </button>

            {/* Input para Vídeos Curtos */}
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoSelect}
              accept="video/*"
              style={{ display: 'none' }}
              data-testid="feed-video-file-input"
            />
            <button
              type="button"
              className="feed-create-tool-btn"
              onClick={() => videoInputRef.current?.click()}
              disabled={isUploading || isSubmitting || (mediaUrls.length > 0 && mediaType !== 'video')}
              title="Adicionar vídeo curto (MP4/WebM até 50MB)"
              data-testid="feed-add-video-btn"
            >
              <Video size={16} />
              <span>Vídeo Curto</span>
            </button>

            {/* Input para Capa / Thumbnail do Vídeo */}
            <input
              type="file"
              ref={thumbnailInputRef}
              onChange={handleThumbnailSelect}
              accept="image/*"
              style={{ display: 'none' }}
              data-testid="feed-thumbnail-file-input"
            />
            {mediaType === 'video' && (
              <button
                type="button"
                className={`feed-create-tool-btn ${mediaThumbnailUrl ? 'active' : ''}`}
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={isUploading || isSubmitting}
                title="Definir capa personalizada para o vídeo"
                data-testid="feed-tool-thumbnail-btn"
              >
                <Image size={16} />
                <span>{mediaThumbnailUrl ? 'Trocar Capa' : 'Capa do Vídeo'}</span>
              </button>
            )}

            {/* Seletor de Cursos */}
            {courses && courses.length > 0 && (
              <div className="feed-course-select-wrapper">
                <BookOpen size={14} className="feed-course-icon" />
                <select
                  className="feed-course-select"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  disabled={isSubmitting}
                  data-testid="feed-course-select"
                >
                  <option value="">Geral da Comunidade</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="feed-create-actions">
            {content.length > 0 && (
              <span className="feed-char-counter" data-testid="feed-char-counter">
                {content.length}/2200
              </span>
            )}
            <button
              type="submit"
              className="feed-submit-btn"
              disabled={isSubmitting || isUploading || !content.trim()}
              data-testid="feed-submit-post-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="feed-spinner" />
                  Publicando...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Publicar
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
