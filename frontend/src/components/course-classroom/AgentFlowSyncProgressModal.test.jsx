import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AgentFlowSyncProgressModal from './AgentFlowSyncProgressModal';

describe('AgentFlowSyncProgressModal Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('não deve renderizar quando isOpen for false', () => {
    const { container } = render(
      <AgentFlowSyncProgressModal isOpen={false} lessonTitle="Aula 01" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza o popup de progresso com título, spinner e aviso para não sair da tela', () => {
    render(
      <AgentFlowSyncProgressModal isOpen={true} lessonTitle="Aula 01 - Trânsitos Planetários" />
    );

    expect(screen.getByTestId('agentflow-sync-progress-modal')).toBeInTheDocument();
    expect(screen.getByTestId('agentflow-sync-progress-modal-title')).toHaveTextContent(
      'Sincronizando com o AgentFlow...'
    );
    expect(screen.getByText('Aula 01 - Trânsitos Planetários')).toBeInTheDocument();
    expect(screen.getByText('não saia desta tela')).toBeInTheDocument();
    expect(screen.getByText(/até a conclusão da sincronização/i)).toBeInTheDocument();
  });

  it('não fecha o modal ao clicar no overlay de fundo (regra UX: bloqueante durante o processo)', () => {
    render(<AgentFlowSyncProgressModal isOpen={true} />);

    const overlay = screen.getByTestId('agentflow-sync-progress-modal-overlay');
    fireEvent.click(overlay);

    // O modal deve permanecer na tela
    expect(screen.getByTestId('agentflow-sync-progress-modal')).toBeInTheDocument();
  });

  it('avança para os próximos passos de progresso conforme o temporizador avança', () => {
    render(<AgentFlowSyncProgressModal isOpen={true} />);

    const stepElement = screen.getByTestId('agentflow-sync-current-step');
    expect(stepElement).toHaveTextContent('Conectando com o servidor do AgentFlow...');

    // Avança 3.5 segundos
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(stepElement).toHaveTextContent('Estruturando metadados e capítulos da aula...');

    // Avança mais 3.5 segundos
    act(() => {
      vi.advanceTimersByTime(3500);
    });
    expect(stepElement).toHaveTextContent('Dividindo transcrição em trechos inteligentes (chunks)...');
  });
});
