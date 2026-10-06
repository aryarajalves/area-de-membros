import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HistoryPaginationBar from './HistoryPaginationBar';

describe('HistoryPaginationBar Component', () => {
  it('does not render when totalItems is less than or equal to pageSize', () => {
    const { container } = render(
      <HistoryPaginationBar
        currentPage={1}
        totalItems={15}
        pageSize={20}
        onPageChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when totalItems > pageSize', () => {
    render(
      <HistoryPaginationBar
        currentPage={1}
        totalItems={45}
        pageSize={20}
        onPageChange={vi.fn()}
        itemName="disparos"
        testIdPrefix="test-history"
      />
    );

    expect(screen.getByTestId('test-history-pagination-bar')).toBeInTheDocument();
    expect(screen.getByText(/Exibindo/i)).toHaveTextContent('Exibindo 1–20 de 45 disparos');

    // Botão anterior desabilitado na página 1
    const prevBtn = screen.getByTestId('test-history-prev-page-btn');
    expect(prevBtn).toBeDisabled();

    // Páginas 1, 2, 3 visíveis
    expect(screen.getByTestId('test-history-page-1-btn')).toBeInTheDocument();
    expect(screen.getByTestId('test-history-page-2-btn')).toBeInTheDocument();
    expect(screen.getByTestId('test-history-page-3-btn')).toBeInTheDocument();

    // Botão próxima habilitado
    const nextBtn = screen.getByTestId('test-history-next-page-btn');
    expect(nextBtn).not.toBeDisabled();
  });

  it('calls onPageChange when clicking next, previous or specific page buttons', () => {
    const onPageChange = vi.fn();
    render(
      <HistoryPaginationBar
        currentPage={2}
        totalItems={50}
        pageSize={20}
        onPageChange={onPageChange}
        testIdPrefix="test-history"
      />
    );

    // Clicar em Anterior
    fireEvent.click(screen.getByTestId('test-history-prev-page-btn'));
    expect(onPageChange).toHaveBeenCalledWith(1);

    // Clicar em Próxima
    fireEvent.click(screen.getByTestId('test-history-next-page-btn'));
    expect(onPageChange).toHaveBeenCalledWith(3);

    // Clicar diretamente na página 3
    fireEvent.click(screen.getByTestId('test-history-page-3-btn'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('renders ellipses when totalPages > 7', () => {
    render(
      <HistoryPaginationBar
        currentPage={5}
        totalItems={200}
        pageSize={20}
        onPageChange={vi.fn()}
        testIdPrefix="test-history"
      />
    );

    // Deve exibir reticências
    expect(screen.getAllByText('...').length).toBeGreaterThan(0);
    expect(screen.getByTestId('test-history-page-1-btn')).toBeInTheDocument();
    expect(screen.getByTestId('test-history-page-5-btn')).toBeInTheDocument();
    expect(screen.getByTestId('test-history-page-10-btn')).toBeInTheDocument();
  });
});
