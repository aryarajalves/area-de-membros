import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TutorSaveNoteModal from './TutorSaveNoteModal';
import { ToastProvider } from '../../context/ToastContext';

describe('TutorSaveNoteModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'test-jwt-token');
  });

  const renderWithToast = (ui) => render(<ToastProvider>{ui}</ToastProvider>);

  it('does not render when isOpen is false', () => {
    renderWithToast(
      <TutorSaveNoteModal
        isOpen={false}
        initialContent="Explicação do Tutor"
        courseId={1}
        lessonId={10}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('tutor-save-note-modal')).not.toBeInTheDocument();
  });

  it('renders modal with preloaded content and allows editing text', () => {
    renderWithToast(
      <TutorSaveNoteModal
        isOpen={true}
        initialContent="O Sol na Casa 2 representa valorização e recursos materiais."
        courseId={1}
        lessonId={10}
        lessonTitle="Aula 02 - Sol na Casa 2"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('tutor-save-note-modal')).toBeInTheDocument();
    expect(screen.getByText('Salvar nas Minhas Anotações')).toBeInTheDocument();
    expect(screen.getByText(/Aula vinculada: Aula 02 - Sol na Casa 2/i)).toBeInTheDocument();

    const textarea = screen.getByTestId('input-edit-note-content');
    expect(textarea.value).toBe('O Sol na Casa 2 representa valorização e recursos materiais.');

    // Aluno edita e adiciona suas próprias palavras
    fireEvent.change(textarea, {
      target: { value: 'Minha observação: rever minuto 03:10 sobre finanças.' }
    });
    expect(textarea.value).toBe('Minha observação: rever minuto 03:10 sobre finanças.');
  });

  it('calls onClose when cancel button is clicked without saving', () => {
    const handleClose = vi.fn();
    renderWithToast(
      <TutorSaveNoteModal
        isOpen={true}
        initialContent="Texto para cancelar"
        courseId={1}
        lessonId={10}
        onClose={handleClose}
      />
    );

    const cancelBtn = screen.getByTestId('btn-cancel-save-note');
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('sends edited note to backend API and dispatches custom event on success', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 55,
          lesson_id: 10,
          user_id: 1,
          content: 'Texto salvo pelo aluno após edição.',
          created_at: new Date().toISOString()
        })
    });

    renderWithToast(
      <TutorSaveNoteModal
        isOpen={true}
        initialContent="Texto original da IA"
        courseId={1}
        lessonId={10}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const textarea = screen.getByTestId('input-edit-note-content');
    fireEvent.change(textarea, { target: { value: 'Texto salvo pelo aluno após edição.' } });

    const confirmBtn = screen.getByTestId('btn-confirm-save-note');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/lessons/10/notes',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-jwt-token'
          }),
          body: JSON.stringify({ content: 'Texto salvo pelo aluno após edição.' })
        })
      );
    });

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'lesson-note-created',
          detail: expect.objectContaining({ lessonId: 10 })
        })
      );
      expect(handleSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ id: 55, content: 'Texto salvo pelo aluno após edição.' })
      );
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error feedback when API call fails', async () => {
    const handleClose = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ detail: 'Erro ao gravar anotação no banco de dados.' })
    });

    renderWithToast(
      <TutorSaveNoteModal
        isOpen={true}
        initialContent="Texto que vai falhar"
        courseId={1}
        lessonId={10}
        onClose={handleClose}
      />
    );

    const confirmBtn = screen.getByTestId('btn-confirm-save-note');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    // O modal não deve fechar se houver erro
    expect(handleClose).not.toHaveBeenCalled();
  });
});
