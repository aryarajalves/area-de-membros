import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModuleTimelineSidebar from './ModuleTimelineSidebar';

describe('Ajuste de Seleção de Módulo vs Aula', () => {
  const sampleModules = [
    {
      id: 1,
      title: 'Módulo 01 - Trânsitos Astrológicos e Previsões',
      lessons: [
        { id: 101, title: 'Desvendando os Trânsitos Astrológicos na Prática', duration: '03:35' },
        { id: 102, title: 'Trânsitos Planetários: Decifrando Energias', duration: '04:11' }
      ]
    },
    {
      id: 2,
      title: 'Módulo 02 - Signos e Casas',
      lessons: [
        { id: 201, title: 'Casas Astrológicas na Prática', duration: '05:00' }
      ]
    }
  ];

  it('no ModuleTimelineSidebar, clicar no módulo apenas expande/recolhe a lista sem acionar onSelectModule nem mudar a aula', () => {
    const onSelectModule = vi.fn();
    const onSelectLesson = vi.fn();

    render(
      <ModuleTimelineSidebar
        courseId={1}
        modules={sampleModules}
        selectedModule={sampleModules[0]}
        activeLesson={sampleModules[0].lessons[0]}
        completedLessonIds={[]}
        totalLessonsCount={3}
        isManager={false}
        onSelectModule={onSelectModule}
        onSelectLesson={onSelectLesson}
      />
    );

    // Clica no cabeçalho do Módulo 2
    const toggleMod2 = screen.getByTestId('module-toggle-btn-2');
    fireEvent.click(toggleMod2);

    // Deve expandir as aulas do Módulo 2
    expect(screen.getByTestId('lesson-title-201')).toHaveTextContent('Casas Astrológicas na Prática');

    // NÃO deve selecionar a aula nem chamar onSelectModule que trocaria a aula
    expect(onSelectModule).not.toHaveBeenCalled();
    expect(onSelectLesson).not.toHaveBeenCalled();

    // Agora o usuário clica expressamente na aula do Módulo 2
    fireEvent.click(screen.getByTestId('lesson-item-201'));
    expect(onSelectLesson).toHaveBeenCalledWith(sampleModules[1].lessons[0]);
  });
});
