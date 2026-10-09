import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonAiGenerateButton from './LessonAiGenerateButton';

const mockAddToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast
  })
}));

describe('LessonAiGenerateButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'fake-test-token');
  });

  it('does not render when required ids are missing', () => {
    const { container } = render(
      <LessonAiGenerateButton
        courseId={null}
        moduleId={1}
        lessonId={10}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders trigger button correctly', () => {
    render(
      <LessonAiGenerateButton
        courseId={1}
        moduleId={2}
        lessonId={10}
      />
    );

    const btn = screen.getByTestId('btn-generate-lesson-ai-metadata');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Gerar com IA');
  });

  it('opens confirmation modal on click and closes on cancel', () => {
    render(
      <LessonAiGenerateButton
        courseId={1}
        moduleId={2}
        lessonId={10}
      />
    );

    fireEvent.click(screen.getByTestId('btn-generate-lesson-ai-metadata'));

    expect(screen.getByTestId('confirm-generate-ai-metadata-modal')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-generate-ai-metadata-title')).toHaveTextContent('Gerar Título e Descrição com IA?');

    fireEvent.click(screen.getByTestId('cancel-generate-ai-metadata-btn'));
    expect(screen.queryByTestId('confirm-generate-ai-metadata-modal')).not.toBeInTheDocument();
  });

  it('executes generate metadata and invokes onSuccess callback on confirmation', async () => {
    const mockOnSuccess = vi.fn();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 10,
        title: 'Novo Título Gerado por IA',
        description: 'Nova descrição pedagógica completa gerada a partir da transcrição.',
        duration: '15:20',
        module_id: 2
      })
    });

    render(
      <LessonAiGenerateButton
        courseId={1}
        moduleId={2}
        lessonId={10}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByTestId('btn-generate-lesson-ai-metadata'));
    fireEvent.click(screen.getByTestId('confirm-generate-ai-metadata-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/modules/2/lessons/10/generate-metadata',
        expect.objectContaining({ method: 'POST' })
      );
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith({
        title: 'Novo Título Gerado por IA',
        description: 'Nova descrição pedagógica completa gerada a partir da transcrição.'
      });
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.stringContaining('Título e descrição da aula gerados com sucesso'),
        'success'
      );
      expect(screen.queryByTestId('confirm-generate-ai-metadata-modal')).not.toBeInTheDocument();
    });
  });

  it('displays error toast when backend rejects generation due to missing transcription', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        detail: 'A aula ainda não possui uma transcrição concluída.'
      })
    });

    render(
      <LessonAiGenerateButton
        courseId={1}
        moduleId={2}
        lessonId={10}
      />
    );

    fireEvent.click(screen.getByTestId('btn-generate-lesson-ai-metadata'));
    fireEvent.click(screen.getByTestId('confirm-generate-ai-metadata-btn'));

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith(
        'A aula ainda não possui uma transcrição concluída.',
        'error'
      );
    });
  });
});
