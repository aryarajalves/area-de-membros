import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ModuleTimelineSidebar from './ModuleTimelineSidebar';
import CustomVideoPlayer from './CustomVideoPlayer';

describe('Item 3 - Auto-Scroll na Sidebar & AutoPlay imediato da próxima aula', () => {
  const sampleModules = [
    {
      id: 1,
      title: 'Módulo 1 - Comece Aqui',
      lessons: [
        { id: 101, title: 'Aula 01', description: 'Intro' }
      ]
    },
    {
      id: 2,
      title: 'Módulo 2 - Avançado',
      lessons: [
        { id: 201, title: 'Aula 02 Avançada', description: 'Conteúdo avançado' }
      ]
    }
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('auto-expande o módulo da aula ativa de forma exclusiva', () => {
    render(
      <ModuleTimelineSidebar
        courseId={1}
        modules={sampleModules}
        selectedModule={sampleModules[0]}
        activeLesson={sampleModules[1].lessons[0]} // Aula 201 do Módulo 2
        completedLessonIds={[]}
        totalLessonsCount={2}
        isManager={false}
      />
    );

    // Módulo 2 deve ter sido auto-expandido e exibido
    expect(screen.getByTestId('lesson-title-201')).toHaveTextContent('Aula 02 Avançada');
  });

  it('ao abrir um modulo fecha qualquer outro modulo que esteja aberto (acordeao exclusivo)', () => {
    render(
      <ModuleTimelineSidebar
        courseId={1}
        modules={sampleModules}
        selectedModule={sampleModules[0]}
        activeLesson={sampleModules[0].lessons[0]}
        completedLessonIds={[]}
        totalLessonsCount={2}
        isManager={false}
      />
    );

    // Inicialmente Módulo 1 está aberto e Módulo 2 fechado
    expect(screen.getByTestId('lesson-title-101')).toHaveTextContent('Aula 01');
    expect(screen.queryByTestId('lesson-title-201')).not.toBeInTheDocument();

    // Clica para abrir o Módulo 2
    const mod2ToggleBtn = screen.getByTestId('module-toggle-btn-2');
    act(() => {
      mod2ToggleBtn.click();
    });

    // Módulo 2 deve estar aberto e Módulo 1 agora deve estar fechado!
    expect(screen.getByTestId('lesson-title-201')).toHaveTextContent('Aula 02 Avançada');
    expect(screen.queryByTestId('lesson-title-101')).not.toBeInTheDocument();
  });

  it('inicia o vídeo com play ativo imediatamente quando autoPlay for true', () => {
    const playMock = vi.fn().mockResolvedValue(undefined);
    window.HTMLMediaElement.prototype.play = playMock;

    render(
      <CustomVideoPlayer
        src="https://example.com/video2.mp4"
        title="Aula 02 Avançada"
        autoPlay={true}
      />
    );

    const videoEl = screen.getByTestId('lesson-html5-video');
    expect(videoEl).toHaveAttribute('autoplay');
  });

  it('respeita a opcao autoplayEnabled=false e nao dispara overlay de contagem regressiva ao termino do video', () => {
    const onPlayNext = vi.fn();
    render(
      <CustomVideoPlayer
        src="https://example.com/video1.mp4"
        title="Aula 01"
        nextLesson={{ id: 2, title: 'Aula 02' }}
        onPlayNextLesson={onPlayNext}
        autoplayEnabled={false}
      />
    );

    const videoEl = screen.getByTestId('lesson-html5-video');
    act(() => {
      videoEl.dispatchEvent(new Event('ended'));
    });

    expect(screen.queryByTestId('autoplay-countdown-label')).not.toBeInTheDocument();
    expect(onPlayNext).not.toHaveBeenCalled();
  });
});
