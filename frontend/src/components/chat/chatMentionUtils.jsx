import React from 'react';
import { PlayCircle, BookOpen, Compass } from 'lucide-react';

/**
 * Converte URLs internas (internal://...) para rotas web correspondentes.
 */
export function getInternalLinkWebUrl(url) {
  if (!url) return '/';
  if (url.startsWith('internal://lesson/')) {
    const parts = url.replace('internal://lesson/', '').split('/');
    const courseId = parts[0]?.trim();
    const lessonId = parts[1]?.trim();
    return `/?tab=courses&courseId=${courseId}&lessonId=${lessonId}`;
  }
  if (url.startsWith('internal://course/')) {
    const courseId = url.replace('internal://course/', '').trim();
    return `/?tab=courses&courseId=${courseId}`;
  }
  if (url.startsWith('internal://tab/')) {
    const tabId = url.replace('internal://tab/', '').trim();
    return `/?tab=${tabId}`;
  }
  return url;
}

/**
 * Abre o link interno exclusivamente em nova aba sem redirecionar a página atual.
 */
export function handleInternalNavigation(url) {
  if (!url) return;
  const webUrl = getInternalLinkWebUrl(url);

  if (typeof window !== 'undefined' && typeof window.open === 'function') {
    try {
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Ignora erro em ambientes restritos
    }
  }
}

/**
 * Renderiza o texto com suporte a menções @Nome e links internos [Texto](internal://...)
 */
export function formatMessageWithMentions(text) {
  if (!text) return null;

  // Regex para capturar links internos no formato [Rótulo](internal://caminho)
  const linkRegex = /\[([^\]]+)\]\((internal:\/\/[^)]+)\)/g;

  const elements = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      const textBefore = text.slice(lastIndex, matchIndex);
      elements.push(renderMentionsOnly(textBefore, `pre_${lastIndex}`));
    }

    const label = match[1];
    const internalUrl = match[2];

    let Icon = Compass;
    if (internalUrl.startsWith('internal://lesson/')) {
      Icon = PlayCircle;
    } else if (internalUrl.startsWith('internal://course/')) {
      Icon = BookOpen;
    }

    elements.push(
      <button
        key={`link_${matchIndex}`}
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleInternalNavigation(internalUrl);
        }}
        className="chat-internal-link-badge"
        data-testid="chat-internal-link"
        title={`Abrir ${label}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: 'rgba(56, 189, 248, 0.14)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          color: '#38bdf8',
          borderRadius: '8px',
          padding: '2px 8px',
          margin: '2px 3px',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          verticalAlign: 'middle',
          transition: 'all 0.15s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.25)';
          e.currentTarget.style.borderColor = '#38bdf8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.14)';
          e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
        }}
      >
        <Icon size={14} />
        <span>{label}</span>
      </button>
    );

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const textRemaining = text.slice(lastIndex);
    elements.push(renderMentionsOnly(textRemaining, `post_${lastIndex}`));
  }

  return elements;
}

function renderMentionsOnly(text, prefix) {
  if (!text) return null;
  const mentionRegex = /(@todos\b|@[A-Za-zÀ-ÿ0-9_]+(?:\s+[A-Za-zÀ-ÿ0-9_]+)?)/gi;
  const parts = text.split(mentionRegex);

  return parts.map((part, index) => {
    if (part && part.startsWith('@')) {
      const isTodos = part.toLowerCase() === '@todos';
      return (
        <span
          key={`${prefix}_mention_${index}`}
          className={`chat-mention-tag ${isTodos ? 'chat-mention-todos' : ''}`}
          data-testid={isTodos ? 'chat-mention-todos' : 'chat-mention-highlight'}
          style={{
            color: isTodos ? '#fbbf24' : '#38bdf8',
            backgroundColor: isTodos ? 'rgba(251, 191, 36, 0.2)' : 'rgba(56, 189, 248, 0.15)',
            border: isTodos ? '1px solid rgba(251, 191, 36, 0.45)' : 'none',
            padding: '1px 6px',
            borderRadius: '4px',
            fontWeight: 700,
            display: 'inline-block',
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function getStoredAuthUser() {
  try {
    const raw = localStorage.getItem('user') || localStorage.getItem('auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function countMentionsInText(text) {
  if (!text) return 0;
  const matches = text.match(/@[A-Za-zÀ-ÿ0-9_]+/g);
  return matches ? matches.length : 0;
}

export function validateMentionsForSend(text, user) {
  if (!text) return { valid: true };
  const isPrivileged = user?.role === 'admin' || user?.role === 'superadmin';
  if (isPrivileged) return { valid: true };

  if (text.toLowerCase().includes('@todos')) {
    return { valid: false, error: 'Apenas administradores podem utilizar a menção @todos.' };
  }
  const count = countMentionsInText(text);
  if (count > 5) {
    return { valid: false, error: 'Usuários comuns podem mencionar no máximo 5 contatos por mensagem.' };
  }
  return { valid: true };
}

/**
 * Normaliza a URL do botão para garantir que links externos sem protocolo
 * abram com https:// em vez de tentar rota relativa interna.
 */
export function resolveButtonUrl(url, actionType = 'url') {
  if (!url) return '#';
  const trimmed = url.trim();
  if (actionType === 'url') {
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:')
    ) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }
  return trimmed;
}
