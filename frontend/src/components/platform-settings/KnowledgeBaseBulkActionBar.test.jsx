import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KnowledgeBaseBulkActionBar from './KnowledgeBaseBulkActionBar';

describe('KnowledgeBaseBulkActionBar Component', () => {
  it('does not render when selectedCount is 0', () => {
    const { container } = render(<KnowledgeBaseBulkActionBar selectedCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly with count and triggers clear and batch index callbacks', () => {
    const onClearMock = vi.fn();
    const onBatchIndexMock = vi.fn();

    render(
      <KnowledgeBaseBulkActionBar
        selectedCount={5}
        onClear={onClearMock}
        onBatchIndex={onBatchIndexMock}
        isBatchRunning={false}
      />
    );

    expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument();
    expect(screen.getByText('5 aulas selecionadas')).toBeInTheDocument();

    const clearBtn = screen.getByTestId('btn-clear-selection');
    fireEvent.click(clearBtn);
    expect(onClearMock).toHaveBeenCalled();

    const syncBtn = screen.getByTestId('btn-index-selected-rag');
    fireEvent.click(syncBtn);
    expect(onBatchIndexMock).toHaveBeenCalled();
  });

  it('displays loading state when isBatchRunning is true', () => {
    render(
      <KnowledgeBaseBulkActionBar
        selectedCount={3}
        isBatchRunning={true}
      />
    );

    expect(screen.getByText('Sincronizando Seleção...')).toBeInTheDocument();
    expect(screen.getByTestId('btn-index-selected-rag')).toBeDisabled();
  });
});
