import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatDmPagination from './ChatDmPagination';

describe('ChatDmPagination Component', () => {
  it('returns null when totalItems is 0', () => {
    const { container } = render(
      <ChatDmPagination
        currentPage={1}
        totalPages={1}
        totalItems={0}
        startIndex={0}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders pagination info and page indicator correctly', () => {
    render(
      <ChatDmPagination
        currentPage={1}
        totalPages={3}
        totalItems={45}
        startIndex={0}
        itemsPerPage={20}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('dm-pagination-bar')).toBeInTheDocument();
    expect(screen.getByTestId('dm-pagination-info')).toHaveTextContent('Exibindo 1–20 de 45 DMs');
    expect(screen.getByTestId('dm-pagination-indicator')).toHaveTextContent('1 / 3');

    const prevBtn = screen.getByTestId('dm-pagination-prev-btn');
    const nextBtn = screen.getByTestId('dm-pagination-next-btn');

    expect(prevBtn).toBeDisabled();
    expect(nextBtn).not.toBeDisabled();
  });

  it('navigates to next page when clicking next button', () => {
    const handlePageChange = vi.fn();
    render(
      <ChatDmPagination
        currentPage={1}
        totalPages={3}
        totalItems={45}
        startIndex={0}
        itemsPerPage={20}
        onPageChange={handlePageChange}
      />
    );

    const nextBtn = screen.getByTestId('dm-pagination-next-btn');
    fireEvent.click(nextBtn);

    expect(handlePageChange).toHaveBeenCalledWith(2);
  });

  it('navigates to previous page when on page 2 and clicking previous button', () => {
    const handlePageChange = vi.fn();
    render(
      <ChatDmPagination
        currentPage={2}
        totalPages={3}
        totalItems={45}
        startIndex={20}
        itemsPerPage={20}
        onPageChange={handlePageChange}
      />
    );

    expect(screen.getByTestId('dm-pagination-info')).toHaveTextContent('Exibindo 21–40 de 45 DMs');
    expect(screen.getByTestId('dm-pagination-indicator')).toHaveTextContent('2 / 3');

    const prevBtn = screen.getByTestId('dm-pagination-prev-btn');
    const nextBtn = screen.getByTestId('dm-pagination-next-btn');

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(prevBtn);
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });

  it('disables next button on the last page', () => {
    const handlePageChange = vi.fn();
    render(
      <ChatDmPagination
        currentPage={3}
        totalPages={3}
        totalItems={45}
        startIndex={40}
        itemsPerPage={20}
        onPageChange={handlePageChange}
      />
    );

    expect(screen.getByTestId('dm-pagination-info')).toHaveTextContent('Exibindo 41–45 de 45 DMs');
    expect(screen.getByTestId('dm-pagination-indicator')).toHaveTextContent('3 / 3');

    const nextBtn = screen.getByTestId('dm-pagination-next-btn');
    expect(nextBtn).toBeDisabled();
  });
});
