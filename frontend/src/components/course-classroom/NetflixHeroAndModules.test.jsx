import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NetflixHeroAndModules from './NetflixHeroAndModules';

describe('NetflixHeroAndModules Component', () => {
  const mockCourse = {
    id: 1,
    title: 'Mentoria Netflix Dark',
    description: 'Aprenda com experiência cinemática.',
    bg_color: '#090d16',
    cover_image_url: 'https://b2.com/hero.jpg',
    thumbnail_url: 'https://b2.com/thumb.jpg'
  };

  const mockModules = [
    {
      id: 10,
      title: 'Boas-Vindas',
      image_url: 'https://b2.com/mod1.jpg',
      lessons: [
        { id: 100, title: 'Aula 1', duration: '10:00', thumbnail_url: 'https://b2.com/aula1.jpg' },
        { id: 101, title: 'Aula 2', duration: '15:00' }
      ]
    },
    {
      id: 20,
      title: 'Estratégia Avançada',
      image_url: '',
      lessons: [
        { id: 200, title: 'Aula 3', duration: '20:00' }
      ]
    }
  ];

  it('renders hero banner, progress percentage, and module poster cards', () => {
    const onSelectModule = vi.fn();
    render(
      <NetflixHeroAndModules
        course={mockCourse}
        modules={mockModules}
        selectedModuleId={10}
        activeLesson={mockModules[0].lessons[0]}
        completedLessonIds={[100]}
        isManager={true}
        bgColor="#090d16"
        onSelectModule={onSelectModule}
        onStartCourse={vi.fn()}
        onOpenEditModule={vi.fn()}
        onPromptDeleteModule={vi.fn()}
        onOpenCreateLesson={vi.fn()}
      />
    );

    expect(screen.getByTestId('netflix-hero-banner')).toBeInTheDocument();
    expect(screen.getByText('Mentoria Netflix Dark')).toBeInTheDocument();
    expect(screen.getByText('Continuar Assistindo')).toBeInTheDocument();
    expect(screen.getByText('33% concluído')).toBeInTheDocument();

    // Verifica cards dos módulos
    expect(screen.getByTestId('netflix-module-card-10')).toBeInTheDocument();
    expect(screen.getByTestId('netflix-module-card-20')).toBeInTheDocument();
    expect(screen.getByText('MÓDULO 1')).toBeInTheDocument();
    expect(screen.getByText('MÓDULO 2')).toBeInTheDocument();

    // Ambos os módulos possuem imagem de pôster (módulo 10 direta, módulo 20 fallback do curso)
    expect(screen.getByTestId('module-ambient-glow-10')).toBeInTheDocument();
    expect(screen.getByTestId('module-poster-image-10')).toBeInTheDocument();
    expect(screen.getByTestId('module-ambient-glow-20')).toBeInTheDocument();
    expect(screen.getByTestId('module-poster-image-20')).toBeInTheDocument();

    // Clicar no card do módulo 2 chama onSelectModule com o módulo 2
    fireEvent.click(screen.getByTestId('netflix-module-card-20'));
    expect(onSelectModule).toHaveBeenCalledWith(mockModules[1]);
  });

  it('permite arrastar horizontalmente com o mouse (drag-to-scroll) e não dispara seleção ao arrastar', () => {
    const onSelectModule = vi.fn();
    render(
      <NetflixHeroAndModules
        course={mockCourse}
        modules={mockModules}
        selectedModuleId={10}
        activeLesson={mockModules[0].lessons[0]}
        completedLessonIds={[]}
        isManager={false}
        bgColor="#090d16"
        onSelectModule={onSelectModule}
        onStartCourse={vi.fn()}
      />
    );

    const carousel = screen.getByTestId('netflix-modules-carousel');
    expect(carousel).toBeInTheDocument();

    // Em JSDOM, scrollLeft precisa de getter/setter mockado
    let currentScroll = 0;
    Object.defineProperty(carousel, 'scrollLeft', {
      get: () => currentScroll,
      set: (val) => { currentScroll = val; },
      configurable: true
    });
    Object.defineProperty(carousel, 'offsetLeft', { value: 10, writable: true, configurable: true });

    // Simula MouseDown
    fireEvent.mouseDown(carousel, { clientX: 100, pageX: 100 });
    expect(carousel.style.cursor).toBe('grabbing');

    // Simula arrastar para a esquerda (mouse move para menor pageX)
    fireEvent.mouseMove(carousel, { clientX: 50, pageX: 50 });
    // Distância = (50 - 10) - (100 - 10) = 40 - 90 = -50
    // carousel.scrollLeft = 0 - (-50) = 50
    expect(carousel.scrollLeft).toBe(50);

    // Tentar clicar no card enquanto/depois de arrastar não deve disparar seleção
    const card = screen.getByTestId('netflix-module-card-20');
    fireEvent.click(card);
    expect(onSelectModule).not.toHaveBeenCalled();

    // Simula soltar o mouse (mouseUp)
    fireEvent.mouseUp(carousel);
    expect(carousel.style.cursor).toBe('grab');
  });

  it('permite arrastar para a direita no carrossel', () => {
    render(
      <NetflixHeroAndModules
        course={mockCourse}
        modules={mockModules}
        selectedModuleId={10}
        activeLesson={mockModules[0].lessons[0]}
        completedLessonIds={[]}
        isManager={false}
        bgColor="#090d16"
        onSelectModule={vi.fn()}
        onStartCourse={vi.fn()}
      />
    );

    const carousel = screen.getByTestId('netflix-modules-carousel');
    let currentScroll = 100;
    Object.defineProperty(carousel, 'scrollLeft', {
      get: () => currentScroll,
      set: (val) => { currentScroll = val; },
      configurable: true
    });
    Object.defineProperty(carousel, 'offsetLeft', { value: 0, writable: true, configurable: true });

    // Pressiona o mouse em x=100
    fireEvent.mouseDown(carousel, { clientX: 100, pageX: 100 });
    // Arrasta para a direita (x=160)
    fireEvent.mouseMove(carousel, { clientX: 160, pageX: 160 });
    // Distância = 160 - 100 = 60 => scrollLeft = 100 - 60 = 40
    expect(carousel.scrollLeft).toBe(40);

    // Mouse leave finaliza o estado de drag
    fireEvent.mouseLeave(carousel);
    expect(carousel.style.cursor).toBe('grab');
  });

  it('exibe texto completo sem botão "Ler mais" quando a descrição tiver até 180 caracteres', () => {
    const shortCourse = {
      ...mockCourse,
      description: 'Uma descrição objetiva e curta com menos de 180 caracteres.'
    };

    render(
      <NetflixHeroAndModules
        course={shortCourse}
        modules={mockModules}
        selectedModuleId={10}
        activeLesson={mockModules[0].lessons[0]}
        completedLessonIds={[]}
        isManager={false}
        bgColor="#090d16"
        onSelectModule={vi.fn()}
        onStartCourse={vi.fn()}
      />
    );

    expect(screen.getByText('Uma descrição objetiva e curta com menos de 180 caracteres.')).toBeInTheDocument();
    expect(screen.queryByTestId('course-hero-read-more-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('course-description-modal')).not.toBeInTheDocument();
  });

  it('trunca a descrição e exibe botão "Ler mais" quando a descrição tiver mais de 180 caracteres, abrindo modal ao clicar', () => {
    const longDesc = 'A'.repeat(250) + ' ' + 'Descrição completa ultra longa com muitos detalhes astrológicos para o aluno.';
    const longCourse = {
      ...mockCourse,
      description: longDesc
    };

    render(
      <NetflixHeroAndModules
        course={longCourse}
        modules={mockModules}
        selectedModuleId={10}
        activeLesson={mockModules[0].lessons[0]}
        completedLessonIds={[]}
        isManager={false}
        bgColor="#090d16"
        onSelectModule={vi.fn()}
        onStartCourse={vi.fn()}
      />
    );

    // O botão "Ler mais" deve estar visível
    const readMoreBtn = screen.getByTestId('course-hero-read-more-btn');
    expect(readMoreBtn).toBeInTheDocument();
    expect(readMoreBtn).toHaveTextContent('Ler mais');

    // Inicialmente, o modal não está aberto
    expect(screen.queryByTestId('course-description-modal')).not.toBeInTheDocument();

    // Clica no botão "Ler mais"
    fireEvent.click(readMoreBtn);

    // O modal deve ser exibido
    const modal = screen.getByTestId('course-description-modal');
    expect(modal).toBeInTheDocument();
    expect(screen.getByTestId('course-description-modal-title')).toHaveTextContent(mockCourse.title);

    // Clica no botão "Fechar" do modal para fechar
    const closeBtn = screen.getByTestId('confirm-close-course-description-modal-btn');
    fireEvent.click(closeBtn);

    // O modal deve ser fechado
    expect(screen.queryByTestId('course-description-modal')).not.toBeInTheDocument();
  });
});

