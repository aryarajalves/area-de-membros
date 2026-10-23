import React from 'react';
import ChatInternalLinkBadge from './ChatInternalLinkBadge';

/**
 * Converte URLs internas (internal://...) para rotas web correspondentes.
 */
export function getInternalLinkWebUrl(url) {
  if (!url) return '/';
  if (url.startsWith('internal://lesson/')) {
    const raw = url.replace('internal://lesson/', '');
    const [pathPart] = raw.split('?');
    const parts = pathPart.split('/');
    const courseId = parts[0]?.trim();
    const lessonId = parts[1]?.trim();
    return `/?tab=courses&courseId=${courseId}&lessonId=${lessonId}`;
  }
  if (url.startsWith('internal://course/')) {
    const raw = url.replace('internal://course/', '');
    const [courseId] = raw.split('?');
    return `/?tab=courses&courseId=${courseId?.trim()}`;
  }
  if (url.startsWith('internal://tab/')) {
    const raw = url.replace('internal://tab/', '');
    const [tabId] = raw.split('?');
    return `/?tab=${tabId?.trim()}`;
  }
  return url;
}

/**
 * Trata navegação de links internos (internal://...) e links externos no chat.
 * Dispara eventos de rota no próprio SPA para cursos, aulas e abas,
 * permitindo redirecionamento imediato para a sala de aula ou vitrine/vendas.
 */
export function handleInternalNavigation(url) {
  if (!url) return;

  if (typeof window !== 'undefined') {
    if (url.startsWith('internal://course/')) {
      const raw = url.replace('internal://course/', '');
      const [courseId] = raw.split('?');
      const cleanCourseId = courseId?.trim();
      if (cleanCourseId) {
        window.dispatchEvent(new CustomEvent('app:navigate_tab', { detail: { tab: 'courses' } }));
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open_course_lesson', {
            detail: { courseId: Number(cleanCourseId) }
          }));
        }, 80);
        return;
      }
    }

    if (url.startsWith('internal://lesson/')) {
      const raw = url.replace('internal://lesson/', '');
      const [pathPart] = raw.split('?');
      const parts = pathPart.split('/');
      const cleanCourseId = parts[0]?.trim();
      const cleanLessonId = parts[1]?.trim();
      if (cleanCourseId) {
        window.dispatchEvent(new CustomEvent('app:navigate_tab', { detail: { tab: 'courses' } }));
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open_course_lesson', {
            detail: { courseId: Number(cleanCourseId), lessonId: cleanLessonId ? Number(cleanLessonId) : null }
          }));
        }, 80);
        return;
      }
    }

    if (url.startsWith('internal://tab/')) {
      const raw = url.replace('internal://tab/', '');
      const [tabId] = raw.split('?');
      const cleanTabId = tabId?.trim();
      if (cleanTabId) {
        window.dispatchEvent(new CustomEvent('app:navigate_tab', { detail: { tab: cleanTabId } }));
        return;
      }
    }

    const webUrl = getInternalLinkWebUrl(url);
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

    elements.push(
      <ChatInternalLinkBadge
        key={`link_${matchIndex}`}
        internalUrl={internalUrl}
        label={label}
      />
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
