import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KnowledgeBatchProgressModal from './KnowledgeBatchProgressModal';

describe('KnowledgeBatchProgressModal Component', () => {
  const defaultProps = {
    isOpen: true,
    isRunning: true,
    isCompleted: false,
    isCancelled: false,
    total: 3,
    currentStep: 2,
    currentLessonTitle: 'Desvendando os Trânsitos Astrológicos',
    progressPct: 66,
    logs: [
      {
        id: 1,
        title: 'Introdução aos Planetas',
        status: 'success',
        chunks: 10,
        qa_count: 5
      }
    ],
    stats: { totalSuccess: 1, totalFailed: 0, totalChunks: 10, totalQa: 5 },
    onCancel: vi.fn(),
    onClose: vi.fn(),
    isLightBg: false
  };

  it('renders progress bar, percentage and currently indexing lesson title', () => {
    render(<KnowledgeBatchProgressModal {...defaultProps} />);

    expect(screen.getByText('Sincronizando Base de Conhecimento RAG')).toBeInTheDocument();
    expect(screen.getByText('Progresso: Aula 2 de 3')).toBeInTheDocument();
    expect(screen.getByTestId('batch-progress-percentage')).toHaveTextContent('66%');
    expect(screen.getByTestId('current-indexing-lesson')).toHaveTextContent('Desvendando os Trânsitos Astrológicos');

    // Verifica item no histórico
    expect(screen.getByText('Introdução aos Planetas')).toBeInTheDocument();
    expect(screen.getByText('+10 chunks (5 Q&A)')).toBeInTheDocument();

    // Botão de Interromper presente durante execução
    const cancelBtn = screen.getByTestId('btn-cancel-batch-index');
    expect(cancelBtn).toBeInTheDocument();
    fireEvent.click(cancelBtn);
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('renders completed summary cards and single close button when isCompleted is true', () => {
    const onCLoseMock = vi.fn();
    render(
      <KnowledgeBatchProgressModal
        {...defaultProps}
        isRunning={false}
        isCompleted={true}
        progressPct={100}
        stats={{ totalSuccess: 3, totalFailed: 0, totalChunks: 33, totalQa: 15 }}
        logs={[
          { id: 1, title: 'Aula 1', status: 'success', chunks: 11, qa_count: 5 },
          { id: 2, title: 'Aula 2', status: 'success', chunks: 11, qa_count: 5 },
          { id: 3, title: 'Aula 3', status: 'success', chunks: 11, qa_count: 5 }
        ]}
        onClose={onCLoseMock}
      />
    );

    expect(screen.getByText('Sincronização em Lote Concluída!')).toBeInTheDocument();
    expect(screen.getByText('100% Concluído')).toBeInTheDocument();
    expect(screen.getByTestId('batch-summary-stats')).toBeInTheDocument();
    expect(screen.getByText('33')).toBeInTheDocument(); // Chunks

    // Único botão Concluir e Fechar
    const closeBtn = screen.getByTestId('btn-close-batch-progress');
    expect(closeBtn).toBeInTheDocument();
    fireEvent.click(closeBtn);
    expect(onCLoseMock).toHaveBeenCalled();
  });

  it('does not close or propagate click when clicking backdrop or modal card', () => {
    const stopPropagationMock = vi.fn();
    render(<KnowledgeBatchProgressModal {...defaultProps} />);

    const overlay = screen.getByTestId('knowledge-batch-progress-modal-overlay');
    fireEvent.click(overlay, { stopPropagation: stopPropagationMock });

    // Componente permanece aberto e visível
    expect(screen.getByTestId('knowledge-batch-progress-modal')).toBeInTheDocument();
  });
});
