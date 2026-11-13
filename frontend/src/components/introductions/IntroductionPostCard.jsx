import React from 'react';
import { MessageSquare, Pin, Image as ImageIcon, Video, CornerDownRight, Sparkles } from 'lucide-react';
import IntroductionSocialLinks from './IntroductionSocialLinks';
import IntroductionReactionsBar, { ReactionPillSummary } from './IntroductionReactionsBar';
import ZodiacBadge from '../common/ZodiacBadge';
import { OnlineStatusDot } from '../common/OnlineStatusBadge';
import useIsAstrologyPlatform from '../../hooks/useIsAstrologyPlatform';

export function formatRelativeTime(dateString) {
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

export default function IntroductionPostCard({
  post,
  currentUser,
  onSelectPost,
  onToggleLike,
  onOpenDm,
}) {
  const isAstrology = useIsAstrologyPlatform();
  const initial = (post.user_name || 'M').charAt(0).toUpperCase();
  const hasMedia = post.media_type && post.media_type !== 'none' && (post.media_url || post.video_embed_url);
  const isVideo = ['video', 'youtube', 'loom', 'vimeo'].includes(post.media_type);

  return (
    <div
      className={`intro-post-row ${post.is_pinned ? 'is-pinned-post' : ''}`}
      onClick={() => onSelectPost(post)}
      data-testid={`intro-post-row-${post.id}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelectPost(post);
      }}
    >
      {/* Selo Fixado / Exemplo se houver */}
      {post.is_example ? (
        <div
          className="intro-pinned-badge"
          data-testid={`intro-example-badge-${post.id}`}
          style={{ backgroundColor: 'rgba(168, 85, 247, 0.16)', color: '#d8b4fe', borderColor: 'rgba(168, 85, 247, 0.35)' }}
        >
          <Sparkles size={12} />
          <span>Apresentação de Exemplo</span>
        </div>
      ) : post.is_pinned ? (
        <div className="intro-pinned-badge" data-testid={`intro-pinned-badge-${post.id}`}>
          <Pin size={12} />
          <span>Fixado pela Comunidade</span>
        </div>
      ) : null}

      {/* Avatar do Autor */}
      <div className="intro-post-avatar-col" style={{ position: 'relative' }}>
        {post.user_avatar ? (
          <img
            src={post.user_avatar}
            alt={post.user_name}
            className="intro-user-avatar-img"
          />
        ) : (
          <div className="intro-user-avatar-placeholder">
            <span>{initial}</span>
          </div>
        )}
        <OnlineStatusDot isOnline={post.user_is_online} size={11} />
      </div>

      {/* Corpo Central */}
      <div className="intro-post-body-col">
        <div className="intro-post-meta-line">
          <span className="intro-author-name">{post.user_name}</span>
          {post.user_role === 'superadmin' && (
            <span className="user-role-badge badge-superadmin">Super Admin</span>
          )}
          {post.user_role === 'admin' && (
            <span className="user-role-badge badge-admin">Admin</span>
          )}
          {post.niche && (
            <span className="intro-card-niche-pill">{post.niche}</span>
          )}
          {post.location && (
            <span className="intro-card-location-text">📍 {post.location}</span>
          )}
          {isAstrology && post.user_birth_date && (
            <ZodiacBadge birthDate={post.user_birth_date} size="sm" />
          )}
          <span className="intro-bullet-separator">•</span>
          <span className="intro-post-time">{formatRelativeTime(post.created_at)}</span>
        </div>

        <h3 className="intro-post-title">{post.title}</h3>

        <p className="intro-post-excerpt">
          {post.content}
        </p>

        {/* Indicador Visual de Mídia Anexada */}
        {hasMedia && (
          <div className="intro-card-media-indicator" data-testid={`intro-media-badge-${post.id}`}>
            {isVideo ? (
              <>
                <Video size={13} />
                <span>Vídeo de apresentação</span>
              </>
            ) : (
              <>
                <ImageIcon size={13} />
                <span>Foto anexada</span>
              </>
            )}
          </div>
        )}

        {/* Redes Sociais (sempre visíveis; botão DM oculto em apresentações de exemplo) */}
        <div onClick={(e) => e.stopPropagation()}>
          <IntroductionSocialLinks
            instagram={post.instagram}
            linkedin={post.linkedin}
            whatsapp={post.whatsapp}
            website={post.website}
            authorName={post.user_name}
            authorId={post.user_id}
            currentUserId={currentUser?.id}
            onOpenDm={
              post.is_example
                ? null
                : (id, name) =>
                    onOpenDm &&
                    onOpenDm(id, name, {
                      email: post.user_email,
                      role: post.user_role,
                      avatar: post.user_avatar,
                    })
            }
          />
        </div>

        {/* Linha de Último Comentário se houver */}
        {!post.is_example && post.last_comment_user_name && (
          <div className="intro-last-comment-hint">
            <CornerDownRight size={13} className="hint-icon" />
            <span>
              Última resposta por <strong>{post.last_comment_user_name}</strong> {formatRelativeTime(post.last_comment_at)}
            </span>
          </div>
        )}
      </div>

      {/* Coluna Direita com Estatísticas / Interação (oculta em apresentações de exemplo) */}
      {!post.is_example ? (
        <div className="intro-post-stats-col" onClick={(e) => e.stopPropagation()}>
          <IntroductionReactionsBar
            isLiked={post.is_liked_by_me}
            myReaction={post.my_reaction}
            onToggleReaction={(rtype) => onToggleLike(post.id, rtype)}
            buttonClassName="intro-stat-like-btn"
            dataTestId={`like-post-btn-${post.id}`}
          />

          {post.likes_count > 0 && (
            <ReactionPillSummary
              likesCount={post.likes_count}
              reactionsSummary={post.reactions_summary}
            />
          )}

          <div className="intro-comments-counter" title="Total de comentários">
            <MessageSquare size={15} />
            <span>{post.comments_count || 0}</span>
          </div>
        </div>
      ) : (
        <div className="intro-post-stats-col" style={{ justifyContent: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#c084fc',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              padding: '4px 10px',
              borderRadius: '999px',
              whiteSpace: 'nowrap'
            }}
          >
            Modelo para seguir
          </span>
        </div>
      )}
    </div>
  );
}
