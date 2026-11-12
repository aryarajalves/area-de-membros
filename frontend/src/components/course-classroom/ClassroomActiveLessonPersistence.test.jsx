import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CourseClassroom from './CourseClassroom';
import { ToastProvider } from '../../context/ToastContext';

describe('ClassroomActiveLessonPersistence - Preservação da Aula e Módulo Ativo', () => {
  const mockCourse = {
    id: 10,
    title: 'Curso AstroWake',
    bg_color: '#090d16',
    modules: [
      {
        id: 1,
        title: 'Módulo 1 - Comece por aqui',
        lessons: [
          { id: 101, title: 'Aula 1.1 Introdução', module_id: 1, attachments: [] },
          { id: 102, title: 'Aula 1.2 Primeiros Passos', module_id: 1, attachments: [] }
        ]
      },
      {
        id: 2,
        title: 'Módulo 2 - Os Personagens Da Aventura',
        lessons: [
          { id: 201, title: 'Aula 2.1 Conceitos Básicos', module_id: 2, attachments: [] },
          {
            id: 202,
            title: 'Mercúrio: A Mente, Comunicação e Intercâmbio de Ideias',
            module_id: 2,
            attachments: [
              { id: 501, title: 'Mercúrio', file_type: 'pdf', file_size_bytes: 7000000, file_url: 'https://cdn.com/mercurio.pdf' }
            ]
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/courses/10/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ completed_lesson_ids: [] })
        });
      }
      if (url.includes('/api/v1/courses/10')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCourse
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });
  });

  it('mantém a aula e módulo ativos quando ocorre atualização de anexos ou da aula', async () => {
    render(
      <ToastProvider>
        <CourseClassroom
          course={mockCourse}
          currentUser={{ id: 1, role: 'superadmin', name: 'Aryaraj' }}
          initialModuleId={2}
          initialLessonId={202}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    // Aguarda carregar e renderizar a aula 202 (Módulo 2)
    await waitFor(() => {
      expect(screen.getByTestId('active-lesson-title')).toHaveTextContent('Mercúrio: A Mente, Comunicação e Intercâmbio de Ideias');
    }, { timeout: 5000 });

    // Simula refetch dos dados após anexo de arquivo ou edição
    // O mockCourse agora retorna com um novo anexo na aula 202 e título atualizado
    const updatedCourse = JSON.parse(JSON.stringify(mockCourse));
    updatedCourse.modules[1].lessons[1].title = 'Mercúrio: A Mente e Comunicação Expandida';
    updatedCourse.modules[1].lessons[1].attachments.push({
      id: 502,
      title: 'Apostila Complementar',
      file_type: 'pdf',
      file_size_bytes: 3500000,
      file_url: 'https://cdn.com/apostila.pdf'
    });

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/courses/10/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ completed_lesson_ids: [] })
        });
      }
      if (url.includes('/api/v1/courses/10')) {
        return Promise.resolve({
          ok: true,
          json: async () => updatedCourse
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });

    // Dispara evento de atualização como o gerador de título/descrição ou anexo
    await act(async () => {
      window.dispatchEvent(new CustomEvent('lesson-title-updated', {
        detail: { lessonId: 202, newTitle: 'Mercúrio: A Mente e Comunicação Expandida' }
      }));
    });

    // Valida que a aula permaneceu na 202 e NÃO voltou para a Aula 101 do Módulo 1
    await waitFor(() => {
      expect(screen.getByTestId('active-lesson-title')).toHaveTextContent('Mercúrio: A Mente e Comunicação Expandida');
      expect(screen.queryByText('Aula 1.1 Introdução')).not.toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('preserva a aba de materiais complementares e a aula ativa quando novo arquivo é anexado', async () => {
    render(
      <ToastProvider>
        <CourseClassroom
          course={mockCourse}
          currentUser={{ id: 1, role: 'superadmin', name: 'Aryaraj' }}
          initialModuleId={2}
          initialLessonId={202}
          initialTab="attachments"
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    // Aguarda carregar e renderizar a aula 202 com a aba de materiais complementares
    await waitFor(() => {
      expect(screen.getByTestId('active-lesson-title')).toHaveTextContent('Mercúrio: A Mente, Comunicação e Intercâmbio de Ideias');
      expect(screen.getByText('Materiais Complementares da Aula')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Simula anexar um novo documento com upload e vinculo
    const file = new File(['conteudo dummy'], 'Guia_Pratico.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]');

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/upload-attachment')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            title: 'Guia_Pratico.pdf',
            file_url: 'https://cdn.com/guia.pdf',
            file_type: 'pdf',
            file_size: 1500000
          })
        });
      }
      if (url.includes('/attachments') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 999,
            title: 'Guia_Pratico.pdf',
            file_type: 'pdf',
            file_size_bytes: 1500000,
            file_url: 'https://cdn.com/guia.pdf'
          })
        });
      }
      if (url.includes('/api/v1/courses/10/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ completed_lesson_ids: [] })
        });
      }
      if (url.includes('/api/v1/courses/10')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCourse
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({})
      });
    });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    // A aula continua ativa na 202 e a tela permanece na aula e módulo corretos
    await waitFor(() => {
      expect(screen.getByTestId('active-lesson-title')).toHaveTextContent('Mercúrio: A Mente, Comunicação e Intercâmbio de Ideias');
      expect(screen.queryByText('Aula 1.1 Introdução')).not.toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
