import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonTextViewer from './LessonTextViewer';
import LessonQuizViewer from './LessonQuizViewer';
import LessonQuizEditor from './LessonQuizEditor';
import LessonModal from './LessonModal';

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() })
}));

import LessonArticleEditor from './LessonArticleEditor';

describe('LessonTextViewer Component', () => {
  const mockTextLesson = {
    id: 101,
    title: 'Guia de Arquitetura Limpa',
    content_type: 'text',
    text_content: 'Este é o conteúdo do artigo detalhado.\n\n![Diagrama de Arquitetura](https://b2.com/diagrama.png)\n\nConclusão do texto.',
    duration: '10 min leitura',
    attachments: [
      { id: 1, title: 'Documento PDF', file_url: 'https://b2.com/guia.pdf', file_type: 'pdf', file_size_bytes: 1024 }
    ]
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/rating')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ user_rating: 4, average_rating: 4.5, total_ratings: 2 })
        });
      }
      if (url.includes('/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ is_completed: true })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  it('renders text lesson header, title, article body, parsed images and action toolbar with report issue', () => {
    render(
      <LessonTextViewer
        lesson={mockTextLesson}
        courseTitle="Curso Avançado"
        moduleTitle="Módulo Teórico"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    expect(screen.getByTestId('text-lesson-title')).toHaveTextContent('Guia de Arquitetura Limpa');
    expect(screen.getByText('Aula de Leitura & Artigo')).toBeInTheDocument();
    expect(screen.getByText('10 min leitura')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-text-body')).toBeInTheDocument();

    // Valida renderização da imagem inline
    const img = screen.getByAltText('Diagrama de Arquitetura');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://b2.com/diagrama.png');

    // Valida presença da barra de ações com botão Relatar Problema e Estrelas
    expect(screen.getByTestId('open-report-issue-btn')).toBeInTheDocument();
    expect(screen.getByTestId('star-rating-container')).toBeInTheDocument();
  });

  it('toggles complete status on button click and calls progress API', async () => {
    const handleToggleComplete = vi.fn();
    render(
      <LessonTextViewer
        lesson={mockTextLesson}
        courseTitle="Curso Avançado"
        moduleTitle="Módulo Teórico"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
        isCompleted={false}
        onToggleComplete={handleToggleComplete}
      />
    );

    const btn = screen.getByTestId('toggle-text-lesson-complete-btn');
    expect(btn).toHaveTextContent('Marcar como Concluída');
    fireEvent.click(btn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/lessons/101/progress',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ is_completed: true })
        })
      );
      expect(handleToggleComplete).toHaveBeenCalledWith(101, true);
    });
  });
});

describe('LessonArticleEditor Component', () => {
  it('renders editor tabs, toolbar with image buttons, and allows inserting image via link and previewing', () => {
    const handleChange = vi.fn();
    render(
      <LessonArticleEditor
        textContent="Texto inicial do artigo"
        onChange={handleChange}
      />
    );

    expect(screen.getByTestId('article-tab-write-btn')).toBeInTheDocument();
    expect(screen.getByTestId('article-tab-preview-btn')).toBeInTheDocument();
    expect(screen.getByTestId('insert-image-upload-btn')).toBeInTheDocument();
    expect(screen.getByTestId('insert-image-url-btn')).toBeInTheDocument();

    // Abre modal de URL de imagem
    fireEvent.click(screen.getByTestId('insert-image-url-btn'));
    expect(screen.getByTestId('url-image-input')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('url-image-input'), {
      target: { value: 'https://cdn.exemplo.com/foto.jpg' }
    });
    fireEvent.change(screen.getByTestId('url-image-alt-input'), {
      target: { value: 'Foto Ilustrativa' }
    });
    fireEvent.click(screen.getByTestId('confirm-url-image-btn'));

    expect(handleChange).toHaveBeenCalledWith(
      expect.stringContaining('![Foto Ilustrativa](https://cdn.exemplo.com/foto.jpg)')
    );

    // Alterna para aba de pré-visualização
    fireEvent.click(screen.getByTestId('article-tab-preview-btn'));
    expect(screen.getByTestId('article-preview-container')).toBeInTheDocument();
  });
});

describe('LessonQuizViewer Component', () => {
  const mockQuizLesson = {
    id: 202,
    title: 'Quiz Avaliativo 1',
    content_type: 'quiz'
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and displays quiz questions and options for student', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        lesson_id: 202,
        questions: [
          {
            id: 10,
            question: 'Qual é a capital da França?',
            options: [
              { id: 101, option_text: 'Paris', is_correct: null },
              { id: 102, option_text: 'Londres', is_correct: null }
            ]
          }
        ],
        last_submission: null
      })
    });

    render(
      <LessonQuizViewer
        lesson={mockQuizLesson}
        courseTitle="Curso Geral"
        moduleTitle="Módulo Quiz"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 5, role: 'aluno' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Qual é a capital da França?')).toBeInTheDocument();
    });

    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Londres')).toBeInTheDocument();
  });

  it('allows answering and submits quiz answers, displaying success banner', async () => {
    global.fetch = vi.fn()
      // 1. GET quiz
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          lesson_id: 202,
          questions: [
            {
              id: 10,
              question: '2 + 2 é igual a quanto?',
              options: [
                { id: 101, option_text: '4' },
                { id: 102, option_text: '5' }
              ]
            }
          ],
          last_submission: null
        })
      })
      // 2. POST submit
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 50,
          lesson_id: 202,
          score: 100,
          total_questions: 1,
          correct_answers: 1,
          passed: true
        })
      });

    render(
      <LessonQuizViewer
        lesson={mockQuizLesson}
        courseTitle="Curso Geral"
        moduleTitle="Módulo Quiz"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 5, role: 'aluno' }}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('2 + 2 é igual a quanto?')).toBeInTheDocument();
    });

    // Clica na opção 4 (id 101)
    const radio = screen.getByRole('radio', { name: /4/i });
    fireEvent.click(radio);
    expect(radio).toBeChecked();

    // Envia o quiz
    const submitBtn = screen.getByTestId('submit-quiz-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('quiz-result-banner')).toBeInTheDocument();
    });

    expect(screen.getByText(/Parabéns! Você foi Aprovado no Quiz/i)).toBeInTheDocument();
  });
});

describe('LessonQuizEditor Component', () => {
  it('allows adding a new question and selecting the correct option', () => {
    const handleChange = vi.fn();
    const initialQuestions = [
      {
        question: 'Pergunta inicial',
        options: [
          { option_text: 'Opção 1', is_correct: true },
          { option_text: 'Opção 2', is_correct: false }
        ]
      }
    ];

    render(
      <LessonQuizEditor
        questions={initialQuestions}
        onChangeQuestions={handleChange}
      />
    );

    expect(screen.getByDisplayValue('Pergunta inicial')).toBeInTheDocument();

    // Adiciona nova pergunta
    const addBtn = screen.getByTestId('add-quiz-question-btn');
    fireEvent.click(addBtn);

    expect(handleChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ question: 'Pergunta inicial' }),
        expect.objectContaining({ question: '' })
      ])
    );
  });
});

describe('LessonModal Component with Lesson Types', () => {
  it('switches between video, text and quiz tabs when lesson type is selected', () => {
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

    // Inicialmente é tipo Vídeo -> deve ter aba 'Vídeos e Idiomas'
    expect(screen.getByTestId('lesson-modal-tab-videos')).toBeInTheDocument();

    // Clica no tipo Texto
    const textTypeBtn = screen.getByTestId('type-text-btn');
    fireEvent.click(textTypeBtn);

    // Deve sumir a aba de vídeos e surgir a aba de texto
    expect(screen.queryByTestId('lesson-modal-tab-videos')).not.toBeInTheDocument();
    expect(screen.getByTestId('lesson-modal-tab-text_body')).toBeInTheDocument();

    // Clica no tipo Quiz
    const quizTypeBtn = screen.getByTestId('type-quiz-btn');
    fireEvent.click(quizTypeBtn);

    // Deve surgir a aba de perguntas do quiz
    expect(screen.getByTestId('lesson-modal-tab-quiz')).toBeInTheDocument();
  });

  it('submits correct payload for text lesson', () => {
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

    // Seleciona tipo texto
    fireEvent.click(screen.getByTestId('type-text-btn'));

    // Preenche título
    fireEvent.change(screen.getByTestId('lesson-title-input'), {
      target: { value: 'Aula Artigo de Boas Práticas' }
    });

    // Vai para aba de texto e preenche
    fireEvent.click(screen.getByTestId('lesson-modal-tab-text_body'));
    fireEvent.change(screen.getByTestId('lesson-text-content-input'), {
      target: { value: 'Conteúdo explicativo da aula' }
    });

    // Salva
    fireEvent.click(screen.getByTestId('save-lesson-btn'));

    expect(handleSave).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Aula Artigo de Boas Práticas',
        content_type: 'text',
        text_content: 'Conteúdo explicativo da aula'
      })
    );
  });

  it('does not fetch quiz for video or text lesson when opened for edit', () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    const mockLesson = {
      id: 99,
      title: 'Aula de Vídeo Normal',
      content_type: 'video',
      video_url: 'https://b2.com/video.mp4'
    };

    render(
      <LessonModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        editingLesson={mockLesson}
        moduleTitle="Módulo 1"
        courseId={1}
      />
    );

    // Não deve disparar fetch para /quiz
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('uses auth_token from localStorage when fetching quiz for editing quiz lesson', async () => {
    localStorage.setItem('auth_token', 'valid_admin_token');
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ questions: [] })
    });

    const mockQuizLesson = {
      id: 77,
      title: 'Quiz de Teste',
      content_type: 'quiz'
    };

    render(
      <LessonModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        editingLesson={mockQuizLesson}
        moduleTitle="Módulo 1"
        courseId={10}
      />
    );

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/v1/courses/10/lessons/77/quiz',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer valid_admin_token'
          })
        })
      );
    });

    fetchSpy.mockRestore();
    localStorage.removeItem('auth_token');
  });
});
