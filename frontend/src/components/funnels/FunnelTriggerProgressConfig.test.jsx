import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import FunnelTriggerProgressConfig from './FunnelTriggerProgressConfig';

describe('FunnelTriggerProgressConfig', () => {
  const defaultCourses = [
    { id: 1, title: 'Curso de React' },
    { id: 2, title: 'Curso de Python' },
  ];

  it('deve renderizar os 4 botões de marcos de progresso e permitir alternar múltiplos marcos', () => {
    const onUpdateData = vi.fn();
    const data = {
      trigger_event: 'progress_milestone',
      milestones: ['100'],
      milestone: '100',
      course_id: null,
    };

    render(
      <FunnelTriggerProgressConfig
        nodeId="node_1"
        data={data}
        courses={defaultCourses}
        loadingCourses={false}
        onUpdateData={onUpdateData}
      />
    );

    expect(screen.getByText(/Porcentagens ativas/i)).toBeInTheDocument();
    expect(screen.getByTestId('trigger-milestone-btn-25-node_1')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-milestone-btn-50-node_1')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-milestone-btn-75-node_1')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-milestone-btn-100-node_1')).toBeInTheDocument();

    // Clicar no marco de 50% para adicionar
    fireEvent.click(screen.getByTestId('trigger-milestone-btn-50-node_1'));

    expect(onUpdateData).toHaveBeenCalledWith('node_1', expect.objectContaining({
      milestones: ['50', '100'],
    }));
  });

  it('deve exibir indicador de saídas ramificadas no resumo', () => {
    const onUpdateData = vi.fn();
    const data = {
      trigger_event: 'progress_milestone',
      milestones: ['25', '50', '100'],
      course_id: 1,
    };

    render(
      <FunnelTriggerProgressConfig
        nodeId="node_2"
        data={data}
        courses={defaultCourses}
        loadingCourses={false}
        onUpdateData={onUpdateData}
      />
    );

    expect(screen.getByText(/Saídas ramificadas/i)).toBeInTheDocument();
    expect(screen.getByText(/25%, 50%, 100%/i)).toBeInTheDocument();
  });

  it('deve permitir alterar o curso alvo', () => {
    const onUpdateData = vi.fn();
    const data = {
      trigger_event: 'progress_milestone',
      milestones: ['100'],
      course_id: null,
    };

    render(
      <FunnelTriggerProgressConfig
        nodeId="node_3"
        data={data}
        courses={defaultCourses}
        loadingCourses={false}
        onUpdateData={onUpdateData}
      />
    );

    const select = screen.getByTestId('trigger-progress-course-select-node_3');
    fireEvent.change(select, { target: { value: '2' } });

    expect(onUpdateData).toHaveBeenCalledWith('node_3', expect.objectContaining({
      course_id: 2,
      course_title: 'Curso de Python',
    }));
  });
});
