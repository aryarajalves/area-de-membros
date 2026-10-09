import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonOverviewTab from './LessonOverviewTab';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../context/ToastContext', () => ({
  ToastProvider: ({ children }) => <div>{children}</div>,
  useToast: () => ({
    addToast: vi.fn()
  })
}));

describe('LessonOverviewTab Component', () => {
  const mockLesson = {
    id: 10,
    title: 'Aula Inicial',
    description: 'Descrição detalhada da aula sobre fundamentos.',
    module_id: 2
  };

  const mockOnLessonUpdated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test_token');
    global.fetch = vi.fn();
  });

  it('renderiza descrição existente da aula', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'not_started', full_transcript: '' })
    });

    render(
      <LessonOverviewTab
        lesson={mockLesson}
        courseId={1}
        moduleId={2}
        currentDescription={mockLesson.description}
        isManager={false}
        onLessonUpdated={mockOnLessonUpdated}
      />
    );

    expect(screen.getByText('Descrição da Aula')).toBeInTheDocument();
    expect(screen.getByText('Descrição detalhada da aula sobre fundamentos.')).toBeInTheDocument();
  });

  it('exibe mensagem quando não há descrição e usuário é aluno (não gestor)', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'not_started', full_transcript: '' })
    });

    render(
      <LessonOverviewTab
        lesson={mockLesson}
        courseId={1}
        moduleId={2}
        currentDescription=""
        isManager={false}
        onLessonUpdated={mockOnLessonUpdated}
      />
    );

    expect(screen.getByText('Esta aula não possui descrição textual adicional.')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-generate-lesson-metadata')).not.toBeInTheDocument();
  });

  it('exibe botão de gerar título e descrição quando há transcrição e usuário é gestor', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'completed',
        full_transcript: 'Transcrição longa com bastante texto pedagógico sobre o curso.'
      })
    });

    render(
      <LessonOverviewTab
        lesson={mockLesson}
        courseId={1}
        moduleId={2}
        currentDescription=""
        isManager={true}
        onLessonUpdated={mockOnLessonUpdated}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('btn-generate-lesson-metadata')).toBeInTheDocument();
    });

    expect(screen.getByText('Gerar Título e Descrição com IA')).toBeInTheDocument();
    expect(screen.getByText(/A transcrição desta aula já foi gerada/i)).toBeInTheDocument();
  });

  it('abre popup de confirmação ao clicar em gerar com IA e só dispara requisição após confirmação', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'completed',
          full_transcript: 'Texto completo da transcrição da aula.'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 10,
          title: 'Novo Título Gerado por IA',
          description: 'Nova descrição didática gerada pela IA.'
        })
      });

    render(
      <LessonOverviewTab
        lesson={mockLesson}
        courseId={1}
        moduleId={2}
        currentDescription=""
        isManager={true}
        onLessonUpdated={mockOnLessonUpdated}
      />
    );

    const btn = await screen.findByTestId('btn-generate-lesson-metadata');
    fireEvent.click(btn);

    // Modal de confirmação deve aparecer
    expect(screen.getByTestId('confirm-generate-ai-metadata-modal')).toBeInTheDocument();
    expect(screen.getByText('Gerar Título e Descrição com IA?')).toBeInTheDocument();

    // Clica no botão de confirmar no popup
    const confirmBtn = screen.getByTestId('confirm-generate-ai-metadata-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockOnLessonUpdated).toHaveBeenCalledWith({
        id: 10,
        title: 'Novo Título Gerado por IA',
        description: 'Nova descrição didática gerada pela IA.'
      });
    });
  });

  it('permite cancelar a ação pelo popup de confirmação sem disparar requisição', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'completed',
        full_transcript: 'Texto completo da transcrição da aula.'
      })
    });

    render(
      <LessonOverviewTab
        lesson={mockLesson}
        courseId={1}
        moduleId={2}
        currentDescription=""
        isManager={true}
        onLessonUpdated={mockOnLessonUpdated}
      />
    );

    const btn = await screen.findByTestId('btn-generate-lesson-metadata');
    fireEvent.click(btn);

    expect(screen.getByTestId('confirm-generate-ai-metadata-modal')).toBeInTheDocument();

    const cancelBtn = screen.getByTestId('cancel-generate-ai-metadata-btn');
    fireEvent.click(cancelBtn);

    expect(screen.queryByTestId('confirm-generate-ai-metadata-modal')).not.toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledTimes(1); // Apenas a checagem inicial de transcrição
    expect(mockOnLessonUpdated).not.toHaveBeenCalled();
  });
});
