import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import FunnelNodeTriggerPorts from './FunnelNodeTriggerPorts';

describe('FunnelNodeTriggerPorts', () => {
  it('deve renderizar handles múltiplos para marcos de progresso quando mais de 1 estiver selecionado', () => {
    const onStartConnect = vi.fn();
    const node = { id: 'node_pm' };
    const data = {
      trigger_event: 'progress_milestone',
      milestones: ['25', '50', '100'],
    };

    render(
      <FunnelNodeTriggerPorts
        node={node}
        data={data}
        triggerEvent="progress_milestone"
        onStartConnect={onStartConnect}
      />
    );

    const handle25 = screen.getByTestId('node-output-handle-25-node_pm');
    const handle50 = screen.getByTestId('node-output-handle-50-node_pm');
    const handle100 = screen.getByTestId('node-output-handle-100-node_pm');

    expect(handle25).toBeInTheDocument();
    expect(handle50).toBeInTheDocument();
    expect(handle100).toBeInTheDocument();

    fireEvent.click(handle50);
    expect(onStartConnect).toHaveBeenCalledWith('node_pm', expect.anything(), node, 'output_50');
  });

  it('deve renderizar handles múltiplos para aula e módulo em lesson_module_activity', () => {
    const onStartConnect = vi.fn();
    const node = { id: 'node_lm' };
    const data = {
      trigger_event: 'lesson_module_activity',
      active_options: ['lesson', 'module'],
    };

    render(
      <FunnelNodeTriggerPorts
        node={node}
        data={data}
        triggerEvent="lesson_module_activity"
        onStartConnect={onStartConnect}
      />
    );

    const handleLesson = screen.getByTestId('node-output-handle-lesson-node_lm');
    const handleModule = screen.getByTestId('node-output-handle-module-node_lm');

    expect(handleLesson).toBeInTheDocument();
    expect(handleModule).toBeInTheDocument();

    fireEvent.click(handleLesson);
    expect(onStartConnect).toHaveBeenCalledWith('node_lm', expect.anything(), node, 'output_lesson');
  });

  it('deve renderizar handles múltiplos para eventos do Tutor IA', () => {
    const onStartConnect = vi.fn();
    const node = { id: 'node_tut' };
    const data = {
      trigger_event: 'tutor_ia_lifecycle',
      active_events: ['first_chat', 'quota_exhausted'],
    };

    render(
      <FunnelNodeTriggerPorts
        node={node}
        data={data}
        triggerEvent="tutor_ia_lifecycle"
        onStartConnect={onStartConnect}
      />
    );

    const handleFirstChat = screen.getByTestId('node-output-handle-first_chat-node_tut');
    const handleQuota = screen.getByTestId('node-output-handle-quota_exhausted-node_tut');

    expect(handleFirstChat).toBeInTheDocument();
    expect(handleQuota).toBeInTheDocument();

    fireEvent.click(handleFirstChat);
    expect(onStartConnect).toHaveBeenCalledWith('node_tut', expect.anything(), node, 'output_first_chat');
  });

  it('deve renderizar handle padrão único para outros gatilhos', () => {
    const onStartConnect = vi.fn();
    const node = { id: 'node_default' };

    render(
      <FunnelNodeTriggerPorts
        node={node}
        data={{}}
        triggerEvent="student_created"
        onStartConnect={onStartConnect}
      />
    );

    const handle = screen.getByTestId('node-output-handle-node_default');
    expect(handle).toBeInTheDocument();

    fireEvent.click(handle);
    expect(onStartConnect).toHaveBeenCalledWith('node_default', expect.anything(), node, 'output');
  });
});
