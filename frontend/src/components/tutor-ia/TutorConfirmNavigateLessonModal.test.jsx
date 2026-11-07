import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TutorConfirmNavigateLessonModal from './TutorConfirmNavigateLessonModal';

describe('TutorConfirmNavigateLessonModal Component', () => {
  const mockLesson = {
    lesson_id: 42,
    lesson_title: 'Sol na Casa 7: Relacionamentos e Parcerias',
    module_id: 3,
    module_title: 'Módulo 02 - O Impacto do Sol',
    course_id: 1,
    course_title: 'Bússola Astrológica'
  };

  it('does not render when isOpen is false or targetLesson is null', () => {
    const { rerender } = render(
      <TutorConfirmNavigateLessonModal
        isOpen={false}
        targetLesson={mockLesson}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByTestId('tutor-confirm-navigate-modal')).not.toBeInTheDocument();

    rerender(
      <TutorConfirmNavigateLessonModal
        isOpen={true}
        targetLesson={null}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByTestId('tutor-confirm-navigate-modal')).not.toBeInTheDocument();
  });

  it('renders modal details (course, module, lesson title) when open', () => {
    render(
      <TutorConfirmNavigateLessonModal
        isOpen={true}
        targetLesson={mockLesson}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByTestId('tutor-confirm-navigate-modal')).toBeInTheDocument();
    expect(screen.getByText('Acessar Aula Recomendada?')).toBeInTheDocument();
    expect(screen.getByText('Bússola Astrológica')).toBeInTheDocument();
    expect(screen.getByText('Módulo 02 - O Impacto do Sol')).toBeInTheDocument();
    expect(screen.getByText('Sol na Casa 7: Relacionamentos e Parcerias')).toBeInTheDocument();
  });

  it('calls onClose when clicking cancel button or header close button', () => {
    const handleClose = vi.fn();
    render(
      <TutorConfirmNavigateLessonModal
        isOpen={true}
        targetLesson={mockLesson}
        onClose={handleClose}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('btn-cancel-navigate-lesson'));
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('btn-close-navigate-modal'));
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('calls onConfirm when clicking confirm button', () => {
    const handleConfirm = vi.fn();
    render(
      <TutorConfirmNavigateLessonModal
        isOpen={true}
        targetLesson={mockLesson}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('btn-confirm-navigate-lesson');
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
