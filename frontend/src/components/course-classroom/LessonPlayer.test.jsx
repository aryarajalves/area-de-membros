import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LessonPlayer from './LessonPlayer';

// Mock do ToastContext
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() })
}));

vi.mock('./CustomVideoPlayer', () => ({
  default: ({ src, poster, title }) => (
    <video
      data-testid="lesson-html5-video"
      src={src}
      poster={poster}
      title={title}
    />
  )
}));

vi.mock('./LessonActionToolbar', () => ({
  default: () => <div data-testid="lesson-action-toolbar" />
}));

describe('LessonPlayer Component', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
  });

  const mockLesson = {
    id: 1,
    title: 'Aula de Teste com Poster',
    description: 'Descrição de teste',
    video_type: 'upload',
    video_url: 'https://b2.com/video.mp4',
    thumbnail_url: 'https://b2.com/lesson-poster.jpg',
    videos: [],
    attachments: []
  };

  it('renders video player with poster attribute when thumbnail_url is present', () => {
    render(
      <LessonPlayer
        lesson={mockLesson}
        moduleTitle="Módulo 1"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    const videoEl = screen.getByTestId('lesson-html5-video');
    expect(videoEl).toBeInTheDocument();
    expect(videoEl).toHaveAttribute('poster', 'https://b2.com/lesson-poster.jpg');
    expect(videoEl).toHaveAttribute('src', 'https://b2.com/video.mp4');
  });

  it('renders lesson details and title', () => {
    render(
      <LessonPlayer
        lesson={mockLesson}
        moduleTitle="Módulo 1"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    expect(screen.getByText('Aula de Teste com Poster')).toBeInTheDocument();
    expect(screen.getByText('Descrição de teste')).toBeInTheDocument();
  });

  it('switches title and description dynamically when student toggles language', () => {
    const multiLangLesson = {
      ...mockLesson,
      title: 'Título Padrão',
      description: 'Descrição Padrão',
      videos: [
        { language: 'pt', language_label: 'Português', title: 'Aula em Português', description: 'Conteúdo em PT', video_url: 'https://b2.com/pt.mp4', video_type: 'upload' },
        { language: 'en', language_label: 'Inglês', title: 'Lesson in English', description: 'Content in EN', video_url: 'https://b2.com/en.mp4', video_type: 'upload' }
      ]
    };

    render(
      <LessonPlayer
        lesson={multiLangLesson}
        moduleTitle="Módulo 1"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    // Inicialmente em Português
    expect(screen.getByTestId('active-lesson-title')).toHaveTextContent('Aula em Português');
    expect(screen.getByTestId('active-lesson-description')).toHaveTextContent('Conteúdo em PT');

    // Trocar para Inglês
    const enBtn = screen.getByTestId('player-lang-btn-en');
    fireEvent.click(enBtn);

    expect(screen.getByTestId('active-lesson-title')).toHaveTextContent('Lesson in English');
    expect(screen.getByTestId('active-lesson-description')).toHaveTextContent('Content in EN');
  });

  it('renders "Minhas Anotações" tab button and allows switching to it', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(
      <LessonPlayer
        lesson={mockLesson}
        moduleTitle="Módulo 1"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    const notesTabBtn = screen.getByTestId('tab-lesson-notes');
    expect(notesTabBtn).toBeInTheDocument();
    expect(notesTabBtn).toHaveTextContent('Minhas Anotações');

    fireEvent.click(notesTabBtn);
    const notesContainer = await screen.findByTestId('lesson-notes-container');
    expect(notesContainer).toBeInTheDocument();
  });

  it('formats numeric duration as "X min" clearly in the duration badge', () => {
    const lessonWithNumericDuration = {
      ...mockLesson,
      duration: '20'
    };

    render(
      <LessonPlayer
        lesson={lessonWithNumericDuration}
        moduleTitle="Módulo 1"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    const durationBadge = screen.getByTestId('lesson-duration-badge');
    expect(durationBadge).toHaveTextContent('20 min');
  });

  it('renders "Não possuímos aulas cadastradas nesse módulo" when module has no lessons', () => {
    const handleOpenCreateLesson = vi.fn();

    render(
      <LessonPlayer
        lesson={null}
        hasLessons={false}
        onOpenCreateLesson={handleOpenCreateLesson}
        moduleTitle="Módulo Vazio"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'admin' }}
      />
    );

    expect(screen.getByText('Não possuímos aulas cadastradas nesse módulo')).toBeInTheDocument();
    expect(screen.getByText(/Ainda não há aulas disponíveis neste módulo/i)).toBeInTheDocument();
    
    // Como é admin, o botão de criar primeira aula deve existir
    const createBtn = screen.getByTestId('btn-create-first-lesson');
    expect(createBtn).toBeInTheDocument();
    fireEvent.click(createBtn);
    expect(handleOpenCreateLesson).toHaveBeenCalledTimes(1);
  });

  it('does not render "Criar primeira aula" button when user is a student', () => {
    render(
      <LessonPlayer
        lesson={null}
        hasLessons={false}
        moduleTitle="Módulo Vazio"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 2, role: 'aluno' }}
      />
    );

    expect(screen.getByText('Não possuímos aulas cadastradas nesse módulo')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-create-first-lesson')).not.toBeInTheDocument();
  });

  it('renders "Selecione uma aula para assistir" when module has lessons but none is selected', () => {
    render(
      <LessonPlayer
        lesson={null}
        hasLessons={true}
        moduleTitle="Módulo 1"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    expect(screen.getByText('Selecione uma aula para assistir')).toBeInTheDocument();
    expect(screen.queryByText('Não possuímos aulas cadastradas nesse módulo')).not.toBeInTheDocument();
  });

  it('keeps tabs container with stable minHeight and preserves visited tabs without unmounting', async () => {
    render(
      <LessonPlayer
        lesson={mockLesson}
        moduleTitle="Módulo 1"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    const tabsContainer = screen.getByTestId('lesson-tabs-content-container');
    expect(tabsContainer).toBeInTheDocument();
    expect(tabsContainer).toHaveStyle({ minHeight: '280px' });

    // Alterna para anotações
    const notesTabBtn = screen.getByTestId('tab-lesson-notes');
    fireEvent.click(notesTabBtn);
    const notesContainer = await screen.findByTestId('lesson-notes-container');
    expect(notesContainer).toBeInTheDocument();

    // Volta para visão geral - anotações continuam no DOM preservadas
    const overviewTabBtn = screen.getByTestId('tab-lesson-overview');
    fireEvent.click(overviewTabBtn);
    expect(notesContainer).toBeInTheDocument();
  });
});

