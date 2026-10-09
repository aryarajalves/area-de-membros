import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import StudentPaginationBar from './StudentPaginationBar';

describe('StudentPaginationBar', () => {
  it('não deve renderizar quando totalStudents <= 0', () => {
    const { container } = render(
      <StudentPaginationBar
        page={1}
        limit={20}
        setPage={vi.fn()}
        setLimit={vi.fn()}
        totalStudents={0}
        totalPages={1}
        isLightBg={false}
        textColor="#fff"
        subTextColor="#aaa"
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar informações de paginação e lidar com cliques', () => {
    const setPage = vi.fn();
    const setLimit = vi.fn();

    render(
      <StudentPaginationBar
        page={1}
        limit={20}
        setPage={setPage}
        setLimit={setLimit}
        totalStudents={45}
        totalPages={3}
        isLightBg={false}
        textColor="#fff"
        subTextColor="#aaa"
      />
    );

    expect(screen.getByTestId('students-pagination-bar')).toBeInTheDocument();
    expect(screen.getByText(/Exibindo/i)).toBeInTheDocument();

    const nextBtn = screen.getByTestId('next-students-page-btn');
    expect(nextBtn).toBeEnabled();
    fireEvent.click(nextBtn);
    expect(setPage).toHaveBeenCalled();

    const prevBtn = screen.getByTestId('prev-students-page-btn');
    expect(prevBtn).toBeDisabled();

    const select = screen.getByTestId('students-per-page-select');
    fireEvent.change(select, { target: { value: '50' } });
    expect(setLimit).toHaveBeenCalledWith(50);
  });
});
