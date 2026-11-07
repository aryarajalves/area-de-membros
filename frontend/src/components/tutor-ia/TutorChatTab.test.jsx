import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TutorChatTab from './TutorChatTab';
import { ToastProvider } from '../../context/ToastContext';

describe('TutorChatTab Component', () => {
  const createMockStream = (replyText, messageId = 3, remaining = 2) => {
    const encoder = new TextEncoder();
    const half = Math.floor(replyText.length / 2);
    const chunks = [
      encoder.encode(`data: ${JSON.stringify({ type: 'token', token: replyText.substring(0, half) })}\n\n`),
      encoder.encode(`data: ${JSON.stringify({ type: 'token', token: replyText.substring(half) })}\n\n`),
      encoder.encode(`data: ${JSON.stringify({
        type: 'done',
        reply: replyText,
        message_id: messageId,
        cost_brl: 0.005,
        remaining_free: remaining,
        can_ask: true,
        tutor_name: 'Mestre Astrológico',
        related_lessons: []
      })}\n\n`)
    ];

    let idx = 0;
    return {
      ok: true,
      body: {
        getReader: () => ({
          read: () => {
            if (idx < chunks.length) {
              return Promise.resolve({ value: chunks[idx++], done: false });
            }
            return Promise.resolve({ value: undefined, done: true });
          }
        })
      }
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-token');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders chat history and allows sending a question', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/tutor-ia/status')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tutor_name: 'Mestre Astrológico',
              is_active: false,
              can_ask: true,
              remaining_free: 3,
              total_monthly_limit: 3,
              sales_checkout_url: 'https://checkout.exemplo.com',
              monthly_price_brl: 10.0
            })
        });
      }
      if (url.includes('/api/v1/tutor-ia/history')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                role: 'user',
                content: 'Como funciona os trânsitos?',
                created_at: new Date().toISOString()
              },
              {
                id: 2,
                role: 'assistant',
                content: 'Os trânsitos astrológicos indicam movimentos cósmicos.',
                created_at: new Date().toISOString()
              }
            ])
        });
      }
      if (url.includes('/api/v1/tutor-ia/chat')) {
        return Promise.resolve(createMockStream('Exatamente, você pode rever no minuto 01:20.', 3, 2));
      }
      if (url.includes('/api/v1/tutor-ia/suggested-questions')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              lesson_id: 10,
              questions: ['Como funciona os trânsitos?', 'O que é orbe?'],
              has_custom_qa: true
            })
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    render(
      <ToastProvider>
        <TutorChatTab courseId={1} lessonId={10} currentUser={{ id: 1, name: 'Aluno Teste' }} />
      </ToastProvider>
    );

    // Aguarda carregar histórico e exibe o nome customizado do tutor
    expect(await screen.findByText(/Mestre Astrológico da Aula/i)).toBeInTheDocument();
    expect(screen.getByText('Como funciona os trânsitos?')).toBeInTheDocument();

    // Digita nova pergunta e envia
    const input = screen.getByTestId('input-tutor-message');
    fireEvent.change(input, { target: { value: 'Qual minuto fala do trânsito de marte?' } });
    
    const sendBtn = screen.getByTestId('btn-send-tutor-message');
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(screen.getByText(/Exatamente, você pode rever no minuto/i)).toBeInTheDocument();
      expect(screen.getByText('01:20')).toBeInTheDocument();
    });
  });

  it('removes user message from chat if the request fails (rollback on error)', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/tutor-ia/status')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tutor_name: 'Tutor IA 24h',
              is_active: false,
              can_ask: true,
              remaining_free: 3,
              total_monthly_limit: 3,
              sales_checkout_url: null,
              monthly_price_brl: 10.0
            })
        });
      }
      if (url.includes('/api/v1/tutor-ia/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/v1/tutor-ia/suggested-questions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ lesson_id: 10, questions: [], has_custom_qa: false })
        });
      }
      if (url.includes('/api/v1/tutor-ia/chat')) {
        // Simula erro de servidor / inicialização (500)
        return Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ detail: 'O servidor está inicializando.' })
        });
      }
      if (url.includes('/api/v1/tutor-ia/suggested-questions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ lesson_id: 10, questions: [], has_custom_qa: false })
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    render(
      <ToastProvider>
        <TutorChatTab courseId={1} lessonId={10} currentUser={{ id: 1, name: 'Aluno Teste' }} />
      </ToastProvider>
    );

    await screen.findByTestId('tutor-empty-state');

    const input = screen.getByTestId('input-tutor-message');
    fireEvent.change(input, { target: { value: 'Mensagem com falha' } });

    const sendBtn = screen.getByTestId('btn-send-tutor-message');
    fireEvent.click(sendBtn);

    // Como falhou no backend, a mensagem do usuário NÃO deve ficar no chat!
    await waitFor(() => {
      expect(screen.queryByText('Mensagem com falha')).not.toBeInTheDocument();
    });
  });

  it('renders paywall when user runs out of questions', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/v1/tutor-ia/status')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tutor_name: 'Tutor IA 24h',
              is_active: false,
              can_ask: false,
              remaining_free: 0,
              total_monthly_limit: 3,
              sales_checkout_url: 'https://checkout.exemplo.com/plano-ia',
              monthly_price_brl: 10.0
            })
        });
      }
      if (url.includes('/api/v1/tutor-ia/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/api/v1/tutor-ia/suggested-questions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ lesson_id: 10, questions: [], has_custom_qa: false })
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    render(
      <ToastProvider>
        <TutorChatTab courseId={1} lessonId={10} currentUser={{ id: 1, name: 'Aluno Teste' }} />
      </ToastProvider>
    );

    expect(await screen.findByText(/Desbloqueie o Tutor IA Ilimitado 24h/i)).toBeInTheDocument();
    expect(screen.getByText(/Você utilizou sua cota de degustação gratuita/i)).toBeInTheDocument();
  });

  it('allows manager to manually trigger RAG indexing for current lesson', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/v1/tutor-ia/status')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tutor_name: 'Tutor IA 24h',
              is_active: true,
              can_ask: true,
              remaining_free: 999,
              total_monthly_limit: 999
            })
        });
      }
      if (url.includes('/api/v1/tutor-ia/history')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/v1/tutor-ia/knowledge-base/lessons/10/index') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, chunks_created: 8 })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <TutorChatTab
          courseId={1}
          lessonId={10}
          currentUser={{ id: 99, role: 'superadmin', name: 'Admin Teste' }}
        />
      </ToastProvider>
    );

    const ragBtn = await screen.findByTestId('btn-index-lesson-rag');
    expect(ragBtn).toBeInTheDocument();
    fireEvent.click(ragBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/tutor-ia/knowledge-base/lessons/10/index',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('renders suggested quick questions for the lesson and sends immediately when clicked', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/v1/tutor-ia/status')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tutor_name: 'Tutor IA 24h',
              is_active: true,
              can_ask: true,
              remaining_free: 5,
              total_monthly_limit: 5
            })
        });
      }
      if (url.includes('/api/v1/tutor-ia/history')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      if (url.includes('/api/v1/tutor-ia/suggested-questions')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              lesson_id: 10,
              questions: [
                'Como funciona o retorno de Saturno?',
                'Qual o tempo de duração desta aula?'
              ],
              has_custom_qa: true
            })
        });
      }
      if (url.includes('/api/v1/tutor-ia/chat')) {
        return Promise.resolve(createMockStream('O retorno de Saturno é analisado em detalhes no minuto 02:15.', 99, 4));
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <TutorChatTab
          courseId={1}
          lessonId={10}
          currentUser={{ id: 5, name: 'Aluno Curioso' }}
        />
      </ToastProvider>
    );

    // Deve carregar as perguntas sugeridas específicas da aula
    expect(await screen.findByText('Como funciona o retorno de Saturno?')).toBeInTheDocument();
    expect(screen.getByText('Qual o tempo de duração desta aula?')).toBeInTheDocument();
    expect(screen.getByText('Baseado no vídeo')).toBeInTheDocument();

    // Clica no primeiro chip sugerido
    const promptBtn = screen.getByTestId('btn-quick-prompt-0');
    fireEvent.click(promptBtn);

    // Deve enviar a pergunta e renderizar a resposta da IA via streaming
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/tutor-ia/chat/stream',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"message":"Como funciona o retorno de Saturno?"')
        })
      );
      expect(screen.getByText(/O retorno de Saturno é analisado em detalhes no minuto/i)).toBeInTheDocument();
    });
  });

  it('opens feedback modal on dislike click and submits reason to backend', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/v1/tutor-ia/status')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tutor_name: 'Tutor IA 24h',
              is_active: true,
              can_ask: true,
              remaining_free: 5,
              total_monthly_limit: 5
            })
        });
      }
      if (url.includes('/api/v1/tutor-ia/history')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 101,
                role: 'assistant',
                content: 'Esta é uma resposta que o aluno vai avaliar negativamente.',
                created_at: new Date().toISOString()
              }
            ])
        });
      }
      if (url.includes('/api/v1/tutor-ia/suggested-questions')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ lesson_id: 10, questions: [], has_custom_qa: false })
        });
      }
      if (url.includes('/api/v1/tutor-ia/messages/101/feedback') && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ status: 'success', message_id: 101, rating: body.rating, feedback_text: body.feedback_text })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <TutorChatTab
          courseId={1}
          lessonId={10}
          currentUser={{ id: 5, name: 'Aluno Avaliador' }}
        />
      </ToastProvider>
    );

    // Aguarda carregar a mensagem
    expect(await screen.findByText('Esta é uma resposta que o aluno vai avaliar negativamente.')).toBeInTheDocument();

    // Clica no botão de Dislike da mensagem
    const dislikeBtn = screen.getByTestId('btn-feedback-dislike');
    fireEvent.click(dislikeBtn);

    // Modal de justificativa deve abrir
    expect(await screen.findByText('Como podemos melhorar esta resposta?')).toBeInTheDocument();

    // Digita a justificativa
    const textarea = screen.getByTestId('textarea-feedback-reason');
    fireEvent.change(textarea, { target: { value: 'A explicação foi muito superficial.' } });

    // Envia a avaliação
    const submitBtn = screen.getByTestId('btn-submit-feedback');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/tutor-ia/messages/101/feedback',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ rating: 'dislike', feedback_text: 'A explicação foi muito superficial.' })
        })
      );
    });
  });

  it('opens save note modal, allows editing content and saves note in lesson', async () => {
    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/status')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ tutor_name: 'Sofia IA', can_ask: true }) });
      if (url.includes('/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { id: 201, role: 'assistant', content: 'Sol na Casa 10 indica liderança de carreira.', created_at: new Date().toISOString() }
          ])
        });
      }
      if (url.includes('/suggested-questions')) return Promise.resolve({ ok: true, json: () => Promise.resolve({ questions: [] }) });
      if (url.includes('/notes') && opts?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 999, content: JSON.parse(opts.body).content })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(
      <ToastProvider>
        <TutorChatTab courseId={1} lessonId={10} currentUser={{ id: 5 }} />
      </ToastProvider>
    );

    expect(await screen.findByText('Sol na Casa 10 indica liderança de carreira.')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('btn-save-note-from-message'));

    expect(await screen.findByTestId('tutor-save-note-modal')).toBeInTheDocument();
    const textarea = screen.getByTestId('input-edit-note-content');
    expect(textarea.value).toBe('Sol na Casa 10 indica liderança de carreira.');

    fireEvent.change(textarea, { target: { value: 'Sol na Casa 10: Foco profissional e notoriedade.' } });
    fireEvent.click(screen.getByTestId('btn-confirm-save-note'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/lessons/10/notes',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Sol na Casa 10: Foco profissional e notoriedade.' })
        })
      );
    });
  });
});
