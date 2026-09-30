import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseClassroom from './CourseClassroom';
import { ToastProvider } from '../../context/ToastContext';

describe('CourseClassroom Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
  });

  const mockCourseData = {
    id: 1,
    title: 'Curso de Especialização',
    description: 'Aprenda os segredos do mercado.',
    modules: [
      {
        id: 10,
        course_id: 1,
        title: 'Módulo 1: Começando do Zero',
        order_index: 1,
        lessons: [
          {
            id: 101,
            module_id: 10,
            title: 'Aula 01: Boas-vindas',
            description: 'Instruções iniciais do curso.',
            video_type: 'url',
            video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            duration: '05:00',
            order_index: 1
          },
          {
            id: 102,
            module_id: 10,
            title: 'Aula 02: Mindset e Estratégia',
            description: 'Como pensar estrategicamente.',
            video_type: 'upload',
            video_url: '/api/v1/courses/videos/vid_123.mp4',
            duration: '12:00',
            order_index: 2
          }
        ]
      }
    ]
  };

  it('renders course header and modules without bottom lessons initially, showing lessons only when clicking a module', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCourseData,
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'aluno' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Curso de Especialização').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Módulo 1: Começando do Zero').length).toBeGreaterThanOrEqual(1);
    });

    // Antes de clicar no módulo, a seção inferior de aulas não deve aparecer
    expect(screen.queryByTestId('selected-module-section')).not.toBeInTheDocument();

    // Clica no módulo escolhido
    fireEvent.click(screen.getByTestId('netflix-module-card-10'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-module-section')).toBeInTheDocument();
      expect(screen.getAllByText('Aula 01: Boas-vindas').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId('active-lesson-title')).toHaveTextContent('Aula 01: Boas-vindas');
    });
  });

  it('switches active lesson when clicking another lesson in module list', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCourseData,
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'aluno' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('netflix-module-card-10')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('netflix-module-card-10'));

    await waitFor(() => {
      expect(screen.getByTestId('active-lesson-title')).toHaveTextContent('Aula 01: Boas-vindas');
    });

    // Clica na Aula 2
    fireEvent.click(screen.getByTestId('lesson-item-102'));

    await waitFor(() => {
      expect(screen.getByTestId('active-lesson-title')).toHaveTextContent('Aula 02: Mindset e Estratégia');
    });
  });

  it('allows manager to create a new module', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 11, title: 'Módulo 2: Tráfego Avançado', order_index: 2 })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockCourseData,
      });
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'superadmin' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('create-module-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('create-module-btn'));

    expect(screen.getByRole('heading', { name: 'Novo Módulo' })).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('module-title-input'), { target: { value: 'Módulo 2: Tráfego Avançado' } });
    fireEvent.click(screen.getByTestId('save-module-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/courses/1/modules', expect.objectContaining({
        method: 'POST'
      }));
    });
  });

  it('allows manager to create a new lesson with video link or upload', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 103, title: 'Nova Aula Teste', module_id: 10 })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockCourseData,
      });
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'superadmin' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-lesson-btn-10')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-lesson-btn-10'));

    expect(screen.getByText('Nova Aula')).toBeInTheDocument();
    fireEvent.change(screen.getByTestId('lesson-title-input'), { target: { value: 'Aula 03: Escalando Vendas' } });
    fireEvent.click(screen.getByTestId('tab-url-video'));
    fireEvent.change(screen.getByTestId('lesson-video-url-input'), { target: { value: 'https://youtube.com/watch?v=12345678901' } });
    fireEvent.click(screen.getByTestId('save-lesson-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/courses/1/modules/10/lessons', expect.objectContaining({
        method: 'POST'
      }));
    });
  });

  it('opens confirmation popup when manager clicks to delete a module and confirms deletion', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'Excluído com sucesso' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockCourseData,
      });
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'superadmin' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('delete-module-btn-10')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('delete-module-btn-10'));

    expect(screen.getByText(/Excluir Módulo:/)).toBeInTheDocument();
    expect(screen.getByTestId('confirm-delete-btn')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-delete-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/courses/1/modules/10', expect.objectContaining({
        method: 'DELETE'
      }));
    });
  });

  it('renders language selector and switches video when lesson has multiple languages', async () => {
    const courseWithMultiLang = {
      ...mockCourseData,
      modules: [
        {
          id: 10,
          course_id: 1,
          title: 'Módulo Multilíngue',
          order_index: 1,
          lessons: [
            {
              id: 101,
              module_id: 10,
              title: 'Aula Internacional',
              description: 'Aula com vários idiomas',
              duration: '10:00',
              order_index: 1,
              video_type: 'upload',
              video_url: 'https://b2.com/video_pt.mp4',
              videos: [
                { language: 'pt', language_label: 'Português', video_url: 'https://b2.com/video_pt.mp4', video_type: 'upload' },
                { language: 'en', language_label: 'Inglês', video_url: 'https://b2.com/video_en.mp4', video_type: 'upload' }
              ]
            }
          ]
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => courseWithMultiLang,
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'aluno' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('netflix-module-card-10')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('netflix-module-card-10'));

    await waitFor(() => {
      expect(screen.getByTestId('lesson-language-selector')).toBeInTheDocument();
      expect(screen.getByTestId('player-lang-btn-pt')).toBeInTheDocument();
      expect(screen.getByTestId('player-lang-btn-en')).toBeInTheDocument();
    });

    // Clica no botão de Inglês
    fireEvent.click(screen.getByTestId('player-lang-btn-en'));

    // Verifica que o player atualiza para o vídeo em inglês
    await waitFor(() => {
      const videoElement = screen.getByTestId('lesson-player-container').querySelector('video');
      expect(videoElement).toHaveAttribute('src', 'https://b2.com/video_en.mp4');
    });
  });

  it('applies line-through strike-through style to completed lesson title in bottom module lessons', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/progress')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ completed_lesson_ids: [101] })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockCourseData
      });
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'aluno' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('netflix-module-card-10')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('netflix-module-card-10'));

    // Aguarda o carregamento das aulas do módulo escolhido
    await waitFor(() => {
      expect(screen.getByTestId('lesson-completed-icon-101')).toBeInTheDocument();
    });

    const completedLessonTitle = screen.getByTestId('lesson-title-101');
    expect(completedLessonTitle).toHaveStyle({ textDecoration: 'line-through' });

    const uncompletedLessonTitle = screen.getByTestId('lesson-title-102');
    expect(uncompletedLessonTitle).toHaveStyle({ textDecoration: 'none' });
  });

  it('organizes LessonModal into 4 tabs and allows switching between them', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCourseData,
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'superadmin' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-lesson-btn-10')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-lesson-btn-10'));

    expect(screen.getByTestId('lesson-modal-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-modal-tab-info')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-modal-tab-videos')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-modal-tab-thumbnail')).toBeInTheDocument();
    expect(screen.getByTestId('lesson-modal-tab-attachments')).toBeInTheDocument();

    // Por padrão, a aba de Dados Gerais está visível
    expect(screen.getByTestId('lesson-modal-panel-info')).toHaveStyle({ display: 'flex' });
    expect(screen.getByTestId('lesson-modal-panel-videos')).toHaveStyle({ display: 'none' });

    // Alterna para Vídeos e Idiomas
    fireEvent.click(screen.getByTestId('lesson-modal-tab-videos'));
    expect(screen.getByTestId('lesson-modal-panel-info')).toHaveStyle({ display: 'none' });
    expect(screen.getByTestId('lesson-modal-panel-videos')).toHaveStyle({ display: 'block' });

    // Alterna para Capa da Aula
    fireEvent.click(screen.getByTestId('lesson-modal-tab-thumbnail'));
    expect(screen.getByTestId('lesson-modal-panel-thumbnail')).toHaveStyle({ display: 'block' });

    // Alterna para Materiais
    fireEvent.click(screen.getByTestId('lesson-modal-tab-attachments'));
    expect(screen.getByTestId('lesson-modal-panel-attachments')).toHaveStyle({ display: 'block' });
  });

  it('displays Em Breve screen and timeline badge when lesson has no video or is marked coming_soon', async () => {
    const courseWithComingSoon = {
      id: 1,
      title: 'Curso de Especialização',
      modules: [
        {
          id: 10,
          course_id: 1,
          title: 'Módulo 1',
          order_index: 1,
          lessons: [
            {
              id: 201,
              module_id: 10,
              title: 'Aula 01: Em Gravação',
              description: 'Esta aula será liberada em breve.',
              video_url: null,
              videos: [],
              availability_status: 'coming_soon'
            }
          ]
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => courseWithComingSoon,
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'aluno' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('netflix-module-card-10')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('netflix-module-card-10'));

    await waitFor(() => {
      expect(screen.getByTestId('lesson-coming-soon-screen')).toBeInTheDocument();
      expect(screen.getByTestId('lesson-coming-soon-badge-201')).toBeInTheDocument();
      expect(screen.getByTestId('lesson-coming-soon-notice')).toBeInTheDocument();
    });
  });

  it('allows selecting Em Breve status in LessonModal and sends availability_status in payload', async () => {
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 205, title: 'Aula Futura', module_id: 10, availability_status: 'coming_soon' })
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockCourseData,
      });
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'superadmin' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('add-lesson-btn-10')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-lesson-btn-10'));

    fireEvent.change(screen.getByTestId('lesson-title-input'), { target: { value: 'Aula Futura' } });
    fireEvent.click(screen.getByTestId('lesson-status-coming-soon-btn'));
    fireEvent.click(screen.getByTestId('save-lesson-btn'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/modules/10/lessons',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"availability_status":"coming_soon"')
        })
      );
    });
  });
});

