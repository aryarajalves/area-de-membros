import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import KnowledgeChunksModal from './KnowledgeChunksModal';

describe('KnowledgeChunksModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('renders modal with list of chunks and handles close button', async () => {
    const handleClose = vi.fn();
    const mockLesson = {
      lesson_id: 12,
      lesson_title: 'Introdução ao RAG',
      course_title: 'Curso de IA',
      module_title: 'Módulo 1'
    };

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/tutor-ia/knowledge-base/lessons/12/chunks')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                chunk_index: 0,
                start_time_str: '00:00',
                end_time_str: '01:30',
                token_count: 140,
                content: 'Neste primeiro fragmento abordamos a arquitetura do RAG.'
              },
              {
                id: 2,
                chunk_index: 1,
                start_time_str: '01:30',
                end_time_str: '03:00',
                token_count: 160,
                content: 'Agora analisamos as funções de similaridade de cosseno.'
              }
            ])
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    });

    render(
      <KnowledgeChunksModal
        isOpen={true}
        onClose={handleClose}
        lesson={mockLesson}
        isLightBg={false}
      />
    );

    expect(screen.getByTestId('knowledge-chunks-modal')).toBeInTheDocument();
    expect(await screen.findByText('Chunk #1')).toBeInTheDocument();
    expect(screen.getByText('Neste primeiro fragmento abordamos a arquitetura do RAG.')).toBeInTheDocument();
    expect(screen.getByText('Chunk #2')).toBeInTheDocument();
    expect(screen.getByText('Agora analisamos as funções de similaridade de cosseno.')).toBeInTheDocument();

    const closeBtn = screen.getByTestId('btn-close-chunks-modal');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('allows switching between transcript chunks and Q&A pairs', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 1,
              chunk_index: 0,
              chunk_type: 'transcript',
              start_time_str: '00:00',
              end_time_str: '01:00',
              token_count: 50,
              content: 'Texto da transcrição.'
            },
            {
              id: 2,
              chunk_index: 1,
              chunk_type: 'qa_pair',
              question_text: 'O que é RAG?',
              answer_text: 'RAG é Retrieval Augmented Generation.',
              start_time_str: '01:00',
              end_time_str: '02:00',
              token_count: 40,
              content: 'Pergunta: O que é RAG?\nResposta: RAG é Retrieval Augmented Generation.'
            }
          ])
      });
    });

    render(
      <KnowledgeChunksModal
        isOpen={true}
        onClose={vi.fn()}
        lesson={{ lesson_id: 12, lesson_title: 'Aula Teste' }}
      />
    );

    expect(await screen.findByText('Chunk #1')).toBeInTheDocument();
    expect(screen.getByText('Texto da transcrição.')).toBeInTheDocument();

    // Clica na aba Q&A
    const qaTab = screen.getByTestId('tab-chunk-qa');
    fireEvent.click(qaTab);

    expect(await screen.findByText('Q&A #1')).toBeInTheDocument();
    expect(screen.getByText(/O que é RAG\?/i)).toBeInTheDocument();
    expect(screen.getByText(/RAG é Retrieval Augmented Generation/i)).toBeInTheDocument();
  });

  it('renders empty state in Q&A tab and allows clicking button to generate questions and answers', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/generate-qa') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', qa_count: 5 })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve([
            { id: 1, chunk_index: 0, chunk_type: 'transcript', content: 'Transcrição apenas.' }
          ])
      });
    });

    render(
      <KnowledgeChunksModal
        isOpen={true}
        onClose={vi.fn()}
        lesson={{ lesson_id: 15, lesson_title: 'Aula Sem Q&A' }}
      />
    );

    // Clica na aba Q&A
    const qaTab = screen.getByTestId('tab-chunk-qa');
    fireEvent.click(qaTab);

    // Empty state visível com botão de gerar
    expect(await screen.findByTestId('qa-empty-state')).toBeInTheDocument();
    const genBtn = screen.getByTestId('btn-generate-qa-modal-empty');
    expect(genBtn).toBeInTheDocument();

    fireEvent.click(genBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/tutor-ia/knowledge-base/lessons/15/generate-qa',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('returns null when isOpen is false', () => {
    const { container } = render(
      <KnowledgeChunksModal isOpen={false} onClose={vi.fn()} lesson={{ lesson_id: 1 }} />
    );
    expect(container.firstChild).toBeNull();
  });
});
