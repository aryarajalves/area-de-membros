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

    // Clicar no card do módulo 2 chama onSelectModule com o módulo 2
    fireEvent.click(screen.getByTestId('netflix-module-card-20'));
    expect(onSelectModule).toHaveBeenCalledWith(mockModules[1]);
  });
});
