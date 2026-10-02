import React from 'react';
import { Heart, MessageSquare, Trash2, BookOpen, Clock, CheckCircle2, Star, Image, HelpCircle } from 'lucide-react';

export function formatTimeAgo(dateString) {
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
  if (days < 7) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `há ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  return date.toLocaleDateString('pt-BR');
}

export function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SupportTopicCard({
  topic,
  currentUser,
  onClick,
  onLike,
  onToggleLike,
  onDelete,
  onDeleteTopic,
  onCommentClick,
}) {
  const isAuthor = currentUser?.id === topic.author.id;
  const isManager = ['superadmin', 'admin'].includes(currentUser?.role);
  const canDelete = isAuthor || isManager;

  const handleLikeClick = (e) => {
    e.stopPropagation();
    const fn = onLike || onToggleLike;
    if (fn) fn(topic.id);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    const fn = onDelete || onDeleteTopic;
    if (fn) fn(topic);
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    const fn = onCommentClick || onClick;
    if (fn) fn(topic);
  };

  const initials = getInitials(topic.author.name);

  return (
    <div
      className="support-topic-card"
      onClick={() => onClick && onClick(topic)}
      data-testid={`support-topic-card-${topic.id}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: 'rgba(30, 41, 59, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '10px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.6)';
        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(30, 41, 59, 0.45)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
      }}
    >
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
        {/* Avatar Circular com iniciais */}
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: '#0284c7',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '14px',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {initials}
        </div>

        {/* Informações da Dúvida */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <BookOpen size={11} />
              {topic.course.title}
            </span>

            {/* Badge de Status: Resolvida vs Aguardando */}
            {topic.status === 'resolved' ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                data-testid={`topic-status-badge-${topic.id}`}
              >
                <CheckCircle2 size={11} />
                Resolvida
              </span>
            ) : topic.replies_count === 0 ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(245, 158, 11, 0.12)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                data-testid={`topic-status-badge-${topic.id}`}
              >
                <HelpCircle size={11} />
                Aguardando Resposta
              </span>
            ) : null}

            {/* Badge de Solução Oficial Aceita */}
            {topic.has_solution && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  color: '#facc15',
                  border: '1px solid rgba(234, 179, 8, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Esta dúvida possui uma Solução Oficial confirmada"
              >
                <Star size={10} fill="#facc15" />
                Solução Oficial
              </span>
            )}

            {/* Indicador de Anexo de Imagem */}
            {topic.image_url && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(148, 163, 184, 0.12)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(148, 163, 184, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Possui imagem/print anexo"
              >
                <Image size={11} />
                Anexo
              </span>
            )}

            {['admin', 'superadmin'].includes(topic.author.role) && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(234, 179, 8, 0.15)',
                  color: '#eab308',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                }}
              >
                Instrutor
              </span>
            )}
          </div>

          <h3
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: '#f8fafc',
              margin: '0 0 6px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {topic.title}
          </h3>

          <p
            style={{
              fontSize: '13px',
              color: '#94a3b8',
              margin: '0 0 8px 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: '1.4',
            }}
          >
            {topic.content}
          </p>

          {/* Subtítulo: Autor da última resposta ou tempo decorrido */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b' }}>
            {topic.last_reply ? (
              <span>
                ↳ {topic.last_reply.author_name} respondeu {formatTimeAgo(topic.last_reply.created_at)}
              </span>
            ) : (
              <span>
                Postado por {topic.author.name} {formatTimeAgo(topic.created_at)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Ações e Contadores laterais */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, marginLeft: '12px' }}>
        {/* Botão de Curtir */}
        <button
          type="button"
          onClick={handleLikeClick}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: topic.liked_by_me ? '#ef4444' : '#94a3b8',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            padding: '5px 8px',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ef4444';
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = topic.liked_by_me ? '#ef4444' : '#94a3b8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          data-testid={`like-topic-btn-${topic.id}`}
          title={topic.liked_by_me ? 'Descurtir dúvida' : 'Curtir dúvida'}
        >
          <Heart size={16} fill={topic.liked_by_me ? '#ef4444' : 'none'} color={topic.liked_by_me ? '#ef4444' : '#94a3b8'} />
          <span>{topic.likes_count || 0}</span>
        </button>

        {/* Botão de Respostas / Comentários */}
        <button
          type="button"
          onClick={handleCommentClick}
          style={{
            background: 'transparent',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            padding: '5px 8px',
            borderRadius: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#38bdf8';
            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          data-testid={`comment-topic-btn-${topic.id}`}
          title={`${topic.replies_count || 0} respostas (Clique para ver ou responder)`}
        >
          <MessageSquare size={16} />
          <span>{topic.replies_count || 0}</span>
        </button>

        {/* Botão de Excluir (se tiver permissão) */}
        {canDelete && (
          <button
            type="button"
            onClick={handleDeleteClick}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '5px 7px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ef4444';
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            data-testid={`delete-topic-btn-${topic.id}`}
            title="Excluir dúvida"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
