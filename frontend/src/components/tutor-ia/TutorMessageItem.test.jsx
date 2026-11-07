import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorMessageItem from './TutorMessageItem';

describe('TutorMessageItem Component', () => {
  it('renders user message correctly', () => {
    const userMsg = {
      id: 1,
      role: 'user',
      content: 'Qual o significado de Saturno na Casa 2?'
    };

    render(<TutorMessageItem message={userMsg} />);
    expect(screen.getByText('Qual o significado de Saturno na Casa 2?')).toBeInTheDocument();
    expect(screen.getByTestId('tutor-message-1')).toBeInTheDocument();
  });

  it('renders assistant message with custom tutorName and clickable timestamp button', () => {
    const onSeekTime = vi.fn();
    const assistantMsg = {
      id: 2,
      role: 'assistant',
      content: 'O professor fala sobre isso aos 02:15 do vídeo de forma aprofundada.'
    };

    render(
      <TutorMessageItem
        message={assistantMsg}
        tutorName="Sofia - Tutora IA"
        onSeekTime={onSeekTime}
      />
    );
    expect(screen.getByText('Sofia - Tutora IA')).toBeInTheDocument();
    expect(screen.getByText('02:15')).toBeInTheDocument();

    const seekBtn = screen.getByTestId('btn-seek-timestamp-02:15');
    fireEvent.click(seekBtn);

    // 02:15 = 2*60 + 15 = 135 segundos
    expect(onSeekTime).toHaveBeenCalledWith(135);
  });

  it('renders related lessons recommendations and triggers selection', () => {
    const onSelectRelatedLesson = vi.fn();
    const assistantMsg = {
      id: 3,
      role: 'assistant',
      content: 'Veja também em outras aulas.',
      related_lessons: [
        {
          lesson_id: 10,
          lesson_title: 'Fundamentos dos Signos',
          course_title: 'Bússola Astrológica',
          module_id: 2
        }
      ]
    };

    render(
      <TutorMessageItem
        message={assistantMsg}
        onSelectRelatedLesson={onSelectRelatedLesson}
      />
    );

    expect(screen.getByTestId('tutor-related-lessons-box')).toBeInTheDocument();
    const lessonBtn = screen.getByText(/Fundamentos dos Signos/i);
    fireEvent.click(lessonBtn);

    expect(onSelectRelatedLesson).toHaveBeenCalledWith(
      expect.objectContaining({ lesson_id: 10 })
    );
  });

  it('renders like and dislike feedback buttons and triggers respective callbacks', () => {
    const handleFeedback = vi.fn();
    const handleDislikeFeedback = vi.fn();
    const assistantMsg = {
      id: 99,
      role: 'assistant',
      content: 'Resposta para avaliar.',
      feedback_rating: 'dislike',
      feedback_text: 'O minuto citado estava incorreto.'
    };

    render(
      <TutorMessageItem
        message={assistantMsg}
        onFeedback={handleFeedback}
        onRequestDislikeFeedback={handleDislikeFeedback}
      />
    );

    expect(screen.getByTestId('tutor-feedback-text-indicator')).toBeInTheDocument();
    expect(screen.getByText(/O minuto citado estava incorreto/i)).toBeInTheDocument();

    const likeBtn = screen.getByTestId('btn-feedback-like');
    fireEvent.click(likeBtn);
    expect(handleFeedback).toHaveBeenCalledWith({ messageId: 99, rating: 'like' });

    const dislikeBtn = screen.getByTestId('btn-feedback-dislike');
    fireEvent.click(dislikeBtn);
    expect(handleDislikeFeedback).toHaveBeenCalledWith(assistantMsg);
  });

  it('renders save to notes button and triggers callback with message data', () => {
    const handleSaveNote = vi.fn();
    const assistantMsg = {
      id: 101,
      role: 'assistant',
      content: 'Explicação detalhada sobre a rotação planetária.'
    };

    render(
      <TutorMessageItem
        message={assistantMsg}
        onSaveToNotes={handleSaveNote}
      />
    );

    const saveNoteBtn = screen.getByTestId('btn-save-note-from-message');
    expect(saveNoteBtn).toBeInTheDocument();
    expect(screen.getByText('Salvar Anotação')).toBeInTheDocument();

    fireEvent.click(saveNoteBtn);
    expect(handleSaveNote).toHaveBeenCalledWith(assistantMsg);
  });
});
