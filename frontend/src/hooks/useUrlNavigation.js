import { useEffect, useRef } from 'react';

const ALUNO_ALLOWED_TABS = [
  'home',
  'courses',
  'support',
  'chat',
  'testimonials',
  'introductions',
  'ranking',
  'settings',
];

/**
 * Hook para processar parâmetros de URL (ex: ?tab=courses&courseId=1&lessonId=42)
 * ao abrir a plataforma em uma nova aba a partir de links compartilhados no chat.
 * Executa apenas uma vez e limpa a query string da URL para permitir a navegação livre posterior.
 */
export function useUrlNavigation({ user, onSelectTab }) {
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasProcessedRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const targetTab = params.get('tab');
    const targetCourseId = params.get('courseId');
    const targetLessonId = params.get('lessonId');

    if (!targetTab && !targetCourseId) return;

    hasProcessedRef.current = true;

    if (targetTab) {
      if (user?.role === 'aluno' && !ALUNO_ALLOWED_TABS.includes(targetTab)) {
        onSelectTab('courses');
      } else {
        onSelectTab(targetTab);
      }
    }

    if (targetCourseId) {
      const dispatchOpen = () => {
        window.dispatchEvent(
          new CustomEvent('open_course_lesson', {
            detail: {
              courseId: Number(targetCourseId),
              lessonId: targetLessonId ? Number(targetLessonId) : null,
            },
          })
        );
      };
      setTimeout(dispatchOpen, 250);
      setTimeout(dispatchOpen, 600);
    }

    // Limpa a query string da barra de endereços para liberar a navegação livre posterior pela Sidebar
    try {
      const cleanPath = window.location.pathname || '/';
      if (window.history && typeof window.history.replaceState === 'function') {
        window.history.replaceState({}, document.title, cleanPath);
      }
    } catch {
      // Ignora erro em ambientes restritos de teste
    }
  }, [user?.role, onSelectTab]);
}
