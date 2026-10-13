import React from 'react';
import { ThumbsUp, MessageSquare, Plus, Sparkles, User, CornerDownRight } from 'lucide-react';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'agora há pouco';
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  return date.toLocaleDateString('pt-BR');
}

export default function IntroductionPostList({
  posts,
  loading,
  onSelectPost,
  onOpenCreateModal,
  onToggleLike,
}) {
  return (
    <div className="introductions-posts-section" data-testid="introductions-posts-section">
      {/* Barra de Topo da Lista */}
      <div className="introductions-section-header">
        <div className="section-header-left">
          <h2 className="section-title">Apresente-se</h2>
          <span className="section-subtitle-badge">
            {posts.length} {posts.length === 1 ? 'apresentação' : 'apresentações'}
          </span>
        </div>

        <div className="section-header-right">
          <button
            type="button"
            className="intro-new-post-btn"
            onClick={onOpenCreateModal}
            data-testid="intro-new-post-btn"
          >
            <Plus size={16} />
            <span>Novo post</span>
          </button>
        </div>
      </div>

      {/* Lista de Apresentações em Sequência */}
      {loading ? (
        <div className="intro-loading-state" data-testid="intro-loading-state">
          <div className="spinner" />
          <p>Carregando apresentações da comunidade...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="intro-empty-state" data-testid="intro-empty-state">
          <div className="empty-icon-box">
            <Sparkles size={28} />
          </div>
          <h3>Ninguém se apresentou ainda</h3>
          <p>Seja o primeiro a compartilhar quem você é, seus objetivos e conectar-se com outros membros!</p>
          <button
            type="button"
            className="introductions-cta-btn"
            onClick={onOpenCreateModal}
          >
            <Plus size={16} />
            <span>Criar primeira apresentação</span>
          </button>
        </div>
      ) : (
        <div className="introductions-list-container">
          {posts.map((post) => {
            const initial = (post.user_name || 'M').charAt(0).toUpperCase();
            return (
              <div
                key={post.id}
                className="intro-post-row"
                onClick={() => onSelectPost(post)}
                data-testid={`intro-post-row-${post.id}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectPost(post);
                }}
              >
                {/* Avatar do Autor */}
                <div className="intro-post-avatar-col">
                  {post.user_avatar ? (
                    <img
                      src={post.user_avatar}
                      alt={post.user_name}
                      className="intro-user-avatar-img"
                    />
                  ) : (
                    <div className="intro-user-avatar-placeholder">
                      {initial}
                    </div>
                  )}
                </div>

                {/* Conteúdo Central: Título e Resposta/Data */}
                <div className="intro-post-content-col">
                  <h3 className="intro-post-row-title">{post.title}</h3>
                  <div className="intro-post-row-meta">
                    {post.last_comment_user_name ? (
                      <span className="meta-reply">
                        <CornerDownRight size={13} className="meta-reply-icon" />
                        {post.last_comment_user_name} respondeu {formatRelativeTime(post.last_comment_at)}
                      </span>
                    ) : (
                      <span className="meta-author">
                        Por {post.user_name} • {formatRelativeTime(post.created_at)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Coluna da Direita: Contadores de Like e Comentário */}
                <div className="intro-post-stats-col">
                  <button
                    type="button"
                    className={`intro-stat-item intro-stat-like-btn ${post.is_liked_by_me ? 'stat-liked' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onToggleLike) onToggleLike(post.id);
                    }}
                    data-testid={`like-post-btn-${post.id}`}
                    title={post.is_liked_by_me ? 'Descurtir apresentação' : 'Curtir apresentação'}
                    aria-label={post.is_liked_by_me ? 'Descurtir apresentação' : 'Curtir apresentação'}
                  >
                    <ThumbsUp
                      size={16}
                      fill={post.is_liked_by_me ? '#f59e0b' : 'none'}
                      color={post.is_liked_by_me ? '#f59e0b' : 'currentColor'}
                    />
                    <span>{post.likes_count}</span>
                  </button>
                  <div className="intro-stat-item" title={`${post.comments_count} comentários`}>
                    <MessageSquare size={16} />
                    <span>{post.comments_count}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
