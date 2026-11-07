import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonAiTranscriptionErrorState, { formatErrorDateTime } from './LessonAiTranscriptionErrorState';
import LessonAiTranscriptionTab from './LessonAiTranscriptionTab';
import { ToastProvider } from '../../context/ToastContext';

describe('LessonAiTranscriptionErrorState & LessonAiTranscriptionTab Error Handling', () => {
  const mockLesson = { id: 99, title: 'Aula de Astrologia Kiron' };
  const superadminUser = { id: 1, role: 'superadmin' };
  const adminUser = { id: 2, role: 'admin' };
  const studentUser = { id: 3, role: 'aluno' };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('formata data e horário com precisão no fuso de Brasília', () => {
    const isoDate = '2026-11-07T12:44:00Z';
    const formatted = formatErrorDateTime(isoDate);
    expect(formatted).toContain('07/11/2026');
    expect(formatted).toContain('09:44');
  });

  it('renderiza o componente de erro técnico com detalhes, timestamp e botão de retry para administradores', () => {
    const handleRetry = vi.fn();
    render(
      <LessonAiTranscriptionErrorState
        errorMessage="Erro OpenAI Whisper (400): O arquivo de áudio excede o limite máximo permitido de 25 MB da API Whisper."
        updatedAt="2026-11-07T12:44:00Z"
        onRetry={handleRetry}
      />
    );

    expect(screen.getByTestId('ai-transcription-failed')).toBeInTheDocument();
    expect(screen.getByText('Falha no Processamento da Transcrição')).toBeInTheDocument();
    expect(screen.getByTestId('ai-transcription-error-badge-role')).toHaveTextContent('Visível apenas para Administradores');

    // Valida timestamp
    expect(screen.getByTestId('ai-transcription-error-timestamp')).toHaveTextContent('07/11/2026');

    // Valida mensagem técnica detalhada
    expect(screen.getByTestId('ai-transcription-error-details')).toHaveTextContent('O arquivo de áudio excede o limite');

    // Clica no botão tentar novamente
    const retryBtn = screen.getByTestId('btn-retry-ai-transcription');
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('no LessonAiTranscriptionTab: exibe o erro detalhado para superadmin quando status é failed', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 10,
        lesson_id: 99,
        status: 'failed',
        error_message: 'Falha ao extrair áudio do vídeo via FFmpeg: End of file',
        updated_at: '2026-11-07T12:44:00Z'
      })
    });

    render(
      <ToastProvider>
        <LessonAiTranscriptionTab
          courseId={3}
          moduleId={7}
          lesson={mockLesson}
          currentUser={superadminUser}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-failed')).toBeInTheDocument();
    });

    expect(screen.getByText('Falha no Processamento da Transcrição')).toBeInTheDocument();
    expect(screen.getByTestId('ai-transcription-error-details')).toHaveTextContent('Falha ao extrair áudio do vídeo via FFmpeg');
    expect(screen.getByTestId('ai-transcription-error-timestamp')).toHaveTextContent('07/11/2026');
    expect(screen.getByTestId('btn-retry-ai-transcription')).toBeInTheDocument();
  });

  it('no LessonAiTranscriptionTab: exibe o erro detalhado para admin quando status é failed', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 10,
        lesson_id: 99,
        status: 'failed',
        error_message: 'Falha de comunicação com OpenAI',
        updated_at: '2026-11-07T12:44:00Z'
      })
    });

    render(
      <ToastProvider>
        <LessonAiTranscriptionTab
          courseId={3}
          moduleId={7}
          lesson={mockLesson}
          currentUser={adminUser}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-failed')).toBeInTheDocument();
    });

    expect(screen.getByTestId('ai-transcription-error-details')).toHaveTextContent('Falha de comunicação com OpenAI');
    expect(screen.getByTestId('btn-retry-ai-transcription')).toBeInTheDocument();
  });

  it('no LessonAiTranscriptionTab: aluno NÃO visualiza tela de erro técnico quando status é failed', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 10,
        lesson_id: 99,
        status: 'failed',
        error_message: 'Erro interno de servidor Whisper 500',
        updated_at: '2026-11-07T12:44:00Z'
      })
    });

    render(
      <ToastProvider>
        <LessonAiTranscriptionTab
          courseId={3}
          moduleId={7}
          lesson={mockLesson}
          currentUser={studentUser}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-empty')).toBeInTheDocument();
    });

    // O aluno NÃO pode ver o card de erro nem o botão de retry
    expect(screen.queryByTestId('ai-transcription-failed')).not.toBeInTheDocument();
    expect(screen.queryByTestId('btn-retry-ai-transcription')).not.toBeInTheDocument();
    expect(screen.getByText(/ainda não foram gerados pelo instrutor/i)).toBeInTheDocument();
  });
});
