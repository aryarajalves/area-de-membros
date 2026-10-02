import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonQuizEditor from './LessonQuizEditor';
import LessonQuizViewer from './LessonQuizViewer';
import LessonModal from './LessonModal';

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() })
}));

describe('Lesson Quiz Scoring & Passing Score Percentage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('allows changing passing score percentage and question points in LessonQuizEditor', () => {
    const handlePassingChange = vi.fn();
    const handleQuestionsChange = vi.fn();

    const questions = [
      {
        id: 1,
        question: 'Questão Fácil',
        points: 2,
        options: [
          { id: 11, option_text: 'A', is_correct: true },
          { id: 12, option_text: 'B', is_correct: false }
        ]
      },
      {
        id: 2,
        question: 'Questão Difícil',
        points: 5,
        options: [
          { id: 21, option_text: 'C', is_correct: true },
          { id: 22, option_text: 'D', is_correct: false }
        ]
      }
    ];

    render(
      <LessonQuizEditor
        questions={questions}
        onChangeQuestions={handleQuestionsChange}
        passingScorePct={75}
        onChangePassingScorePct={handlePassingChange}
      />
    );

    // Valida exibição da porcentagem de aprovação atual
    const passingInput = screen.getByTestId('quiz-passing-score-input');
    expect(passingInput).toHaveValue(75);

    // Altera a porcentagem mínima de aprovação para 80%
    fireEvent.change(passingInput, { target: { value: '80' } });
    expect(handlePassingChange).toHaveBeenCalledWith(80);

    // Valida exibição do total de pontos (2 + 5 = 7)
    expect(screen.getByTestId('quiz-total-points-display')).toHaveTextContent('7');

    // Altera os pontos da primeira questão de 2 para 4
    const pointsInput0 = screen.getByTestId('question-points-input-0');
    expect(pointsInput0).toHaveValue(2);
    fireEvent.change(pointsInput0, { target: { value: '4' } });

    expect(handleQuestionsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, points: 4 })
      ])
    );
  });

  it('displays custom passing percentage and question points badges in LessonQuizViewer', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lesson_id: 300,
        passing_score_pct: 85,
        questions: [
          {
            id: 10,
            question: 'Qual a complexidade do quicksort?',
            points: 4,
            options: [
              { id: 101, option_text: 'O(n log n)', is_correct: null },
              { id: 102, option_text: 'O(n^2)', is_correct: null }
            ]
          }
        ],
        last_submission: null
      })
    });

    render(
      <LessonQuizViewer
        lesson={{ id: 300, title: 'Algoritmos e Complexidade', content_type: 'quiz', passing_score_pct: 85 }}
        courseTitle="Ciência da Computação"
        moduleTitle="Módulo 3"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 10, role: 'aluno' }}
      />
    );

    // Valida badge de aprovação com 85%
    expect(screen.getByText('Aprovação com 85%')).toBeInTheDocument();

    // Valida badge de 4 pontos na questão carregada
    expect(await screen.findByTestId('question-points-badge-10')).toHaveTextContent('4 pontos');
  });

  it('submits quiz and shows points earned vs total points in result banner', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          lesson_id: 300,
          passing_score_pct: 80,
          questions: [
            {
              id: 10,
              question: 'Pergunta de teste',
              points: 5,
              options: [{ id: 101, option_text: 'Opção 1' }]
            }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 77,
          lesson_id: 300,
          score: 100,
          total_questions: 1,
          correct_answers: 1,
          total_points: 5,
          earned_points: 5,
          passing_score_pct: 80,
          passed: true
        })
      });

    render(
      <LessonQuizViewer
        lesson={{ id: 300, title: 'Quiz de Teste', content_type: 'quiz' }}
        courseTitle="Curso"
        moduleTitle="Módulo"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 10, role: 'aluno' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Pergunta de teste')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('radio'));
    fireEvent.click(screen.getByTestId('submit-quiz-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('quiz-result-banner')).toBeInTheDocument();
    });

    expect(screen.getByTestId('quiz-result-banner')).toHaveTextContent(/5 de 5 pontos/i);
    expect(screen.getByText(/Parabéns! Você foi Aprovado no Quiz/i)).toBeInTheDocument();
  });

  it('sends passing_score_pct when saving quiz lesson via LessonModal', () => {
    const handleSave = vi.fn();
    render(
      <LessonModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={handleSave}
        moduleTitle="Módulo 1"
        courseId={1}
      />
    );

    // Seleciona quiz
    fireEvent.click(screen.getByTestId('type-quiz-btn'));

    // Digita título
    fireEvent.change(screen.getByTestId('lesson-title-input'), {
      target: { value: 'Quiz com Meta 90%' }
    });

    // Vai para a aba do quiz
    fireEvent.click(screen.getByTestId('lesson-modal-tab-quiz'));

    // Altera a nota mínima para 90%
    const passingInput = screen.getByTestId('quiz-passing-score-input');
    fireEvent.change(passingInput, { target: { value: '90' } });

    // Clica em salvar
    fireEvent.click(screen.getByTestId('save-lesson-btn'));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Quiz com Meta 90%',
        content_type: 'quiz',
        passing_score_pct: 90
      })
    );
  });

  it('switches to notes tab and renders note input immediately without screen flicker', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        lesson_id: 300,
        questions: [{ id: 1, question: 'Pergunta Teste', options: [] }],
        last_submission: null
      })
    });

    render(
      <LessonQuizViewer
        lesson={{ id: 300, title: 'Quiz', content_type: 'quiz' }}
        courseTitle="Curso"
        moduleTitle="Módulo"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 10, role: 'aluno' }}
      />
    );

    // Clica na aba Minhas Anotações
    fireEvent.click(screen.getByTestId('tab-notes-btn'));

    // A aba de anotações renderiza imediatamente o container e textarea sem layout shift/piscada
    expect(screen.getByTestId('lesson-notes-container')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-note-textarea')).toBeInTheDocument();
  });
});
