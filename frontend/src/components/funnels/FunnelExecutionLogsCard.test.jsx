import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelExecutionLogsCard from './FunnelExecutionLogsCard';

describe('FunnelExecutionLogsCard', () => {
  it('renderiza o título, o status e o texto dos logs corretamente', () => {
    const logs = "Gatilho 'event_attendance' iniciado (0 dias)\nMensagem enviada (Nó node_123)";
    render(<FunnelExecutionLogsCard logs={logs} status="completed" />);

    expect(screen.getByTestId('execution-logs-card')).toBeInTheDocument();
    expect(screen.getByText('Logs da Execução')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();

    const logsContainer = screen.getByTestId('execution-logs');
    expect(logsContainer).toBeInTheDocument();
    expect(logsContainer.textContent).toContain("Gatilho 'event_attendance' iniciado (0 dias)");
    expect(logsContainer.textContent).toContain('Mensagem enviada (Nó node_123)');
  });

  it('exibe mensagem amigável caso não haja logs registrados', () => {
    render(<FunnelExecutionLogsCard logs={null} status="running" />);

    expect(screen.getByText('Em andamento')).toBeInTheDocument();
    expect(
      screen.getByText('Nenhum log adicional registrado para esta execução.')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('copy-logs-btn')).not.toBeInTheDocument();
  });

  it('permite copiar os logs para a área de transferência', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    const logs = "Gatilho 'student_created' iniciado";
    render(<FunnelExecutionLogsCard logs={logs} status="completed" />);

    const copyBtn = screen.getByTestId('copy-logs-btn');
    expect(copyBtn).toBeInTheDocument();
    expect(screen.getByText('Copiar')).toBeInTheDocument();

    fireEvent.click(copyBtn);
    expect(writeTextMock).toHaveBeenCalledWith(logs);
    expect(screen.getByText('Copiado!')).toBeInTheDocument();
  });
});
