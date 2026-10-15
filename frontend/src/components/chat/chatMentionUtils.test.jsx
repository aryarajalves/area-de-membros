import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatMessageWithMentions,
  handleInternalNavigation,
  getInternalLinkWebUrl,
  resolveButtonUrl,
  countMentionsInText,
  validateMentionsForSend,
  getStoredAuthUser,
} from './chatMentionUtils';

describe('chatMentionUtils', () => {
  let dispatchEventSpy;

  beforeEach(() => {
    vi.useFakeTimers();
    dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    dispatchEventSpy.mockRestore();
    localStorage.clear();
  });

  describe('formatMessageWithMentions', () => {
    it('returns null when text is empty or null', () => {
      expect(formatMessageWithMentions('')).toBeNull();
      expect(formatMessageWithMentions(null)).toBeNull();
    });

    it('renders user mentions highlighted', () => {
      render(<div>{formatMessageWithMentions('Olá @Maria Santos como vai?')}</div>);
      const mention = screen.getByTestId('chat-mention-highlight');
      expect(mention).toBeInTheDocument();
      expect(mention).toHaveTextContent('@Maria Santos');
    });

    it('renders internal link badges for tabs', () => {
      render(
        <div>
          {formatMessageWithMentions(
            'Acesse a aba [📍 Início](internal://tab/home) para começar.'
          )}
        </div>
      );

      const linkBtn = screen.getByTestId('chat-internal-link');
      expect(linkBtn).toBeInTheDocument();
      expect(linkBtn).toHaveTextContent('📍 Início');
    });

    it('renders internal link badges for courses', () => {
      render(
        <div>
          {formatMessageWithMentions(
            'Recomendo o curso [📚 React](internal://course/42) completo.'
          )}
        </div>
      );

      const linkBtn = screen.getByTestId('chat-internal-link');
      expect(linkBtn).toBeInTheDocument();
      expect(linkBtn).toHaveTextContent('📚 React');
    });

    it('renders internal link badges for lessons', () => {
      render(
        <div>
          {formatMessageWithMentions(
            'Assista à aula [🎥 Introdução](internal://lesson/42/10) agora.'
          )}
        </div>
      );

      const linkBtn = screen.getByTestId('chat-internal-link');
      expect(linkBtn).toBeInTheDocument();
      expect(linkBtn).toHaveTextContent('🎥 Introdução');
    });

    it('opens tab link in new tab with window.open and does not dispatch navigation event on current window', () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(
        <div>
          {formatMessageWithMentions(
            'Veja em [📍 Suporte](internal://tab/support).'
          )}
        </div>
      );

      const linkBtn = screen.getByTestId('chat-internal-link');
      fireEvent.click(linkBtn);

      expect(openSpy).toHaveBeenCalledWith('/?tab=support', '_blank', 'noopener,noreferrer');
      expect(dispatchEventSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'app:navigate_tab' })
      );
      openSpy.mockRestore();
    });
  });

  describe('getInternalLinkWebUrl', () => {
    it('converts internal lesson link to web query parameters', () => {
      expect(getInternalLinkWebUrl('internal://lesson/10/42')).toBe(
        '/?tab=courses&courseId=10&lessonId=42'
      );
    });

    it('converts internal course link to web query parameters', () => {
      expect(getInternalLinkWebUrl('internal://course/77')).toBe('/?tab=courses&courseId=77');
    });

    it('converts internal tab link to web query parameters', () => {
      expect(getInternalLinkWebUrl('internal://tab/support')).toBe('/?tab=support');
    });
  });

  describe('handleInternalNavigation', () => {
    let openSpy;

    beforeEach(() => {
      openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    });

    afterEach(() => {
      openSpy.mockRestore();
    });

    it('opens lesson exclusively in new tab with _blank and does NOT redirect or dispatch events on current window', () => {
      handleInternalNavigation('internal://lesson/77/888');

      expect(openSpy).toHaveBeenCalledWith(
        '/?tab=courses&courseId=77&lessonId=888',
        '_blank',
        'noopener,noreferrer'
      );

      vi.advanceTimersByTime(200);

      expect(dispatchEventSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'open_course_lesson' })
      );
      expect(dispatchEventSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'app:navigate_tab' })
      );
    });

    it('opens course exclusively in new tab with _blank and does NOT redirect current window', () => {
      handleInternalNavigation('internal://course/77');

      expect(openSpy).toHaveBeenCalledWith(
        '/?tab=courses&courseId=77',
        '_blank',
        'noopener,noreferrer'
      );

      vi.advanceTimersByTime(200);

      expect(dispatchEventSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'open_course_lesson' })
      );
      expect(dispatchEventSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'app:navigate_tab' })
      );
    });

    it('opens tab exclusively in new tab with _blank and does NOT redirect current window', () => {
      handleInternalNavigation('internal://tab/ranking');

      expect(openSpy).toHaveBeenCalledWith('/?tab=ranking', '_blank', 'noopener,noreferrer');

      expect(dispatchEventSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'app:navigate_tab' })
      );
    });
  });

  describe('resolveButtonUrl', () => {
    it('returns # when empty', () => {
      expect(resolveButtonUrl('')).toBe('#');
    });

    it('preserves https, http, mailto and relative paths', () => {
      expect(resolveButtonUrl('https://google.com')).toBe('https://google.com');
      expect(resolveButtonUrl('http://exemplo.com')).toBe('http://exemplo.com');
      expect(resolveButtonUrl('/perfil')).toBe('/perfil');
    });

    it('prefixes bare domains with https://', () => {
      expect(resolveButtonUrl('meusite.com.br')).toBe('https://meusite.com.br');
    });
  });

  describe('formatMessageWithMentions @todos badge', () => {
    it('renders @todos with special gold badge', () => {
      render(<div>{formatMessageWithMentions('Atenção @todos reunião agora!')}</div>);
      const todosBadge = screen.getByTestId('chat-mention-todos');
      expect(todosBadge).toBeInTheDocument();
      expect(todosBadge).toHaveTextContent('@todos');
    });
  });

  describe('countMentionsInText', () => {
    it('returns 0 when text is empty or has no mentions', () => {
      expect(countMentionsInText('')).toBe(0);
      expect(countMentionsInText('Olá mundo')).toBe(0);
      expect(countMentionsInText(null)).toBe(0);
    });

    it('counts mentions accurately including @todos', () => {
      expect(countMentionsInText('Olá @joao e @maria')).toBe(2);
      expect(countMentionsInText('@todos olá')).toBe(1);
      expect(countMentionsInText('@a @b @c @d @e @f')).toBe(6);
    });
  });

  describe('validateMentionsForSend', () => {
    it('allows any user to send messages without mentions', () => {
      const res = validateMentionsForSend('Olá pessoal', { role: 'aluno' });
      expect(res.valid).toBe(true);
    });

    it('blocks @todos for non-admin users', () => {
      const res = validateMentionsForSend('Olá @todos atenção', { role: 'aluno' });
      expect(res.valid).toBe(false);
      expect(res.error).toMatch(/Apenas administradores podem utilizar a menção @todos/i);
    });

    it('allows @todos for admin and superadmin', () => {
      const resAdmin = validateMentionsForSend('Aviso @todos', { role: 'admin' });
      expect(resAdmin.valid).toBe(true);

      const resSuper = validateMentionsForSend('Aviso @todos', { role: 'superadmin' });
      expect(resSuper.valid).toBe(true);
    });

    it('allows up to 5 mentions for common user', () => {
      const res5 = validateMentionsForSend('@u1 @u2 @u3 @u4 @u5 oi', { role: 'aluno' });
      expect(res5.valid).toBe(true);
    });

    it('blocks more than 5 mentions for common user', () => {
      const res6 = validateMentionsForSend('@u1 @u2 @u3 @u4 @u5 @u6 oi', { role: 'aluno' });
      expect(res6.valid).toBe(false);
      expect(res6.error).toMatch(/Usuários comuns podem mencionar no máximo 5 contatos/i);
    });

    it('allows more than 5 mentions for admin', () => {
      const res7 = validateMentionsForSend('@u1 @u2 @u3 @u4 @u5 @u6 @u7 oi', { role: 'admin' });
      expect(res7.valid).toBe(true);
    });
  });

  describe('getStoredAuthUser', () => {
    it('returns null if no user in localStorage', () => {
      expect(getStoredAuthUser()).toBeNull();
    });

    it('returns parsed user from user key', () => {
      localStorage.setItem('user', JSON.stringify({ name: 'Admin User', role: 'admin' }));
      const user = getStoredAuthUser();
      expect(user).toEqual({ name: 'Admin User', role: 'admin' });
    });

    it('returns parsed user from auth_user key if user key is absent', () => {
      localStorage.setItem('auth_user', JSON.stringify({ name: 'Aluno User', role: 'aluno' }));
      const user = getStoredAuthUser();
      expect(user).toEqual({ name: 'Aluno User', role: 'aluno' });
    });
  });
});

