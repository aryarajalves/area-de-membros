import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import FunnelTriggerLessonModuleConfig from './FunnelTriggerLessonModuleConfig';

describe('FunnelTriggerLessonModuleConfig', () => {
  const defaultCourses = [
    { id: 1, title: 'Curso de JavaScript' },
    { id: 2, title: 'Curso de Python' },
  ];

  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        modules: [
          {
            id: 10,
            title: 'Módulo 1',
            lessons: [{ id: 101, title: 'Aula de Introdução' }],
          },
        ],
      }),
    });
  });

  it('deve renderizar botões de aula e módulo e permitir alternar opções ativas', () => {
    const onUpdateData = vi.fn();
    const data = {
      trigger_event: 'lesson_module_activity',
      active_options: ['lesson'],
      course_id: null,
    };

    render(
      <FunnelTriggerLessonModuleConfig
        nodeId="node_lm1"
        data={data}
        courses={defaultCourses}
        loadingCourses={false}
        onUpdateData={onUpdateData}
      />
    );

    expect(screen.getByText(/Eventos de Conteúdo:/i)).toBeInTheDocument();
    expect(screen.getByTestId('trigger-opt-lesson-btn-node_lm1')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-opt-module-btn-node_lm1')).toBeInTheDocument();

    // Ativar também a opção de módulo
    fireEvent.click(screen.getByTestId('trigger-opt-module-btn-node_lm1'));

    expect(onUpdateData).toHaveBeenCalledWith('node_lm1', expect.objectContaining({
      active_options: ['lesson', 'module'],
    }));
  });

  it('deve exibir indicador de 2 saídas independentes quando aula e módulo estiverem ativos', () => {
    const onUpdateData = vi.fn();
    const data = {
      trigger_event: 'lesson_module_activity',
      active_options: ['lesson', 'module'],
      course_id: 1,
    };

    render(
      <FunnelTriggerLessonModuleConfig
        nodeId="node_lm2"
        data={data}
        courses={defaultCourses}
        loadingCourses={false}
        onUpdateData={onUpdateData}
      />
    );

    expect(screen.getByText(/2 saídas independentes/i)).toBeInTheDocument();
  });
});
