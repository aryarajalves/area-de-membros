import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BatchMindmapModal from './BatchMindmapModal';
import { ToastProvider } from '../../context/ToastContext';

describe('BatchMindmapModal Component', () => {
  const mockOverview = {
    course_id: 1,
    course_title: 'Curso de Astrologia',
    total_lessons: 10,
    lessons_with_transcription: 8,
    lessons_with_mindmap: 2,
    lessons_pending_mindmap: 6,
    modules: [
      {
        id: 101,
        title: 'Módulo 1 - Fundamentos',
        total_lessons: 5,
        lessons_with_transcription: 5,
        lessons_with_mindmap: 2
      },
      {
        id: 102,
        title: 'Módulo 2 - Trânsitos',
        total_lessons: 5,
        lessons_with_transcription: 3,
        lessons_with_mindmap: 0
      }
    ]
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'test_jwt_token');
    vi.restoreAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <ToastProvider>
        <BatchMindmapModal isOpen={false} courseId={1} onClose={vi.fn()} />
      </ToastProvider>
    );
    expect(screen.queryByTestId('batch-mindmap-modal')).not.toBeInTheDocument();
  });

  it('renders modal, fetches overview, and displays metrics', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOverview
    });

    render(
      <ToastProvider>
        <BatchMindmapModal isOpen={true} courseId={1} onClose={vi.fn()} />
      </ToastProvider>
    );

    expect(screen.getByTestId('batch-mindmap-modal')).toBeInTheDocument();
    expect(screen.getByText('Gerador de Mapas Mentais (IA)')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // total
      expect(screen.getByText('8')).toBeInTheDocument(); // transcritas
      expect(screen.getByText('2')).toBeInTheDocument(); // com mapa
    });
  });

  it('allows changing scope between course and specific module', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOverview
    });

    render(
      <ToastProvider>
        <BatchMindmapModal isOpen={true} courseId={1} onClose={vi.fn()} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    const select = screen.getByTestId('scope-select');
    fireEvent.change(select, { target: { value: '101' } });

    // Modulo 101 has 5 total e 5 transcritas
    const matchingFives = screen.getAllByText('5');
    expect(matchingFives.length).toBeGreaterThanOrEqual(1);
  });

  it('executes batch generation when clicking Iniciar Geração com IA', async () => {
    const onSuccess = vi.fn();
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.includes('/mindmaps/overview')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockOverview
        });
      }
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            message: 'Processamento concluído: 6 gerados com sucesso!',
            total_processed: 8,
            total_created: 6,
            total_skipped: 2,
            total_failed: 0,
            results: []
          })
        });
      }
      return Promise.reject(new Error('Unknown url: ' + url));
    });

    render(
      <ToastProvider>
        <BatchMindmapModal isOpen={true} courseId={1} onClose={vi.fn()} onSuccess={onSuccess} />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    const startBtn = screen.getByTestId('start-batch-mindmap-btn');
    fireEvent.click(startBtn);

    await waitFor(() => {
      const resultBox = screen.getByTestId('batch-result-box');
      expect(resultBox).toBeInTheDocument();
      expect(within(resultBox).getByText('Processamento Concluído')).toBeInTheDocument();
      expect(within(resultBox).getByText('6')).toBeInTheDocument();
      expect(within(resultBox).getByText(/novo\(s\) mapa\(s\) gerado\(s\)/i)).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('calls onClose when close buttons are clicked', () => {
    const onClose = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockOverview
    });

    render(
      <ToastProvider>
        <BatchMindmapModal isOpen={true} courseId={1} onClose={onClose} />
      </ToastProvider>
    );

    const closeBtn = screen.getByTestId('close-batch-mindmap-modal-btn');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    const cancelBtn = screen.getByTestId('cancel-batch-mindmap-btn');
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
