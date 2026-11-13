import { render, screen, fireEvent, act } from '@testing-library/react';
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

  it('não exibe a aba Tutor IA se a transcrição da aula não estiver concluída', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/transcription')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'not_started', full_transcript: '' })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
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

    // O botão da aba Tutor IA não deve existir no DOM
    expect(screen.queryByTestId('tab-lesson-tutor')).not.toBeInTheDocument();
  });

  it('exibe a aba Tutor IA quando a transcrição da aula estiver concluída', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/transcription')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'completed', full_transcript: 'Texto transcrito da aula' })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
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

    // Com status completed, a aba do Tutor IA deve aparecer
    const tutorTab = await screen.findByTestId('tab-lesson-tutor');
    expect(tutorTab).toBeInTheDocument();
    expect(tutorTab).toHaveTextContent('Tutor IA 24h');
  });

  it('reage ao evento lesson-transcription-status-updated exibindo a aba Tutor IA em tempo real', async () => {
    let resolveTranscription;
    const transcriptionPromise = new Promise((resolve) => {
      resolveTranscription = resolve;
    });

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/transcription')) {
        return transcriptionPromise.then(() => ({
          ok: true,
          json: async () => ({ status: 'processing', full_transcript: '' })
        }));
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
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

    // Conclui a primeira busca de transcrição como processing
    await act(async () => {
      resolveTranscription();
    });

    expect(screen.queryByTestId('tab-lesson-tutor')).not.toBeInTheDocument();

    // Dispara evento informando conclusão da transcrição
    await act(async () => {
      window.dispatchEvent(
        new CustomEvent('lesson-transcription-status-updated', {
          detail: { lessonId: mockLesson.id, isCompleted: true, status: 'completed' }
        })
      );
    });

    // A aba do Tutor IA deve aparecer instantaneamente
    const tutorTab = await screen.findByTestId('tab-lesson-tutor');
    expect(tutorTab).toBeInTheDocument();
  });

  it('oculta completamente a aba do Tutor IA para alunos quando isTutorVisible for false (modo Oculto/Privado)', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/transcription')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'completed', full_transcript: 'Transcrição completa' })
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <LessonPlayer
        lesson={mockLesson}
        moduleTitle="Módulo 1"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
        isTutorVisible={false}
      />
    );

    // Mesmo com transcrição completed, se o tutor estiver oculto para aluno, a aba não deve existir
    expect(screen.queryByTestId('tab-lesson-tutor')).not.toBeInTheDocument();
  });

  it('renderiza a barra de partes abaixo do player de vídeo', () => {
    const multiPartLesson = {
      ...mockLesson,
      videos: [
        { id: 1, language: 'pt', language_label: 'Português', title: 'Parte 1', video_url: 'https://b2.com/p1.mp4', video_type: 'upload' },
        { id: 2, language: 'pt', language_label: 'Português', title: 'Parte 2', video_url: 'https://b2.com/p2.mp4', video_type: 'upload' }
      ]
    };

    render(
      <LessonPlayer
        lesson={multiPartLesson}
        moduleTitle="Módulo 1"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    const videoEl = screen.getByTestId('lesson-html5-video');
    const partsBar = screen.getByTestId('lesson-parts-bar');
    // Node.DOCUMENT_POSITION_FOLLOWING (4) significa que partsBar vem depois de videoEl no DOM
    expect(videoEl.compareDocumentPosition(partsBar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('exibe popup de carregamento ao trocar de aula e fecha automaticamente após carregar as informações', async () => {
    vi.useFakeTimers();
    try {
      let resolvePendingFetch;
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise((resolve) => {
          resolvePendingFetch = resolve;
        })
      );

      const { rerender } = render(
        <LessonPlayer
          lesson={mockLesson}
          moduleTitle="Módulo 1"
          courseId={1}
          moduleId={1}
          currentUser={{ id: 1, role: 'aluno' }}
        />
      );

      // No carregamento inicial não exibe o popup de troca de aula
      expect(screen.queryByTestId('lesson-switching-modal')).not.toBeInTheDocument();

      // Troca para a aula 2 enquanto o fetch ainda está pendente
      const nextMockLesson = {
        ...mockLesson,
        id: 2,
        title: 'Aula 02 - Nova Aula'
      };

      const resolvers = [];
      global.fetch = vi.fn().mockImplementation(() =>
        new Promise((resolve) => {
          resolvers.push(() => resolve({ ok: true, json: async () => ({}) }));
        })
      );

      rerender(
        <LessonPlayer
          lesson={nextMockLesson}
          moduleTitle="Módulo 1"
          courseId={1}
          moduleId={1}
          currentUser={{ id: 1, role: 'aluno' }}
        />
      );

      // Popup deve aparecer imediatamente com o título da nova aula
      const modal = screen.getByTestId('lesson-switching-modal');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveTextContent('Aula 02 - Nova Aula');

      // Finaliza todas as requisições pendentes da nova aula e avança o tempo mínimo de exibição
      await act(async () => {
        resolvers.forEach((fn) => fn());
        if (resolvePendingFetch) resolvePendingFetch({ ok: true, json: async () => ({}) });
        await vi.advanceTimersByTimeAsync(500);
      });

      // Popup deve fechar automaticamente após terminar o carregamento
      expect(screen.queryByTestId('lesson-switching-modal')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('não herda a descrição da Parte 1 quando uma nova parte (Parte 2) não possui descrição própria', () => {
    const multiPartLesson = {
      ...mockLesson,
      description: 'Descrição exclusiva da Parte 1',
      videos: [
        { id: 1, language: 'pt', language_label: 'Português', title: 'Parte 1', description: 'Descrição exclusiva da Parte 1', video_url: 'https://b2.com/p1.mp4', video_type: 'upload', is_transcribed: true },
        { id: 2, language: 'pt', language_label: 'Português', title: 'Parte 2', description: '', video_url: 'https://b2.com/p2.mp4', video_type: 'upload', is_transcribed: false }
      ]
    };

    render(
      <LessonPlayer
        lesson={multiPartLesson}
        moduleTitle="Módulo 1"
        courseId={1}
        moduleId={1}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    // Parte 1 exibe sua descrição
    expect(screen.getByTestId('active-lesson-description')).toHaveTextContent('Descrição exclusiva da Parte 1');

    // Clica na Parte 2
    fireEvent.click(screen.getByTestId('lesson-part-btn-1'));

    // Parte 2 não tem descrição e NÃO deve exibir a da Parte 1
    expect(screen.queryByText('Descrição exclusiva da Parte 1')).not.toBeInTheDocument();
  });
});

