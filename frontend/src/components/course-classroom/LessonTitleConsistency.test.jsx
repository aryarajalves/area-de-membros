import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonPlayer from './LessonPlayer';

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() })
}));

vi.mock('./CustomVideoPlayer', () => ({
  default: () => <div data-testid="mock-video-player" />
}));

vi.mock('./LessonActionToolbar', () => ({
  default: () => <div data-testid="mock-action-toolbar" />
}));

describe('Lesson Title Consistency in LessonPlayer', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
  });

  it('exibe sempre lesson.title na tela da aula para aulas com vídeo único em português', () => {
    const singleVideoLesson = {
      id: 39,
      title: 'Desvendando os Trânsitos Astrológicos na Prática',
      description: 'Nesta aula introdutória...',
      video_type: 'upload',
      video_url: 'https://b2.com/video.mp4',
      videos: [
        {
          id: 55,
          language: 'pt',
          language_label: 'Português',
          title: 'Aula 1', // Título antigo gerado do nome do arquivo
          description: '',
          video_url: 'https://b2.com/video.mp4',
          video_type: 'upload'
        }
      ]
    };

    render(
      <LessonPlayer
        lesson={singleVideoLesson}
        moduleTitle="Módulo 01 - Trânsitos Astrológicos e Previsões"
        courseId={1}
        moduleId={4}
        currentUser={{ id: 1, role: 'superadmin' }}
      />
    );

    // O título principal deve ser o título oficial da aula (igual ao da sidebar), não "Aula 1"
    const heading = screen.getByTestId('active-lesson-title');
    expect(heading).toHaveTextContent('Desvendando os Trânsitos Astrológicos na Prática');
    expect(heading).not.toHaveTextContent('Aula 1');
  });

  it('permite título específico por idioma quando há faixas multilíngues (videos.length > 1)', () => {
    const multiLangLesson = {
      id: 40,
      title: 'Trânsitos Planetários: Decifrando Energias',
      description: 'Descrição PT',
      videos: [
        { language: 'pt', language_label: 'Português', title: 'Trânsitos em Português', description: 'PT', video_url: 'https://b2.com/pt.mp4' },
        { language: 'en', language_label: 'Inglês', title: 'Planetary Transits in English', description: 'EN', video_url: 'https://b2.com/en.mp4' }
      ]
    };

    render(
      <LessonPlayer
        lesson={multiLangLesson}
        moduleTitle="Módulo 01"
        courseId={1}
        moduleId={4}
        currentUser={{ id: 1, role: 'aluno' }}
      />
    );

    expect(screen.getByTestId('active-lesson-title')).toHaveTextContent('Trânsitos em Português');

    // Troca para inglês
    fireEvent.click(screen.getByTestId('player-lang-btn-en'));
    expect(screen.getByTestId('active-lesson-title')).toHaveTextContent('Planetary Transits in English');
  });
});
