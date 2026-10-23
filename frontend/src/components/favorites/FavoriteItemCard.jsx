import React from 'react';
import { GraduationCap, X, ChevronRight, Bookmark } from 'lucide-react';

export function formatTimeAgo(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'agora há pouco';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `há ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `há ${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
    return date.toLocaleDateString('pt-BR');
  } catch {
    return '';
  }
}

export default function FavoriteItemCard({
  item,
  activeTab,
  onClick,
  onRemove,
}) {
  const getTabColor = () => {
    switch (activeTab) {
      case 'duvidas':
        return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8' };
      case 'aulas':
        return { bg: 'rgba(99, 102, 241, 0.15)', text: '#818cf8' };
      case 'comentarios':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' };
      case 'mensagens':
      default:
        return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399' };
    }
  };

  const colors = getTabColor();

  return (
    <div
      onClick={onClick}
      data-testid={`fav-item-${activeTab}-${item.id}`}
      style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-start',
        padding: '10px 12px',
        borderRadius: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
      }}
    >
      {/* Ícone ou Avatar */}
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: activeTab === 'aulas' ? '8px' : '50%',
          backgroundColor: colors.bg,
          color: colors.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.75rem',
          fontWeight: 700,
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {item.author?.avatar_url || item.thumbnail_url ? (
          <img
            src={item.author?.avatar_url || item.thumbnail_url}
            alt="Miniatura"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : activeTab === 'aulas' ? (
          <GraduationCap size={16} />
        ) : (
          (item.author?.name || 'U').charAt(0).toUpperCase()
        )}
      </div>

      {/* Informações Centrais */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {activeTab === 'comentarios' ? (
          <>
            {/* Breadcrumb de Localização do Comentário */}
            <div
              data-testid="fav-comment-location"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.6875rem',
                color: '#38bdf8',
                marginBottom: '4px',
                flexWrap: 'wrap',
                lineHeight: 1.25,
              }}
            >
              <span style={{ fontWeight: 600, color: '#38bdf8' }}>
                {item.course_title || 'Curso'}
              </span>
              <span style={{ color: '#64748b', fontSize: '0.625rem' }}>›</span>
              <span style={{ color: '#94a3b8' }}>
                {item.module_title || 'Módulo'}
              </span>
              <span style={{ color: '#64748b', fontSize: '0.625rem' }}>›</span>
              <span style={{ color: '#f1f5f9', fontWeight: 600 }}>
                {item.lesson_title || 'Aula'}
              </span>
            </div>

            {/* Conteúdo do Comentário */}
            <div
              style={{
                fontSize: '0.8125rem',
                color: '#e2e8f0',
                lineHeight: 1.35,
                margin: '0 0 4px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
              title={item.content}
            >
              "{item.content}"
            </div>
          </>
        ) : activeTab === 'mensagens' ? (
          <>
            {/* Tag de Origem da Mensagem: Chat em Grupo ou DM */}
            <div
              data-testid="fav-message-location"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.6875rem',
                color: item.channel_type === 'dm' ? '#34d399' : '#38bdf8',
                marginBottom: '4px',
                flexWrap: 'wrap',
                lineHeight: 1.25,
                fontWeight: 600,
              }}
            >
              {item.channel_type === 'dm' ? (
                <>
                  <span>💬 DM com</span>
                  <span style={{ color: '#f1f5f9' }}>
                    {item.other_user?.name || item.recipient?.name || 'Contato'}
                  </span>
                </>
              ) : (
                <>
                  <span>👥 Grupo:</span>
                  <span style={{ color: '#f1f5f9' }}>
                    {item.channel_type === 'course'
                      ? item.course_title || 'Chat do Curso'
                      : 'Comunidade Geral'}
                  </span>
                </>
              )}
            </div>

            {/* Conteúdo da Mensagem */}
            <div
              style={{
                fontSize: '0.8125rem',
                color: '#e2e8f0',
                lineHeight: 1.35,
                margin: '0 0 4px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
              title={item.message}
            >
              "{item.message}"
            </div>
          </>
        ) : (
          <>
            <h4
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#f8fafc',
                margin: '0 0 2px 0',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={item.title || item.message}
            >
              {item.title || item.message}
            </h4>

            <p
              style={{
                fontSize: '0.6875rem',
                color: '#94a3b8',
                margin: '0 0 4px 0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                lineHeight: 1.35,
              }}
            >
              {activeTab === 'aulas' ? (
                <>
                  {item.course_title ? <strong style={{ color: '#cbd5e1' }}>{item.course_title}</strong> : ''}
                  {item.module_title ? ` • Módulo: ${item.module_title}` : ''}
                  {item.description ? ` • ${item.description}` : ''}
                </>
              ) : (
                <>
                  {item.course_title ? `${item.course_title} • ` : ''}
                  {item.content || item.description || item.message || ''}
                </>
              )}
            </p>
          </>
        )}

        {/* Rodapé com autor e data */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.625rem', color: '#64748b' }}>
          {item.author?.name && (
            <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
              {item.author.name}
            </span>
          )}
          {item.duration && (
            <span>• {item.duration}</span>
          )}
          {item.created_at && (
            <span>• {formatTimeAgo(item.created_at)}</span>
          )}
        </div>
      </div>

      {/* Ação de Desfavoritar */}
      <button
        type="button"
        onClick={onRemove}
        data-testid={`remove-fav-btn-${item.id}`}
        title="Remover dos favoritos"
        style={{
          background: 'none',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
      >
        <X size={14} />
      </button>
    </div>
  );
}
