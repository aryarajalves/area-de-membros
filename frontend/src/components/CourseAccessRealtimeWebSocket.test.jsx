import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseManagement from './CourseManagement';
import { ToastProvider } from '../context/ToastContext';

describe('Liberação de Cursos em Tempo Real via WebSocket', () => {
  const mockCourses = [
    {
      id: 1,
      title: 'Bússola Astrológica',
      description: 'Curso completo',
      has_access: true,
      item_type: 'course'
    },
    {
      id: 2,
      title: 'Astrowake',
      description: 'Curso avançado',
      has_access: false, // Bloqueado inicialmente
      item_type: 'course'
    }
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'fake-token');
  });

  it('atualiza a lista de cursos e remove o bloqueio ao receber evento courses_access_updated sem F5', async () => {
    // 1a chamada: Curso 2 bloqueado
    // 2a chamada (após websocket): Curso 2 liberado (has_access: true)
    let fetchCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      fetchCount += 1;
      const data = fetchCount === 1
        ? mockCourses
        : [
            mockCourses[0],
            { ...mockCourses[1], has_access: true }
          ];
      return Promise.resolve({
        ok: true,
        json: async () => data
      });
    });

    render(
      <ToastProvider>
        <CourseManagement currentUser={{ id: 10, role: 'aluno' }} />
      </ToastProvider>
    );

    // Aguarda carregar
    expect(await screen.findByText('Bússola Astrológica')).toBeInTheDocument();
    expect(screen.getByText('Astrowake')).toBeInTheDocument();

    // Dispara evento WebSocket recebido pelo navegador
    act(() => {
      window.dispatchEvent(
        new CustomEvent('courses_access_updated', {
          detail: {
            user_id: 10,
            course_ids: [1, 2],
            message: '🎉 Novo curso liberado na sua conta!'
          }
        })
      );
    });

    // Deve ter chamado fetchCourses uma segunda vez automaticamente sem F5
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
