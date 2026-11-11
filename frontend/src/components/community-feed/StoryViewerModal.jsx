import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Trash2, Eye, Send, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import {
  fetchUserStories,
  recordStoryView,
  reactToStory,
  replyToStory,
  deleteStory,
  fetchStoryViews,
} from './communityStoriesApi';
import './community-feed-story-viewer.css';

const REACTIONS = [
  { type: 'fire', emoji: '🔥' },
  { type: 'heart', emoji: '❤️' },
  { type: 'clap', emoji: '👏' },
  { type: 'laugh', emoji: '😂' },
  { type: 'rocket', emoji: '🚀' },
];

export default function StoryViewerModal({
  isOpen,
  targetUserId,
  onClose,
  onStoryDeleted,
  currentUser,
}) {
  const { addToast } = useToast();

  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [isViewersOpen, setIsViewersOpen] = useState(false);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);

  const timerRef = useRef(null);

  // Carrega stories do usuário selecionado
  useEffect(() => {
    if (!isOpen || !targetUserId) return;
    setIsLoading(true);
    setCurrentIndex(0);
    setProgressPercent(0);

    fetchUserStories(targetUserId)
      .then((data) => {
        setStories(data || []);
      })
      .catch((err) => {
        addToast(err.message || 'Erro ao carregar stories.', 'error');
        onClose();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, targetUserId]);

  const currentStory = stories[currentIndex];

  // Registra visualização ao mudar de story
  useEffect(() => {
    if (!currentStory || !isOpen) return;
    try {
      const res = recordStoryView(currentStory.id);
      if (res && typeof res.catch === 'function') {
        res.catch(() => {});
      }
    } catch {
      // Ignora erro silencioso
    }
  }, [currentStory, isOpen]);

  // Timer do Story
  useEffect(() => {
    if (!currentStory || isPaused || isViewersOpen || isLoading) return;

    const durationMs = (currentStory.duration_seconds || 5) * 1000;
    const intervalMs = 50;
    const step = (intervalMs / durationMs) * 100;

    timerRef.current = setInterval(() => {
      setProgressPercent((prev) => {
        if (prev >= 100) {
          handleNextStory();
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStory, isPaused, isViewersOpen, isLoading, currentIndex, stories.length]);

  if (!isOpen) return null;

  const handleNextStory = () => {
    setProgressPercent(0);
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrevStory = () => {
    setProgressPercent(0);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleReact = async (reactionType) => {
    if (!currentStory) return;
    try {
      await reactToStory(currentStory.id, reactionType);
      setStories((prev) =>
        prev.map((s, idx) => (idx === currentIndex ? { ...s, my_reaction: reactionType } : s))
      );
      addToast(`Reagiu com ${reactionType}!`, 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao reagir.', 'error');
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!currentStory || !replyText.trim() || isSendingReply) return;
    setIsSendingReply(true);
    try {
      await replyToStory(currentStory.id, replyText.trim());
      addToast('Resposta enviada no Chat (DM)!', 'success');
      setReplyText('');
    } catch (err) {
      addToast(err.message || 'Erro ao enviar resposta.', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!currentStory) return;
    if (!window.confirm('Tem certeza que deseja apagar este story?')) return;
    try {
      await deleteStory(currentStory.id);
      addToast('Story apagado com sucesso.', 'info');
      const updated = stories.filter((s) => s.id !== currentStory.id);
      if (onStoryDeleted) onStoryDeleted(currentStory.id);
      if (updated.length === 0) {
        onClose();
      } else {
        setStories(updated);
        setCurrentIndex(Math.min(currentIndex, updated.length - 1));
        setProgressPercent(0);
      }
    } catch (err) {
      addToast(err.message || 'Erro ao apagar story.', 'error');
    }
  };

  const handleOpenViewers = async () => {
    if (!currentStory) return;
    setIsPaused(true);
    setIsViewersOpen(true);
    setIsLoadingViewers(true);
    try {
      const data = await fetchStoryViews(currentStory.id);
      setViewers(data || []);
    } catch {
      setViewers([]);
    } finally {
      setIsLoadingViewers(false);
    }
  };

  const isOwnerOrAdmin =
    currentStory &&
    (currentStory.is_owner ||
      currentUser?.role === 'admin' ||
      currentUser?.role === 'superadmin');

  return (
    <div
      className="story-viewer-backdrop"
      data-testid="story-viewer-modal"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="story-viewer-stage"
        data-testid="story-viewer-stage"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
            <Loader2 size={32} className="feed-spinner" />
          </div>
        ) : !currentStory ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff', gap: '14px' }}>
            <p>Nenhum story ativo encontrado.</p>
            <button type="button" onClick={onClose} style={{ padding: '6px 14px', borderRadius: '8px', background: '#0284c7', border: 'none', color: '#fff' }}>
              Fechar
            </button>
          </div>
        ) : (
          <>
            {/* Barras de progresso no topo */}
            <div className="story-progress-bars" data-testid="story-progress-bars">
              {stories.map((st, idx) => (
                <div key={st.id} className="story-progress-segment">
                  <div
                    className="story-progress-fill"
                    style={{
                      width:
                        idx < currentIndex
                          ? '100%'
                          : idx === currentIndex
                          ? `${progressPercent}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            {/* Cabeçalho do story */}
            <div className="story-header-overlay">
              <div className="story-header-author">
                <div className="story-header-avatar">
                  {currentStory.user_avatar_url ? (
                    <img src={currentStory.user_avatar_url} alt={currentStory.user_name} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      {currentStory.user_name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="story-header-author-info">
                  <span className="story-header-name">{currentStory.user_name}</span>
                  <span className="story-header-time">
                    {new Date(currentStory.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              <div className="story-header-actions">
                <button
                  type="button"
                  className="story-icon-btn"
                  onClick={() => setIsPaused((prev) => !prev)}
                  title={isPaused ? 'Continuar' : 'Pausar'}
                  data-testid="story-pause-btn"
                >
                  {isPaused ? <Play size={16} /> : <Pause size={16} />}
                </button>

                {isOwnerOrAdmin && (
                  <button
                    type="button"
                    className="story-icon-btn"
                    onClick={handleDelete}
                    title="Excluir Story"
                    data-testid="story-delete-btn"
                  >
                    <Trash2 size={16} color="#f87171" />
                  </button>
                )}

                <button
                  type="button"
                  className="story-icon-btn"
                  onClick={onClose}
                  title="Fechar"
                  data-testid="story-close-btn"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Áreas de toque invisíveis */}
            <div className="story-tap-area left" onClick={handlePrevStory} data-testid="story-tap-prev" />
            <div className="story-tap-area right" onClick={handleNextStory} data-testid="story-tap-next" />

            {/* Mídia principal */}
            <div className="story-media-container" data-testid="story-media-container">
              {currentStory.media_type === 'video' ? (
                <video
                  src={currentStory.media_url}
                  autoPlay
                  playsInline
                  controls={false}
                  className="story-media-video"
                />
              ) : (
                <img
                  src={currentStory.media_url}
                  alt={currentStory.caption || 'Story'}
                  className="story-media-image"
                />
              )}
            </div>

            {/* Legenda se houver */}
            {currentStory.caption && (
              <div className="story-caption-overlay" data-testid="story-caption">
                {currentStory.caption}
              </div>
            )}

            {/* Rodapé: Reações & DM se não for meu story */}
            <div className="story-footer-overlay">
              {!currentStory.is_owner ? (
                <>
                  <div className="story-reactions-bar" data-testid="story-reactions-bar">
                    {REACTIONS.map((r) => (
                      <button
                        key={r.type}
                        type="button"
                        className={`story-react-btn ${currentStory.my_reaction === r.type ? 'active' : ''}`}
                        onClick={() => handleReact(r.type)}
                        data-testid={`story-react-${r.type}`}
                        title={`Reagir com ${r.type}`}
                      >
                        {r.emoji}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendReply} className="story-reply-row">
                    <input
                      type="text"
                      className="story-reply-input"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onFocus={() => setIsPaused(true)}
                      onBlur={() => setIsPaused(false)}
                      placeholder={`Responder a ${currentStory.user_name}...`}
                      data-testid="story-reply-input"
                    />
                    <button
                      type="submit"
                      className="story-reply-send-btn"
                      disabled={!replyText.trim() || isSendingReply}
                      data-testid="story-reply-send-btn"
                      title="Enviar no Chat"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </>
              ) : (
                /* Para o autor do story: botão de ver quem visualizou */
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={handleOpenViewers}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '999px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    data-testid="story-viewers-btn"
                  >
                    <Eye size={15} color="#38bdf8" />
                    <span>{currentStory.views_count || 0} visualizações</span>
                  </button>
                </div>
              )}
            </div>

            {/* Painel de Visualizadores */}
            {isViewersOpen && (
              <div className="story-viewers-panel" data-testid="story-viewers-panel">
                <div className="story-viewers-header">
                  <span className="story-viewers-title">Visualizadores ({viewers.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsViewersOpen(false);
                      setIsPaused(false);
                    }}
                    style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                {isLoadingViewers ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                    <Loader2 size={20} className="feed-spinner" />
                  </div>
                ) : viewers.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                    Nenhuma visualização registrada ainda.
                  </div>
                ) : (
                  <div className="story-viewers-list">
                    {viewers.map((v) => (
                      <div key={v.id} className="story-viewer-item">
                        <div className="story-viewer-avatar">
                          {v.avatar_url ? (
                            <img src={v.avatar_url} alt={v.name} />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8', fontWeight: 700 }}>
                              {v.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span className="story-viewer-name">{v.name}</span>
                          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                            {new Date(v.viewed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
