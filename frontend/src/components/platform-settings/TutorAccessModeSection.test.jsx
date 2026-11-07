import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TutorAccessModeSection from './TutorAccessModeSection';

describe('TutorAccessModeSection Component', () => {
  it('renderiza os 3 modos de acesso disponíveis', () => {
    render(
      <TutorAccessModeSection
        accessMode="public"
        onChangeAccessMode={vi.fn()}
        maintenanceMessage=""
        onChangeMaintenanceMessage={vi.fn()}
      />
    );

    expect(screen.getByTestId('tutor-access-mode-section')).toBeInTheDocument();
    expect(screen.getByTestId('btn-access-mode-public')).toBeInTheDocument();
    expect(screen.getByTestId('btn-access-mode-maintenance')).toBeInTheDocument();
    expect(screen.getByTestId('btn-access-mode-private_team')).toBeInTheDocument();
    expect(screen.getByText('Liberado para Todos')).toBeInTheDocument();
    expect(screen.getByText('Modo Manutenção')).toBeInTheDocument();
    expect(screen.getByText('Oculto / Privado')).toBeInTheDocument();
  });

  it('chama onChangeAccessMode ao clicar em um modo', () => {
    const handleChangeMode = vi.fn();
    render(
      <TutorAccessModeSection
        accessMode="public"
        onChangeAccessMode={handleChangeMode}
        maintenanceMessage=""
        onChangeMaintenanceMessage={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('btn-access-mode-maintenance'));
    expect(handleChangeMode).toHaveBeenCalledWith('maintenance');

    fireEvent.click(screen.getByTestId('btn-access-mode-private_team'));
    expect(handleChangeMode).toHaveBeenCalledWith('private_team');
  });

  it('exibe campo de mensagem de manutenção apenas quando accessMode for maintenance', () => {
    const { rerender } = render(
      <TutorAccessModeSection
        accessMode="public"
        onChangeAccessMode={vi.fn()}
        maintenanceMessage=""
        onChangeMaintenanceMessage={vi.fn()}
      />
    );

    expect(screen.queryByTestId('maintenance-message-config')).not.toBeInTheDocument();

    rerender(
      <TutorAccessModeSection
        accessMode="maintenance"
        onChangeAccessMode={vi.fn()}
        maintenanceMessage="Estamos atualizando o robô"
        onChangeMaintenanceMessage={vi.fn()}
      />
    );

    expect(screen.getByTestId('maintenance-message-config')).toBeInTheDocument();
    const input = screen.getByTestId('input-maintenance-message');
    expect(input).toHaveValue('Estamos atualizando o robô');
  });

  it('chama onChangeMaintenanceMessage ao digitar no textarea de manutenção', () => {
    const handleChangeMsg = vi.fn();
    render(
      <TutorAccessModeSection
        accessMode="maintenance"
        onChangeAccessMode={vi.fn()}
        maintenanceMessage=""
        onChangeMaintenanceMessage={handleChangeMsg}
      />
    );

    const input = screen.getByTestId('input-maintenance-message');
    fireEvent.change(input, { target: { value: 'Manutenção até às 18h' } });
    expect(handleChangeMsg).toHaveBeenCalledWith('Manutenção até às 18h');
  });
});
