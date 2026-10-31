import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SuperAdminLessonAuditFilterBar from './SuperAdminLessonAuditFilterBar';
import BatchAiFixModal from './BatchAiFixModal';
import { ToastProvider } from '../../context/ToastContext';

describe('BatchAiFixModal & SuperAdminLessonAuditFilterBar (Item 4 - Fila Automática de IA 1 a 1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.setItem('auth_token', 'fake-superadmin-token');
  });

  const sampleAiPendingItems = [
    {
      mod: { id: 10, title: 'Módulo 1 - Fundamentos' },
      lesson: { id: 101, title: 'vid_raw_01.mp4', description: '' },
      audit: { bad_title: true, missing_description: true, missing_chapters: false }
    },
    {
      mod: { id: 10, title: 'Módulo 1 - Fundamentos' },
      lesson: { id: 102, title: 'Aula 02', description: 'Descrição completa e detalhada com mais de 25 caracteres.' },
      audit: { bad_title: true, missing_description: false, missing_chapters: true }
    }
  ];

  it('exibe o botão Corrigir Pendências de IA em Fila na barra Super Admin e abre o modal ao clicar', () => {
    render(
      <ToastProvider>
        <SuperAdminLessonAuditFilterBar
          isSuperAdmin={true}
          courseId={7}
          activeFilter="all"
          onSelectFilter={vi.fn()}
          counts={{
            all: 10,
            unoptimized_video: 0,
            bad_title: 2,
            missing_description: 1,
            missing_chapters: 1,
            missing_thumbnail: 0,
            any_issue: 2
          }}
          filteredFlatLessons={[]}
          unoptimizedItems={[]}
          aiPendingItems={sampleAiPendingItems}
          onRefreshAudit={vi.fn()}
        />
      </ToastProvider>
    );

    const openBtn = screen.getByTestId('superadmin-open-batch-ai-modal-btn');
    expect(openBtn).toBeInTheDocument();
    expect(openBtn).toHaveTextContent('Corrigir Pendências de IA em Fila (2)');

    fireEvent.click(openBtn);
    expect(screen.getByTestId('batch-ai-fix-modal')).toBeInTheDocument();
    expect(screen.getByTestId('batch-ai-item-101')).toBeInTheDocument();
    expect(screen.getByTestId('batch-ai-item-102')).toBeInTheDocument();
  });

  it('permite marcar/desmarcar aulas e executa a fila 1 a 1 de IA (generate-metadata e transcribe + polling)', async () => {
    const onQueueUpdated = vi.fn();

    global.fetch = vi
      .fn()
      // Aula 101 (missing_chapters = false): chama POST generate-metadata direto
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: 'Introdução Prática aos Fundamentos',
          description: 'Nesta aula abordamos os pilares essenciais do método passo a passo.'
        })
      })
      // Aula 102 (missing_chapters = true): 1) POST transcribe
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'processing' })
      })
      // Aula 102: 2) GET transcription (polling -> completed)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'completed',
          lesson_title: 'Dominando a Estrutura Avançada',
          lesson_description: 'Aprenda a configurar toda a estrutura avançada com segurança e clareza.'
        })
      })
      // Aula 102: 3) POST generate-metadata (refinamento porque audit.bad_title era true)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: 'Dominando a Estrutura Avançada na Prática',
          description: 'Aprenda a configurar toda a estrutura avançada com segurança e clareza.'
        })
      });

    render(
      <ToastProvider>
        <BatchAiFixModal
          isOpen={true}
          onClose={vi.fn()}
          courseId={7}
          aiPendingItems={sampleAiPendingItems}
          onQueueUpdated={onQueueUpdated}
          pollIntervalMs={5}
        />
      </ToastProvider>
    );

    // Testa Desmarcar Todas e Marcar Todas
    fireEvent.click(screen.getByTestId('batch-ai-deselect-all-btn'));
    expect(screen.queryByTestId('batch-ai-fix-start-btn')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('batch-ai-select-all-btn'));
    const startBtn = screen.getByTestId('batch-ai-fix-start-btn');
    expect(startBtn).toHaveTextContent('Iniciar Fila de IA (2)');

    // Inicia a fila
    fireEvent.click(startBtn);

    await waitFor(() => {
      expect(onQueueUpdated).toHaveBeenCalledTimes(1);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/courses/7/modules/10/lessons/101/generate-metadata',
      expect.objectContaining({ method: 'POST' })
    );
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/courses/7/modules/10/lessons/102/transcribe',
      expect.objectContaining({ method: 'POST' })
    );

    expect(screen.getByTestId('batch-ai-item-101')).toHaveTextContent('Introdução Prática aos Fundamentos');
    expect(screen.getByTestId('batch-ai-item-101')).toHaveTextContent('Concluído');
    expect(screen.getByTestId('batch-ai-item-102')).toHaveTextContent('Dominando a Estrutura Avançada na Prática');
    expect(screen.getByTestId('batch-ai-item-102')).toHaveTextContent('Concluído');
  });
});
