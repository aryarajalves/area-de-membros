import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import FunnelTriggerTutorLifecycleConfig from './FunnelTriggerTutorLifecycleConfig';

describe('FunnelTriggerTutorLifecycleConfig', () => {
  it('deve renderizar os eventos do Tutor IA e permitir alternar eventos ativos', () => {
    const onUpdateData = vi.fn();
    const data = {
      trigger_event: 'tutor_ia_lifecycle',
      active_events: ['first_chat'],
      expiring_days: 3,
    };

    render(
      <FunnelTriggerTutorLifecycleConfig
        nodeId="node_tut1"
        data={data}
        onUpdateData={onUpdateData}
      />
    );

    expect(screen.getByText(/Eventos Ativos:/i)).toBeInTheDocument();
    expect(screen.getByTestId('trigger-tutor-opt-first_chat-node_tut1')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-tutor-opt-quota_exhausted-node_tut1')).toBeInTheDocument();
    expect(screen.getByTestId('trigger-tutor-opt-expiring_soon-node_tut1')).toBeInTheDocument();

    // Ativar cota esgotada
    fireEvent.click(screen.getByTestId('trigger-tutor-opt-quota_exhausted-node_tut1'));

    expect(onUpdateData).toHaveBeenCalledWith('node_tut1', expect.objectContaining({
      active_events: ['first_chat', 'quota_exhausted'],
    }));
  });

  it('deve permitir alterar os dias de aviso quando expiring_soon estiver ativo', () => {
    const onUpdateData = vi.fn();
    const data = {
      trigger_event: 'tutor_ia_lifecycle',
      active_events: ['first_chat', 'expiring_soon'],
      expiring_days: 3,
    };

    render(
      <FunnelTriggerTutorLifecycleConfig
        nodeId="node_tut2"
        data={data}
        onUpdateData={onUpdateData}
      />
    );

    const input = screen.getByTestId('trigger-tutor-days-input-node_tut2');
    fireEvent.change(input, { target: { value: '5' } });

    expect(onUpdateData).toHaveBeenCalledWith('node_tut2', expect.objectContaining({
      days_before_expiration: 5,
    }));
  });
});
