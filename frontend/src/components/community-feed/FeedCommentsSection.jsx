import React, { useState, useRef } from 'react';
import { Send, Trash2, Loader2, Mic, Square, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { createFeedComment, deleteFeedComment, uploadCommentAudio } from './communityFeedApi';
import FeedAudioPlayer from './FeedAudioPlayer';
import FeedGifPickerModal from './FeedGifPickerModal';
import { renderTextWithLinks } from '../../utils/linkifyUtils';

export default function FeedCommentsSection({
  postId,
  comments = [],
  currentUser,
  onCommentAdded,
  onCommentDeleted,
}) {
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  // Áudio
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // GIF Picker
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const newComment = await createFeedComment(postId, content.trim(), null, {
        mediaType: 'text',
      });
      setContent('');
      if (onCommentAdded) {
        onCommentAdded(newComment);
      }
      addToast('Comentário enviado!', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao enviar comentário.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        addToast('Gravação de voz não suportada pelo navegador.', 'error');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Para cada trilha do stream para liberar o microfone
        stream.getTracks().forEach((track) => track.stop());

        if (audioBlob.size < 1000) {
          addToast('Áudio muito curto.', 'error');
          return;
        }

        setIsSubmitting(true);
        try {
          const res = await uploadCommentAudio(audioBlob);
          const newComment = await createFeedComment(postId, '[Áudio]', null, {
            mediaType: 'audio',
            mediaUrl: res.audio_url,
          });
          if (onCommentAdded) {
            onCommentAdded(newComment);
          }
          addToast('Áudio enviado no comentário! 🎙️', 'success');
        } catch (err) {
          addToast(err.message || 'Erro ao enviar áudio.', 'error');
        } finally {
          setIsSubmitting(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      addToast('Permissão de microfone negada ou indisponível.', 'error');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSelectGif = async (gifUrl) => {
    setIsSubmitting(true);
    try {
      const newComment = await createFeedComment(postId, '[GIF]', null, {
        mediaType: 'gif',
        mediaUrl: gifUrl,
      });
      if (onCommentAdded) {
        onCommentAdded(newComment);
      }
      addToast('GIF compartilhado no comentário! 👾', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao enviar GIF.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    setDeletingCommentId(commentId);
    try {
      await deleteFeedComment(postId, commentId);
      if (onCommentDeleted) {
        onCommentDeleted(commentId);
      }
      addToast('Comentário removido.', 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao remover comentário.', 'error');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const isManager = ['admin', 'superadmin'].includes(currentUser?.role);

  return (
    <div className="feed-comments-section" data-testid={`feed-comments-section-${postId}`}>
      {/* Lista de comentários */}
      {comments && comments.length > 0 && (
        <div className="feed-comments-list" data-testid="feed-comments-list">
          {comments.map((comm) => {
            const canDelete = isManager || comm.user_id === currentUser?.id;
            const initial = comm.user_name ? comm.user_name.charAt(0).toUpperCase() : 'M';
            const isDeleting = deletingCommentId === comm.id;

            return (
              <div key={comm.id} className="feed-comment-item" data-testid={`feed-comment-${comm.id}`}>
                <div className="feed-comment-avatar">
                  {comm.user_avatar ? (
                    <img src={comm.user_avatar} alt={comm.user_name} />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <div className="feed-comment-bubble">
                  <div className="feed-comment-header">
                    <span className="feed-comment-author">{comm.user_name}</span>
                    {comm.user_level_badge && (
                      <span className="feed-comment-elo-badge" title={comm.user_level_title || 'Nível'}>
                        {comm.user_level_badge}
                      </span>
                    )}
                    {comm.user_role === 'superadmin' && (
                      <span className="feed-role-badge superadmin">Super Admin</span>
                    )}
                    {comm.user_role === 'admin' && (
                      <span className="feed-role-badge admin">Admin</span>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="feed-comment-delete-btn"
                        onClick={() => handleDelete(comm.id)}
                        disabled={isDeleting}
                        title="Excluir comentário"
                        data-testid={`feed-delete-comment-btn-${comm.id}`}
                      >
                        {isDeleting ? <Loader2 size={12} className="feed-spinner" /> : <Trash2 size={12} />}
                      </button>
                    )}
                  </div>

                  {/* Renderização de Conteúdo: Áudio, GIF ou Texto */}
                  {comm.media_type === 'audio' && comm.media_url ? (
                    <div className="feed-comment-audio-wrap">
                      <FeedAudioPlayer src={comm.media_url} />
                    </div>
                  ) : comm.media_type === 'gif' && comm.media_url ? (
                    <div className="feed-comment-gif-wrap">
                      <img src={comm.media_url} alt="GIF" className="feed-comment-gif-img" />
                    </div>
                  ) : (
                    <p className="feed-comment-content">{renderTextWithLinks(comm.content)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Formulário para novo comentário com suporte a Áudio e GIF */}
      <form onSubmit={handleSubmit} className="feed-comment-form">
        {isRecording ? (
          <div className="feed-comment-recording-bar">
            <span className="feed-rec-dot" />
            <span className="feed-rec-text">Gravando áudio... Fale com a comunidade</span>
            <button
              type="button"
              className="feed-rec-stop-btn"
              onClick={handleStopRecording}
              data-testid="feed-stop-audio-btn"
            >
              <Square size={13} fill="currentColor" /> Concluir e Enviar
            </button>
          </div>
        ) : (
          <>
            <input
              type="text"
              className="feed-comment-input"
              placeholder="Escreva um comentário ou grave um áudio..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={1000}
              disabled={isSubmitting}
              data-testid="feed-new-comment-input"
            />

            <button
              type="button"
              className="feed-comment-extra-btn"
              onClick={() => setIsGifModalOpen(true)}
              disabled={isSubmitting}
              title="Inserir GIF"
              data-testid="feed-gif-picker-btn"
            >
              👾
            </button>

            <button
              type="button"
              className="feed-comment-extra-btn"
              onClick={handleStartRecording}
              disabled={isSubmitting}
              title="Gravar áudio"
              data-testid="feed-record-audio-btn"
            >
              <Mic size={15} />
            </button>

            <button
              type="submit"
              className="feed-comment-submit-btn"
              disabled={isSubmitting || !content.trim()}
              title="Enviar comentário"
              data-testid="feed-submit-comment-btn"
            >
              {isSubmitting ? <Loader2 size={14} className="feed-spinner" /> : <Send size={14} />}
            </button>
          </>
        )}
      </form>

      <FeedGifPickerModal
        isOpen={isGifModalOpen}
        onClose={() => setIsGifModalOpen(false)}
        onSelectGif={handleSelectGif}
      />
    </div>
  );
}
