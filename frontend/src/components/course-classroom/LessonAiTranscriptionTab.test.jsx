import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonAiTranscriptionTab from './LessonAiTranscriptionTab';

const mockAddToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast
  })
}));

describe('LessonAiTranscriptionTab Component', () => {
  const mockLesson = { id: 1, title: 'Aula de Teste com Vídeo' };
  const adminUser = { id: 1, role: 'superadmin' };
  const studentUser = { id: 2, role: 'aluno' };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve())
      }
    });
    window.open = vi.fn();
  });

  it('renders empty state for admin with trigger button', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 0,
        lesson_id: 1,
        full_transcript: '',
        status: 'not_started'
      })
    });

    render(
      <LessonAiTranscriptionTab
        courseId={10}
        moduleId={5}
        lesson={mockLesson}
        currentUser={adminUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-empty')).toBeInTheDocument();
    });

    expect(screen.getByTestId('btn-trigger-ai-transcription')).toBeInTheDocument();
    expect(screen.getByText('Gerar Transcrição com IA')).toBeInTheDocument();
  });

  it('renders empty state for student without trigger button', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 0,
        lesson_id: 1,
        full_transcript: '',
        status: 'not_started'
      })
    });

    render(
      <LessonAiTranscriptionTab
        courseId={10}
        moduleId={5}
        lesson={mockLesson}
        currentUser={studentUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-empty')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('btn-trigger-ai-transcription')).not.toBeInTheDocument();
    expect(screen.getByText(/ainda não foram gerados pelo instrutor/i)).toBeInTheDocument();
  });

  it('triggers transcription when admin clicks generate button', async () => {
    // 1. Initial GET
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 0,
          lesson_id: 1,
          full_transcript: '',
          status: 'not_started'
        })
      })
      // 2. POST transcribe
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          lesson_id: 1,
          full_transcript: 'Esta é a transcrição do vídeo.',
          summary_markdown: '## Resumo da Aula\nResumo detalhado gerado pela IA.',
          key_takeaways: ['Conceito de desacoplamento', 'Importância dos testes'],
          summary_html: '<html><body>Conteudo</body></html>',
          status: 'completed'
        })
      });

    render(
      <LessonAiTranscriptionTab
        courseId={10}
        moduleId={5}
        lesson={mockLesson}
        currentUser={adminUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('btn-trigger-ai-transcription')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-trigger-ai-transcription'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/10/modules/5/lessons/1/transcribe',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-container')).toBeInTheDocument();
      expect(screen.getByText('Esta é a transcrição do vídeo.')).toBeInTheDocument();
      expect(screen.getByText('Conceito de desacoplamento')).toBeInTheDocument();
    });
  });

  it('renders completed transcription with actions, takeaways and search', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        lesson_id: 1,
        full_transcript: 'Primeira frase de introdução.\nSegunda frase sobre arquitetura.\nTerceira frase de conclusão.',
        summary_markdown: 'Resumo completo da aula.',
        key_takeaways: ['Destaque 1', 'Destaque 2'],
        summary_html: '<html><body>Doc HTML</body></html>',
        status: 'completed'
      })
    });

    render(
      <LessonAiTranscriptionTab
        courseId={10}
        moduleId={5}
        lesson={mockLesson}
        currentUser={adminUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-container')).toBeInTheDocument();
    });

    // Valida takeaways e resumo
    expect(screen.getByText('Destaque 1')).toBeInTheDocument();
    expect(screen.getByText('Destaque 2')).toBeInTheDocument();
    expect(screen.getByText('Resumo completo da aula.')).toBeInTheDocument();

    // Testa cópia do texto
    const copyBtn = screen.getByTestId('btn-copy-transcription');
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining('Primeira frase'));
    expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('copiada'), 'success');

    // Botão de abrir documento HTML foi removido conforme solicitação
    expect(screen.queryByTestId('btn-open-html-document')).not.toBeInTheDocument();
    expect(screen.queryByText('Abrir Documento HTML')).not.toBeInTheDocument();

    // Testa busca rápida na transcrição
    const searchInput = screen.getByTestId('input-search-transcript');
    fireEvent.change(searchInput, { target: { value: 'arquitetura' } });

    expect(screen.getByTestId('transcript-content-box')).toHaveTextContent('Segunda frase sobre arquitetura.');
    expect(screen.getByTestId('transcript-content-box')).not.toHaveTextContent('Primeira frase de introdução.');
  });

  it('opens confirmation modal when clicking Re-gerar and confirms retriggering', async () => {
    // 1. Initial GET
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          lesson_id: 1,
          status: 'completed',
          full_transcript: 'Texto original',
          summary_markdown: 'Resumo original',
          key_takeaways: ['Ponto']
        })
      })
      // 2. POST transcribe after modal confirmation
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          lesson_id: 1,
          status: 'processing'
        })
      });

    render(
      <LessonAiTranscriptionTab
        courseId={10}
        moduleId={5}
        lesson={mockLesson}
        currentUser={adminUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('btn-retrigger-ai')).toBeInTheDocument();
    });

    // Modal inicialmente fechado
    expect(screen.queryByTestId('confirm-retrigger-ai-modal')).not.toBeInTheDocument();

    // Clica no botão Re-gerar
    fireEvent.click(screen.getByTestId('btn-retrigger-ai'));

    // Modal central de confirmação deve abrir
    expect(screen.getByTestId('confirm-retrigger-ai-modal')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-retrigger-ai-title')).toHaveTextContent('Re-gerar Transcrição com IA?');
    expect(screen.getByTestId('confirm-retrigger-ai-message')).toHaveTextContent(/Esta ação irá reprocessar o áudio do vídeo com a IA/i);

    // Clica em Cancelar primeiro para testar cancelamento
    fireEvent.click(screen.getByTestId('cancel-retrigger-ai-btn'));
    expect(screen.queryByTestId('confirm-retrigger-ai-modal')).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1); // Não disparou o POST

    // Abre novamente e confirma a ação
    fireEvent.click(screen.getByTestId('btn-retrigger-ai'));
    expect(screen.getByTestId('confirm-retrigger-ai-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-retrigger-ai-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/10/modules/5/lessons/1/transcribe',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  it('renders cost badge for admin when estimated_cost_formatted is provided', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        lesson_id: 1,
        full_transcript: 'Texto transcrito da aula.',
        summary_markdown: 'Resumo executivo.',
        summary_html: '<p>HTML</p>',
        key_takeaways: ['Takeaway'],
        status: 'completed',
        estimated_cost_brl: 0.18,
        estimated_cost_formatted: 'R$ 0,18'
      })
    });

    render(
      <LessonAiTranscriptionTab
        courseId={10}
        moduleId={5}
        lesson={mockLesson}
        currentUser={adminUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-cost-badge')).toBeInTheDocument();
    });

    expect(screen.getByTestId('ai-transcription-cost-badge')).toHaveTextContent('Custo: R$ 0,18');
  });

  it('never renders cost badge for student even if estimated_cost_formatted is present', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        lesson_id: 1,
        full_transcript: 'Texto transcrito da aula.',
        summary_markdown: 'Resumo executivo.',
        summary_html: '<p>HTML</p>',
        key_takeaways: ['Takeaway'],
        status: 'completed',
        estimated_cost_brl: 0.18,
        estimated_cost_formatted: 'R$ 0,18'
      })
    });

    render(
      <LessonAiTranscriptionTab
        courseId={10}
        moduleId={5}
        lesson={mockLesson}
        currentUser={studentUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-container')).toBeInTheDocument();
    });

    // O badge de custo NÃO pode estar visível para o aluno
    expect(screen.queryByTestId('ai-transcription-cost-badge')).not.toBeInTheDocument();
    expect(screen.queryByText(/Custo:/i)).not.toBeInTheDocument();

    // A transcrição integral e o botão de copiar NÃO devem aparecer para o aluno
    expect(screen.queryByTestId('ai-full-transcription')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-copy-transcription')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Buscar termo no texto...')).not.toBeInTheDocument();

    // O resumo da aula e pontos-chave continuam visíveis para o aluno
    expect(screen.getByTestId('ai-key-takeaways')).toBeInTheDocument();
    expect(screen.getByTestId('ai-summary-executive')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-open-html-document')).not.toBeInTheDocument();
  });

  it('renders processing state with spinner and allows admin to cancel/reset', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 1,
          lesson_id: 1,
          status: 'processing'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Status de transcrição resetado com sucesso.' })
      });

    render(
      <LessonAiTranscriptionTab
        courseId={10}
        moduleId={5}
        lesson={mockLesson}
        currentUser={adminUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-processing')).toBeInTheDocument();
      expect(screen.getByTestId('ai-loading-spinner-ring')).toBeInTheDocument();
      expect(screen.getByTestId('btn-cancel-transcription')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('btn-cancel-transcription'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/10/modules/5/lessons/1/transcription',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  it('renders failed state with error message and retry button', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        lesson_id: 1,
        status: 'failed',
        error_message: 'Falha no áudio do vídeo.'
      })
    });

    render(
      <LessonAiTranscriptionTab
        courseId={10}
        moduleId={5}
        lesson={mockLesson}
        currentUser={adminUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-failed')).toBeInTheDocument();
      expect(screen.getByText('Falha no áudio do vídeo.')).toBeInTheDocument();
      expect(screen.getByTestId('btn-retry-ai-transcription')).toBeInTheDocument();
    });
  });

  it('renders chapters card and dispatches video-seek-to when clicking a chapter timestamp', async () => {
    const seekSpy = vi.fn();
    window.addEventListener('video-seek-to', seekSpy);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        lesson_id: 1,
        status: 'completed',
        summary_markdown: 'Resumo completo',
        key_takeaways: ['Ponto A'],
        full_transcript: 'Texto completo',
        chapters: [
          { time: '00:00', seconds: 0, title: 'Início da Aula' },
          { time: '01:30', seconds: 90, title: 'Desenvolvimento Teórico' }
        ]
      })
    });

    render(
      <LessonAiTranscriptionTab
        courseId={10}
        moduleId={5}
        lesson={mockLesson}
        currentUser={studentUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-chapters-card')).toBeInTheDocument();
    });

    expect(screen.getByText('Capítulos da Aula (Minutagem)')).toBeInTheDocument();
    expect(screen.getByText('Início da Aula')).toBeInTheDocument();
    expect(screen.getByText('Desenvolvimento Teórico')).toBeInTheDocument();

    const seekBtn = screen.getByTestId('btn-seek-chapter-1');
    expect(seekBtn).toHaveTextContent('01:30');
    fireEvent.click(seekBtn);

    expect(seekSpy).toHaveBeenCalled();
    const eventDetail = seekSpy.mock.calls[0][0].detail;
    expect(eventDetail.seconds).toBe(90);

    window.removeEventListener('video-seek-to', seekSpy);
  });

  it('dispatches lesson-title-updated event when backend provides a generated lesson title and description', async () => {
    const titleUpdateSpy = vi.fn();
    window.addEventListener('lesson-title-updated', titleUpdateSpy);

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 1,
        lesson_id: 1,
        lesson_title: 'Lua na Casa 2: Recursos e Finanças',
        lesson_description: 'Nesta aula completa, você aprenderá o impacto da Lua na casa 2.',
        status: 'completed',
        summary_markdown: 'Resumo completo',
        key_takeaways: ['Conceito'],
        full_transcript: 'Texto',
        chapters: []
      })
    });

    render(
      <LessonAiTranscriptionTab
        courseId={10}
        moduleId={5}
        lesson={mockLesson}
        currentUser={studentUser}
      />
    );

    await waitFor(() => {
      expect(titleUpdateSpy).toHaveBeenCalled();
    });

    const eventDetail = titleUpdateSpy.mock.calls[0][0].detail;
    expect(eventDetail.lessonId).toBe(1);
    expect(eventDetail.newTitle).toBe('Lua na Casa 2: Recursos e Finanças');
    expect(eventDetail.newDescription).toBe('Nesta aula completa, você aprenderá o impacto da Lua na casa 2.');

    window.removeEventListener('lesson-title-updated', titleUpdateSpy);
  });
});


