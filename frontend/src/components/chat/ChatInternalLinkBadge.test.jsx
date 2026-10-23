import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ChatInternalLinkBadge, { parseLessonUrl } from './ChatInternalLinkBadge';

describe('ChatInternalLinkBadge Component', () => {
  let dispatchEventSpy;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    dispatchEventSpy.mockRestore();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('parseLessonUrl helper', () => {
    it('returns isLesson false for non-lesson URLs', () => {
      expect(parseLessonUrl('internal://course/12')).toEqual({
        isLesson: false,
        courseId: null,
        lessonId: null,
        courseTitle: null,
        moduleTitle: null,
      });
      expect(parseLessonUrl('https://google.com')).toEqual({
        isLesson: false,
        courseId: null,
        lessonId: null,
        courseTitle: null,
        moduleTitle: null,
      });
    });

    it('extracts courseId, lessonId, courseTitle and moduleTitle correctly', () => {
      const parsed = parseLessonUrl(
        'internal://lesson/2/10?course=Astrologia%20B%C3%A1sica&module=Casas%20Zodiacais'
      );
      expect(parsed.isLesson).toBe(true);
      expect(parsed.courseId).toBe('2');
      expect(parsed.lessonId).toBe('10');
      expect(parsed.courseTitle).toBe('Astrologia Básica');
      expect(parsed.moduleTitle).toBe('Casas Zodiacais');
    });

    it('handles legacy lesson URL without query parameters', () => {
      const parsed = parseLessonUrl('internal://lesson/5/42');
      expect(parsed.isLesson).toBe(true);
      expect(parsed.courseId).toBe('5');
      expect(parsed.lessonId).toBe('42');
      expect(parsed.courseTitle).toBeNull();
      expect(parsed.moduleTitle).toBeNull();
    });
  });

  describe('Rendering lesson badges with context', () => {
    it('displays course and module prominently when provided in URL parameters', () => {
      render(
        <ChatInternalLinkBadge
          internalUrl="internal://lesson/2/10?course=Astrologia%20B%C3%A1sica&module=Casas%20Zodiacais"
          label="🎥 Aula 1: O Sol na Casa 2"
        />
      );

      expect(screen.getByTestId('chat-internal-link')).toBeInTheDocument();
      expect(screen.getByText('🎥 Aula 1: O Sol na Casa 2')).toBeInTheDocument();
      expect(screen.getByTestId('lesson-mention-course')).toHaveTextContent('Astrologia Básica');
      expect(screen.getByTestId('lesson-mention-module')).toHaveTextContent('Casas Zodiacais');

      const badge = screen.getByTestId('chat-internal-link');
      expect(badge).toHaveAttribute(
        'title',
        'Curso: Astrologia Básica • Módulo: Casas Zodiacais • Aula: 🎥 Aula 1: O Sol na Casa 2 (Clique para assistir)'
      );
    });

    it('fetches context from backend endpoint when parameters are missing in legacy URL', async () => {
      vi.useRealTimers();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          lesson_id: 99,
          lesson_title: 'Fundamentos de Hooks',
          module_id: 12,
          module_title: 'Módulo Avançado',
          course_id: 4,
          course_title: 'Formação React',
        }),
      });
      global.fetch = mockFetch;

      render(
        <ChatInternalLinkBadge
          internalUrl="internal://lesson/4/99"
          label="🎥 Fundamentos de Hooks"
        />
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/courses/lessons/99/context',
          expect.any(Object)
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId('lesson-mention-course')).toHaveTextContent('Formação React');
        expect(screen.getByTestId('lesson-mention-module')).toHaveTextContent('Módulo Avançado');
      });
    });

    it('dispatches navigation events when clicked', () => {
      render(
        <ChatInternalLinkBadge
          internalUrl="internal://lesson/2/10?course=Astrologia&module=Casas"
          label="🎥 Aula 1: O Sol"
        />
      );

      const btn = screen.getByTestId('chat-internal-link');
      fireEvent.click(btn);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'app:navigate_tab',
          detail: { tab: 'courses' },
        })
      );

      vi.advanceTimersByTime(100);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'open_course_lesson',
          detail: { courseId: 2, lessonId: 10 },
        })
      );
    });
  });

  describe('Rendering course and tab badges', () => {
    it('renders course badge with book icon and correct title', () => {
      render(
        <ChatInternalLinkBadge
          internalUrl="internal://course/77"
          label="📚 Curso de Node.js"
        />
      );

      const btn = screen.getByTestId('chat-internal-link');
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent('📚 Curso de Node.js');
      expect(btn).toHaveAttribute('title', 'Abrir Curso: 📚 Curso de Node.js');
    });

    it('renders tab badge with compass icon and correct title', () => {
      render(
        <ChatInternalLinkBadge
          internalUrl="internal://tab/community"
          label="💬 Comunidade"
        />
      );

      const btn = screen.getByTestId('chat-internal-link');
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveTextContent('💬 Comunidade');
      expect(btn).toHaveAttribute('title', 'Abrir Aba: 💬 Comunidade');
    });
  });
});
