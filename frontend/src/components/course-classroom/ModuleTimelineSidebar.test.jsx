import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModuleTimelineSidebar from './ModuleTimelineSidebar';

const mockModules = [
  {
    id: 1,
    title: 'Módulo 1: Fundamentos',
    lessons: [
      { id: 101, title: 'Introdução ao Curso', duration: 300 },
      { id: 102, title: 'Configuração Inicial', duration: 420 }
    ]
  },
  {
    id: 2,
    title: 'Módulo 2: Avançado',
    lessons: [
      { id: 201, title: 'Estratégia Prática', duration: 600 }
    ]
  }
];

describe('ModuleTimelineSidebar', () => {
  it('renderiza o indicador Meu Progresso e a lista de módulos na timeline', () => {
    render(
      <ModuleTimelineSidebar
        modules={mockModules}
        selectedModule={mockModules[0]}
        activeLesson={mockModules[0].lessons[1]}
        completedLessonIds={[101]}
        totalLessonsCount={3}
        onSelectModule={vi.fn()}
        onSelectLesson={vi.fn()}
      />
    );

    expect(screen.getByTestId('module-timeline-sidebar')).toBeInTheDocument();
    expect(screen.getByText(/Meu Progresso - 33\.3%/i)).toBeInTheDocument();
    expect(screen.getByText(/1 de 3 aulas/i)).toBeInTheDocument();
    expect(screen.getByText('Módulo 1: Fundamentos')).toBeInTheDocument();
    expect(screen.getByText('Módulo 2: Avançado')).toBeInTheDocument();
  });

  it('exibe as aulas numeradas do módulo selecionado e dispara callbacks ao clicar', () => {
    const onSelectModule = vi.fn();
    const onSelectLesson = vi.fn();

    render(
      <ModuleTimelineSidebar
        modules={mockModules}
        selectedModule={mockModules[0]}
        activeLesson={mockModules[0].lessons[0]}
        completedLessonIds={[101]}
        totalLessonsCount={2}
        onSelectModule={onSelectModule}
        onSelectLesson={onSelectLesson}
      />
    );

    // Aulas do módulo 1 estão visíveis
    expect(screen.getByText(/1\. Introdução ao Curso/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Configuração Inicial/i)).toBeInTheDocument();

    // Clicar na aula 102
    fireEvent.click(screen.getByTestId('lesson-item-102'));
    expect(onSelectLesson).toHaveBeenCalledWith(
      expect.objectContaining({ id: 102, title: 'Configuração Inicial' })
    );

    // Clicar no módulo 2
    fireEvent.click(screen.getByText('Módulo 2: Avançado'));
    expect(onSelectModule).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, title: 'Módulo 2: Avançado' })
    );
  });
});
