import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonChaptersCard from './LessonChaptersCard';
import EditLessonChaptersModal from './EditLessonChaptersModal';

const mockAddToast = vi.fn();
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast
  })
}));

describe('Lesson Chapters and Editing Functionality', () => {
  const initialChapters = [
    { time: '00:00', seconds: 0, title: 'Introdução ao Conteúdo' },
    { time: '00:10', seconds: 10, title: 'Motivo 1: Foco no Aluno' },
    { time: '01:03', seconds: 63, title: 'Motivo 2: Quemificação' }, // Typo a ser editado
    { time: '02:14', seconds: 134, title: 'Motivo 3: Vitrine Exclusiva' },
    { time: '02:54', seconds: 174, title: 'Conclusão e Chamadas para Ação' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders chapters list and shows "Editar Capítulos" button for managers (admin/superadmin)', () => {
    render(
      <LessonChaptersCard
        chapters={initialChapters}
        borderColor="#334155"
        cardBg="#1e293b"
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        isLightBg={false}
        isManager={true}
        courseId={1}
        moduleId={2}
        lessonId={3}
      />
    );

    expect(screen.getByTestId('ai-chapters-card')).toBeInTheDocument();
    expect(screen.getByText('Capítulos da Aula (Minutagem)')).toBeInTheDocument();
    expect(screen.getByText('5 capítulos')).toBeInTheDocument();
    expect(screen.getByText('Motivo 2: Quemificação')).toBeInTheDocument();

    // Botão de editar presente para admin
    const editBtn = screen.getByTestId('btn-open-edit-chapters-modal');
    expect(editBtn).toBeInTheDocument();
    expect(screen.getByText('Editar Capítulos')).toBeInTheDocument();
  });

  it('does NOT show "Editar Capítulos" button for students (isManager=false)', () => {
    render(
      <LessonChaptersCard
        chapters={initialChapters}
        borderColor="#334155"
        cardBg="#1e293b"
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        isLightBg={false}
        isManager={false}
        courseId={1}
        moduleId={2}
        lessonId={3}
      />
    );

    expect(screen.getByTestId('ai-chapters-card')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-open-edit-chapters-modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Editar Capítulos')).not.toBeInTheDocument();
  });

  it('opens edit modal when manager clicks "Editar Capítulos"', () => {
    render(
      <LessonChaptersCard
        chapters={initialChapters}
        borderColor="#334155"
        cardBg="#1e293b"
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        isLightBg={false}
        isManager={true}
        courseId={1}
        moduleId={2}
        lessonId={3}
      />
    );

    fireEvent.click(screen.getByTestId('btn-open-edit-chapters-modal'));
    expect(screen.getByTestId('edit-chapters-modal-content')).toBeInTheDocument();
    expect(screen.getByText('Editar Capítulos da Aula')).toBeInTheDocument();
  });

  it('allows correcting typos and saving chapters successfully via PUT endpoint', async () => {
    const handleSaveSuccess = vi.fn();
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        chapters: [
          { time: '00:00', seconds: 0, title: 'Introdução ao Conteúdo' },
          { time: '00:10', seconds: 10, title: 'Motivo 1: Foco no Aluno' },
          { time: '01:03', seconds: 63, title: 'Motivo 2: Gamificação' }, // Corrigido
          { time: '02:14', seconds: 134, title: 'Motivo 3: Vitrine Exclusiva' },
          { time: '02:54', seconds: 174, title: 'Conclusão e Chamadas para Ação' }
        ]
      })
    });

    render(
      <EditLessonChaptersModal
        isOpen={true}
        onClose={vi.fn()}
        chapters={initialChapters}
        courseId={10}
        moduleId={20}
        lessonId={30}
        onSaveSuccess={handleSaveSuccess}
        isLightBg={false}
      />
    );

    // Encontra o input do terceiro capítulo (index 2) com erro de escrita
    const titleInput = screen.getByTestId('input-chapter-title-2');
    expect(titleInput.value).toBe('Motivo 2: Quemificação');

    // Altera para a palavra correta: "Gamificação"
    fireEvent.change(titleInput, { target: { value: 'Motivo 2: Gamificação' } });
    expect(titleInput.value).toBe('Motivo 2: Gamificação');

    // Clica em Salvar Alterações
    const saveBtn = screen.getByTestId('btn-save-chapters');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/10/modules/20/lessons/30/transcription/chapters',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: expect.stringContaining('Motivo 2: Gamificação')
        })
      );
    });

    expect(mockAddToast).toHaveBeenCalledWith('Capítulos atualizados com sucesso!', 'success');
    expect(handleSaveSuccess).toHaveBeenCalled();
  });

  it('allows adding and removing chapters in the modal', async () => {
    render(
      <EditLessonChaptersModal
        isOpen={true}
        onClose={vi.fn()}
        chapters={[{ time: '00:00', seconds: 0, title: 'Primeiro' }]}
        courseId={10}
        moduleId={20}
        lessonId={30}
        onSaveSuccess={vi.fn()}
        isLightBg={false}
      />
    );

    expect(screen.getAllByTestId(/chapter-edit-row-/)).toHaveLength(1);

    // Clica em adicionar novo capítulo
    fireEvent.click(screen.getByTestId('btn-add-chapter-row'));
    expect(screen.getAllByTestId(/chapter-edit-row-/)).toHaveLength(2);

    // Remove o capítulo recém-adicionado
    fireEvent.click(screen.getByTestId('btn-remove-chapter-1'));
    expect(screen.getAllByTestId(/chapter-edit-row-/)).toHaveLength(1);
  });

  it('validates that chapter title cannot be empty', async () => {
    render(
      <EditLessonChaptersModal
        isOpen={true}
        onClose={vi.fn()}
        chapters={[{ time: '00:00', seconds: 0, title: 'Primeiro' }]}
        courseId={10}
        moduleId={20}
        lessonId={30}
        onSaveSuccess={vi.fn()}
        isLightBg={false}
      />
    );

    const titleInput = screen.getByTestId('input-chapter-title-0');
    fireEvent.change(titleInput, { target: { value: '   ' } });

    fireEvent.click(screen.getByTestId('btn-save-chapters'));
    expect(mockAddToast).toHaveBeenCalledWith('O título do capítulo #1 não pode estar vazio.', 'error');
  });

  it('dispatches seek event when clicking a chapter in LessonChaptersCard', () => {
    const seekSpy = vi.fn();
    window.addEventListener('video-seek-to', seekSpy);

    render(
      <LessonChaptersCard
        chapters={initialChapters}
        borderColor="#334155"
        cardBg="#1e293b"
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        isLightBg={false}
        isManager={false}
      />
    );

    // Clica no botão de seek do capítulo 2 (01:03 = 63s)
    fireEvent.click(screen.getByTestId('btn-seek-chapter-2'));
    expect(seekSpy).toHaveBeenCalled();
  });
});
