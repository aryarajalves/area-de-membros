import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SuperAdminVideoOptimizerBadge from './SuperAdminVideoOptimizerBadge';
import BatchVideoOptimizationModal from './BatchVideoOptimizationModal';
import LessonAiTranscriptionTab from './LessonAiTranscriptionTab';
import { ToastProvider } from '../../context/ToastContext';

describe('SuperAdminVideoOptimizerBadge Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'fake-superadmin-token');
  });

  it('nao renderiza nada para alunos ou admins que nao sejam superadmin', () => {
    render(
      <ToastProvider>
        <SuperAdminVideoOptimizerBadge
          videoUrl="https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/videos/vid_123.mov"
          currentUser={{ id: 2, role: 'student' }}
        />
      </ToastProvider>
    );
    expect(screen.queryByTestId('superadmin-video-optimizer-badge')).not.toBeInTheDocument();
    expect(screen.queryByTestId('superadmin-optimize-lesson-btn')).not.toBeInTheDocument();
  });

  it('exibe tamanho do video, aviso Sem Otimizacao e botao Otimizar Aula para superadmin', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        video_url: 'https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/videos/vid_123.mov',
        size_bytes: 299262976,
        size_mb: 285.4,
        format: 'MOV',
        is_optimized: false,
        is_optimizing: false
      })
    });

    render(
      <ToastProvider>
        <SuperAdminVideoOptimizerBadge
          videoUrl="https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/videos/vid_123.mov"
          currentUser={{ id: 1, role: 'superadmin' }}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('superadmin-video-size-pill')).toBeInTheDocument();
    });

    expect(screen.getByTestId('superadmin-video-size-pill')).toHaveTextContent('285.4 MB (.MOV)');
    expect(screen.getByTestId('superadmin-video-size-pill')).toHaveTextContent('Sem Otimização');
    expect(screen.getByTestId('superadmin-optimize-lesson-btn')).toBeInTheDocument();
  });

  it('dispara POST /api/v1/courses/optimize-video e abre popup de progresso ao clicar em Otimizar Aula', async () => {
    global.fetch = vi
      .fn()
      // 1a chamada: GET video-info inicial
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          video_url: 'https://b2.com/AreaDeMembros/videos/vid_123.mov',
          size_mb: 338.7,
          format: 'MOV',
          is_optimized: false,
          is_optimizing: false
        })
      })
      // 2a chamada: POST optimize-video
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'processing' })
      })
      // 3a chamada: GET video-info apos clique
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          video_url: 'https://b2.com/AreaDeMembros/videos/vid_123.mov',
          size_mb: 338.7,
          original_size_mb: 338.7,
          format: 'MOV',
          is_optimized: false,
          is_optimizing: true,
          stage: 'converting',
          progress_pct: 65,
          stage_label: 'Transcodificando com FFmpeg (MP4 H.264 + FastStart)...'
        })
      });

    render(
      <ToastProvider>
        <SuperAdminVideoOptimizerBadge
          videoUrl="https://b2.com/AreaDeMembros/videos/vid_123.mov"
          currentUser={{ id: 1, role: 'superadmin' }}
        />
      </ToastProvider>
    );

    const btn = await screen.findByTestId('superadmin-optimize-lesson-btn');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/optimize-video',
        expect.objectContaining({ method: 'POST' })
      );
      expect(screen.getByTestId('video-optimization-modal')).toBeInTheDocument();
    });

    expect(screen.getByTestId('video-optimization-progress-pct')).toHaveTextContent('65%');
    expect(screen.getByText(/Atualizando e Otimizando Vídeo da Aula/i)).toBeInTheDocument();

    // Não deve fechar ao clicar no backdrop externo
    fireEvent.click(screen.getByTestId('video-optimization-modal-backdrop'));
    expect(screen.getByTestId('video-optimization-modal')).toBeInTheDocument();

    // Deve minimizar ao clicar no botão único do popup
    fireEvent.click(screen.getByTestId('video-optimization-modal-close-btn'));
    expect(screen.queryByTestId('video-optimization-modal')).not.toBeInTheDocument();

    // Ao clicar no badge "Otimizando com FFmpeg...", reabre o popup
    fireEvent.click(screen.getByTestId('superadmin-video-size-pill'));
    expect(screen.getByTestId('video-optimization-modal')).toBeInTheDocument();
  });

  it('exibe selo verde Otimizado (FastStart) e oculta botao quando ja otimizado', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        video_url: 'https://b2.com/AreaDeMembros/videos/vid_123.mp4',
        size_mb: 54.67,
        format: 'MP4',
        is_optimized: true,
        is_optimizing: false
      })
    });

    render(
      <ToastProvider>
        <SuperAdminVideoOptimizerBadge
          videoUrl="https://b2.com/AreaDeMembros/videos/vid_123.mp4"
          currentUser={{ id: 1, role: 'superadmin' }}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('superadmin-video-size-pill')).toHaveTextContent('54.67 MB (.MP4)');
      expect(screen.getByTestId('superadmin-video-size-pill')).toHaveTextContent('Otimizado (FastStart)');
    });

    expect(screen.queryByTestId('superadmin-optimize-lesson-btn')).not.toBeInTheDocument();
  });

  it('oculta card vermelho de falha da OpenAI para alunos e mostra card neutro amigavel', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 99,
        lesson_id: 999,
        status: 'failed',
        error_message: 'Erro na API da OpenAI (Whisper): Saldo de créditos da OpenAI esgotado.'
      })
    });

    render(
      <ToastProvider>
        <LessonAiTranscriptionTab
          courseId={1}
          moduleId={1}
          lesson={{ id: 999, title: 'Aula Teste' }}
          currentUser={{ id: 50, role: 'student' }}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('ai-transcription-empty')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('ai-transcription-failed')).not.toBeInTheDocument();
    expect(screen.queryByText(/Saldo de créditos da OpenAI esgotado/i)).not.toBeInTheDocument();
    expect(screen.getByText(/ainda não foram gerados pelo instrutor/i)).toBeInTheDocument();
  });

  it('executa fila sequencial no BatchVideoOptimizationModal aguardando conclusao real sem abortar precoce', async () => {
    const items = [
      {
        mod: { id: 10, title: 'Os Signos' },
        lesson: {
          id: 501,
          title: 'Signos e Elementos: Compreendendo a Astrologia Prática',
          video_url: 'https://b2.com/AreaDeMembros/videos/vid_501.mp4'
        },
        audit: { size_mb: 118.16, format: 'MP4' }
      }
    ];

    global.fetch = vi
      .fn()
      // 1a chamada: POST optimize-video
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'processing' })
      })
      // 2a chamada: GET video-info (em andamento)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          is_optimized: false,
          is_optimizing: true,
          stage: 'converting',
          progress_pct: 55,
          stage_label: 'Aplicando FastStart instantâneo...',
          original_size_mb: 118.16,
          size_mb: 118.16
        })
      })
      // 3a chamada: GET video-info (concluído)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          is_optimized: true,
          is_optimizing: false,
          stage: 'completed',
          progress_pct: 100,
          stage_label: 'Otimização concluída!',
          original_size_mb: 118.16,
          size_mb: 42.5
        })
      });

    const onQueueUpdated = vi.fn();

    render(
      <ToastProvider>
        <BatchVideoOptimizationModal
          isOpen={true}
          onClose={vi.fn()}
          unoptimizedItems={items}
          onQueueUpdated={onQueueUpdated}
          pollIntervalMs={5}
        />
      </ToastProvider>
    );

    const startBtn = screen.getByTestId('batch-video-opt-start-btn');
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(onQueueUpdated).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('batch-opt-item-501')).toHaveTextContent('Concluído');
    expect(screen.getByTestId('batch-opt-item-501')).toHaveTextContent('42.5 MB (.MP4)');
  });
});
