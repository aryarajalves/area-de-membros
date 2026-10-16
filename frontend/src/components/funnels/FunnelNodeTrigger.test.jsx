import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelNodeTrigger from './FunnelNodeTrigger';

describe('FunnelNodeTrigger Component', () => {
  const defaultNode = {
    id: 'trigger_1',
    type: 'trigger',
    position: { x: 100, y: 150 },
    data: {
      trigger_event: 'student_created',
      delay_type: 'immediate',
      days_after: 0,
      is_start: true,
    },
  };

  it('renderiza o nó de gatilho com título, badge e presets de tempo', () => {
    render(
      <FunnelNodeTrigger
        node={defaultNode}
        isSelected={false}
        onUpdateData={vi.fn()}
        onDeleteNode={vi.fn()}
        onDuplicateNode={vi.fn()}
      />
    );

    expect(screen.getByTestId('funnel-node-trigger-trigger_1')).toBeInTheDocument();
    expect(screen.getByText('ALUNO CRIADO')).toBeInTheDocument();
    expect(screen.getByText('GATILHO')).toBeInTheDocument();
    expect(screen.getByTestId('node-output-handle-trigger_1')).toBeInTheDocument();

    expect(screen.getByTestId('trigger-preset-immediate-trigger_1')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-preset-7d-trigger_1')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-preset-14d-trigger_1')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-preset-21d-trigger_1')).toBeInTheDocument();
    expect(screen.getByText(/Disparará imediatamente assim que o aluno for cadastrado/i)).toBeInTheDocument();
  });

  it('permite selecionar preset de 7 dias e atualiza os dados do nó', () => {
    const onUpdateData = vi.fn();
    render(
      <FunnelNodeTrigger
        node={defaultNode}
        isSelected={true}
        onUpdateData={onUpdateData}
      />
    );

    const btn7d = screen.getByTestId('trigger-preset-7d-trigger_1');
    fireEvent.click(btn7d);

    expect(onUpdateData).toHaveBeenCalledWith('trigger_1', expect.objectContaining({
      trigger_event: 'student_created',
      delay_type: '7_days',
      days_after: 7,
    }));
  });

  it('permite personalizar a quantidade de dias via input numérico', () => {
    const onUpdateData = vi.fn();
    render(
      <FunnelNodeTrigger
        node={defaultNode}
        isSelected={false}
        onUpdateData={onUpdateData}
      />
    );

    const input = screen.getByTestId('trigger-custom-days-input-trigger_1');
    fireEvent.change(input, { target: { value: '30' } });

    expect(onUpdateData).toHaveBeenCalledWith('trigger_1', expect.objectContaining({
      trigger_event: 'student_created',
      delay_type: 'custom',
      days_after: 30,
    }));
  });

  it('exibe texto informativo correto quando dias de atraso for maior que zero', () => {
    const delayedNode = {
      ...defaultNode,
      data: {
        trigger_event: 'student_created',
        delay_type: '14_days',
        days_after: 14,
      },
    };

    render(
      <FunnelNodeTrigger
        node={delayedNode}
        isSelected={false}
        onUpdateData={vi.fn()}
      />
    );

    expect(screen.getByText(/Disparará automaticamente 14 dia\(s\) após a criação do aluno/i)).toBeInTheDocument();
  });

  it('exibe o badge [▶ INÍCIO] em verde ao lado do badge [GATILHO] quando is_start for true', () => {
    render(
      <FunnelNodeTrigger
        node={{
          ...defaultNode,
          data: { ...defaultNode.data, is_start: true },
        }}
        isSelected={false}
      />
    );

    expect(screen.getByText('GATILHO')).toBeInTheDocument();
    expect(screen.getByTestId('funnel-node-start-badge-trigger_1')).toBeInTheDocument();
    expect(screen.getByText('▶ INÍCIO')).toBeInTheDocument();
  });

  it('não exibe o badge [▶ INÍCIO] quando is_start for false', () => {
    render(
      <FunnelNodeTrigger
        node={{
          ...defaultNode,
          data: { ...defaultNode.data, is_start: false },
        }}
        isSelected={false}
      />
    );

    expect(screen.getByText('GATILHO')).toBeInTheDocument();
    expect(screen.queryByTestId('funnel-node-start-badge-trigger_1')).not.toBeInTheDocument();
    expect(screen.queryByText('▶ INÍCIO')).not.toBeInTheDocument();
  });

  it('renderiza corretamente o gatilho de interesse em curso com seletor de cursos', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{ id: 42, title: 'Curso de React Avançado' }]),
    });

    const onUpdateData = vi.fn();
    const courseNode = {
      id: 'trigger_course_1',
      type: 'trigger',
      position: { x: 100, y: 150 },
      data: {
        trigger_event: 'course_interest',
        course_id: null,
        is_start: true,
      },
    };

    render(
      <FunnelNodeTrigger
        node={courseNode}
        isSelected={false}
        onUpdateData={onUpdateData}
      />
    );

    expect(screen.getByText('INTERESSE EM CURSO')).toBeInTheDocument();
    expect(screen.getByText('1 única vez')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-course-select-trigger_course_1')).toBeInTheDocument();
    expect(screen.getByText(/Disparará 1 única vez quando o aluno clicar em qualquer curso que não possua/i)).toBeInTheDocument();

    await screen.findByText('Curso de React Avançado');

    const select = screen.getByTestId('trigger-course-select-trigger_course_1');
    fireEvent.change(select, { target: { value: '42' } });

    expect(onUpdateData).toHaveBeenCalledWith('trigger_course_1', expect.objectContaining({
      trigger_event: 'course_interest',
      course_id: 42,
      course_title: 'Curso de React Avançado',
    }));
  });

  it('exibe o nome do curso selecionado no resumo de interesse em curso', () => {
    const specificCourseNode = {
      id: 'trigger_course_2',
      type: 'trigger',
      position: { x: 100, y: 150 },
      data: {
        trigger_event: 'course_interest',
        course_id: 10,
        course_title: 'Bússola Astrológica APP',
        is_start: true,
      },
    };

    render(
      <FunnelNodeTrigger
        node={specificCourseNode}
        isSelected={false}
        onUpdateData={vi.fn()}
      />
    );

    expect(screen.getByText(/Disparará 1 única vez quando o aluno clicar no curso "Bússola Astrológica APP"/i)).toBeInTheDocument();
  });
});
