import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlatformKnowledgeBaseTab from './PlatformKnowledgeBaseTab';
import { ToastProvider } from '../../context/ToastContext';

describe('PlatformKnowledgeBaseTab Component', () => {
  const mockOverview = {
    metrics: {
      total_lessons: 20,
      total_transcriptions: 12,
      indexed_lessons: 10,
      total_chunks: 125
    },
    tree: [
      {
        course_id: 1,
        course_title: 'Astrologia Básica',
        total_lessons: 2,
        indexed_lessons: 1,
        total_chunks: 14,
        modules: [
          {
            module_id: 11,
            module_title: 'Módulo 1 - Fundamentos',
            order_index: 1,
            lessons: [
              {
                lesson_id: 101,
                lesson_title: 'Introdução aos Signos',
                module_id: 11,
                course_id: 1,
                has_transcription: true,
                is_indexed: true,
                chunks_count: 14,
                qa_count: 5,
                duration_str: '05:00'
              },
              {
                lesson_id: 102,
                lesson_title: 'Casas Astrológicas',
                module_id: 11,
                course_id: 1,
                has_transcription: true,
                is_indexed: false,
                chunks_count: 0,
                qa_count: 0,
                duration_str: '08:00'
              }
            ]
          }
        ]
      }
    ],
    lessons: []
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('renders metrics and hierarchical course tree correctly', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/tutor-ia/knowledge-base') && !url.includes('/index') && !url.includes('/chunks')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOverview)
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(
      <ToastProvider>
        <PlatformKnowledgeBaseTab />
      </ToastProvider>
    );

    // Métricas
    expect(await screen.findByText('125')).toBeInTheDocument(); // total chunks
    expect(screen.getByText('10')).toBeInTheDocument(); // indexed lessons
    expect(screen.getByText('12')).toBeInTheDocument(); // total transcriptions
    expect(screen.getByText('20')).toBeInTheDocument(); // total lessons

    // Árvore hierárquica
    expect(screen.getByText('Astrologia Básica')).toBeInTheDocument();
    expect(screen.getByText('Módulo 1 - Fundamentos')).toBeInTheDocument();
    expect(screen.getByText('Introdução aos Signos')).toBeInTheDocument();
    expect(screen.getByText('Casas Astrológicas')).toBeInTheDocument();
    expect(screen.getByText('Pendente RAG')).toBeInTheDocument();
  });

  it('allows selecting lessons and opens real-time batch progress modal', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/v1/tutor-ia/knowledge-base/lessons/101/index') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', chunks_count: 14, qa_count: 5, message: 'OK' })
        });
      }
      if (url.includes('/api/v1/tutor-ia/knowledge-base')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOverview)
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <PlatformKnowledgeBaseTab />
      </ToastProvider>
    );

    await screen.findByText('Introdução aos Signos');

    // Clica no checkbox da aula 101
    const lessonCheckbox = screen.getByTestId('checkbox-lesson-101');
    fireEvent.click(lessonCheckbox);

    // Barra de ação em lote surge
    expect(await screen.findByTestId('bulk-action-bar')).toBeInTheDocument();
    expect(screen.getByText(/1 aula selecionada/i)).toBeInTheDocument();

    // Clica no botão de sincronizar selecionadas
    const syncBtn = screen.getByTestId('btn-index-selected-rag');
    fireEvent.click(syncBtn);

    // Modal de progresso em lote é exibido
    const modal = await screen.findByTestId('knowledge-batch-progress-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByTestId('batch-progress-modal-title')).toHaveTextContent(/Sincronização/i);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/tutor-ia/knowledge-base/lessons/101/index',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('triggers index single lesson and opens chunks modal', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/v1/tutor-ia/knowledge-base/lessons/102/index') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, chunks_count: 12 })
        });
      }
      if (url.includes('/api/v1/tutor-ia/knowledge-base/lessons/101/chunks')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                chunk_index: 0,
                chunk_type: 'transcript',
                start_time_str: '00:00',
                end_time_str: '02:00',
                token_count: 150,
                content: 'Trecho do signo de Áries.'
              }
            ])
        });
      }
      if (url.includes('/api/v1/tutor-ia/knowledge-base')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockOverview)
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <PlatformKnowledgeBaseTab />
      </ToastProvider>
    );

    await screen.findByText('Casas Astrológicas');

    // Clica no botão de indexar a aula pendente
    const indexBtn = screen.getByTestId('btn-reindex-102');
    fireEvent.click(indexBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/tutor-ia/knowledge-base/lessons/102/index',
        expect.objectContaining({ method: 'POST' })
      );
    });

    // Clica no botão de ver chunks da aula indexada
    const viewChunksBtn = screen.getByTestId('btn-view-chunks-101');
    fireEvent.click(viewChunksBtn);

    expect(await screen.findByTestId('knowledge-chunks-modal')).toBeInTheDocument();
    expect(await screen.findByText('Trecho do signo de Áries.')).toBeInTheDocument();
  });
});
