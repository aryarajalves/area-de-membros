import React, { useState, useEffect } from 'react';
import { PlayCircle, BookOpen, Compass, Link2 } from 'lucide-react';
import { handleInternalNavigation } from './chatMentionUtils';

// Cache em memória para evitar re-fetch de contexto da mesma aula em múltiplas mensagens
const lessonContextCache = new Map();

/**
 * Extrai parâmetros de consulta (course, module) e IDs da URL internal://lesson/courseId/lessonId?...
 */
export function parseLessonUrl(url) {
  if (!url || !url.startsWith('internal://lesson/')) {
    return { isLesson: false, courseId: null, lessonId: null, courseTitle: null, moduleTitle: null };
  }

  const raw = url.replace('internal://lesson/', '');
  const [pathPart, queryPart] = raw.split('?');
  const segments = pathPart.split('/');
  const courseId = segments[0]?.trim() || null;
  const lessonId = segments[1]?.trim() || null;

  let courseTitle = null;
  let moduleTitle = null;

  if (queryPart) {
    try {
      const params = new URLSearchParams(queryPart);
      courseTitle = params.get('course') || params.get('c') || null;
      moduleTitle = params.get('module') || params.get('m') || null;
    } catch {
      // Ignora erro de parsing
    }
  }

  return { isLesson: true, courseId, lessonId, courseTitle, moduleTitle };
}

/**
 * Componente que renderiza um badge ou card interativo para links internos no chat.
 * Para aulas, exibe explicitamente qual é o Curso e qual é o Módulo antes do usuário clicar.
 */
export default function ChatInternalLinkBadge({ internalUrl, label }) {
  const parsed = parseLessonUrl(internalUrl);
  const isLesson = parsed.isLesson;

  const [context, setContext] = useState(() => {
    if (!isLesson) return null;
    if (parsed.courseTitle || parsed.moduleTitle) {
      return { courseTitle: parsed.courseTitle, moduleTitle: parsed.moduleTitle };
    }
    if (parsed.lessonId && lessonContextCache.has(parsed.lessonId)) {
      return lessonContextCache.get(parsed.lessonId);
    }
    return null;
  });

  useEffect(() => {
    if (!isLesson || !parsed.lessonId) return;

    // Se já veio com dados da query string, grava no cache
    if (parsed.courseTitle || parsed.moduleTitle) {
      lessonContextCache.set(parsed.lessonId, {
        courseTitle: parsed.courseTitle,
        moduleTitle: parsed.moduleTitle,
      });
      return;
    }

    // Se já está no cache em memória
    if (lessonContextCache.has(parsed.lessonId)) {
      setContext(lessonContextCache.get(parsed.lessonId));
      return;
    }

    // Busca assíncrona do contexto da aula no backend
    let isMounted = true;
    const fetchContext = async () => {
      try {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
        const res = await fetch(`/api/v1/courses/lessons/${parsed.lessonId}/context`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const info = {
            courseTitle: data.course_title || null,
            moduleTitle: data.module_title || null,
            lessonTitle: data.lesson_title || null,
          };
          lessonContextCache.set(parsed.lessonId, info);
          if (isMounted) {
            setContext(info);
          }
        }
      } catch {
        // Ignora erro em modo offline/desconectado
      }
    };

    fetchContext();

    return () => {
      isMounted = false;
    };
  }, [isLesson, parsed.lessonId, parsed.courseTitle, parsed.moduleTitle]);

  const courseName = context?.courseTitle || parsed.courseTitle;
  const moduleName = context?.moduleTitle || parsed.moduleTitle;

  // Tooltip informativo
  let tooltipText = `Abrir ${label}`;
  if (isLesson) {
    if (courseName && moduleName) {
      tooltipText = `Curso: ${courseName} • Módulo: ${moduleName} • Aula: ${label} (Clique para assistir)`;
    } else if (courseName) {
      tooltipText = `Curso: ${courseName} • Aula: ${label} (Clique para assistir)`;
    } else {
      tooltipText = `Aula: ${label} (Clique para assistir)`;
    }
  } else if (internalUrl.startsWith('internal://course/')) {
    tooltipText = `Abrir Curso: ${label}`;
  } else if (internalUrl.startsWith('internal://tab/')) {
    tooltipText = `Abrir Aba: ${label}`;
  }

  // Renderização específica para menção de Aula
  if (isLesson) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleInternalNavigation(internalUrl);
        }}
        className="chat-internal-link-badge chat-lesson-mention-card"
        data-testid="chat-internal-link"
        data-subtestid="chat-lesson-badge"
        title={tooltipText}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          textAlign: 'left',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.35)',
          borderRadius: '8px',
          padding: '6px 10px',
          margin: '3px 0',
          maxWidth: '100%',
          cursor: 'pointer',
          verticalAlign: 'middle',
          transition: 'all 0.18s ease',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.18)';
          e.currentTarget.style.borderColor = '#22c55e';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.35)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80' }}>
          <PlayCircle size={15} style={{ flexShrink: 0 }} />
          <span style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.8125rem' }}>
            {label}
          </span>
        </div>

        {(courseName || moduleName) && (
          <div
            data-testid="chat-lesson-context-info"
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '6px',
              marginTop: '3px',
              fontSize: '0.715rem',
              color: '#94a3b8',
              lineHeight: 1.2,
            }}
          >
            {courseName && (
              <span
                data-testid="lesson-mention-course"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#38bdf8',
                  fontWeight: 500,
                }}
              >
                <span>📚</span>
                <span>{courseName}</span>
              </span>
            )}
            {courseName && moduleName && (
              <span style={{ opacity: 0.4, color: '#64748b' }}>•</span>
            )}
            {moduleName && (
              <span
                data-testid="lesson-mention-module"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: '#c084fc',
                  fontWeight: 500,
                }}
              >
                <span>📂</span>
                <span>{moduleName}</span>
              </span>
            )}
          </div>
        )}
      </button>
    );
  }

  // Links de Cursos e Abas
  let Icon = Compass;
  let iconColor = '#38bdf8';
  let badgeBg = 'rgba(56, 189, 248, 0.14)';
  let borderColor = 'rgba(56, 189, 248, 0.35)';

  if (internalUrl.startsWith('internal://course/')) {
    Icon = BookOpen;
    iconColor = '#38bdf8';
    badgeBg = 'rgba(56, 189, 248, 0.14)';
    borderColor = 'rgba(56, 189, 248, 0.35)';
  } else if (internalUrl.startsWith('internal://tab/')) {
    Icon = Compass;
    iconColor = '#a855f7';
    badgeBg = 'rgba(168, 85, 247, 0.14)';
    borderColor = 'rgba(168, 85, 247, 0.35)';
  } else {
    Icon = Link2;
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        handleInternalNavigation(internalUrl);
      }}
      className="chat-internal-link-badge"
      data-testid="chat-internal-link"
      title={tooltipText}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        backgroundColor: badgeBg,
        border: `1px solid ${borderColor}`,
        color: iconColor,
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
        e.currentTarget.style.backgroundColor = badgeBg.replace('0.14', '0.25');
        e.currentTarget.style.borderColor = iconColor;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = badgeBg;
        e.currentTarget.style.borderColor = borderColor;
      }}
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );
}
