import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StudentFilterBar from './StudentFilterBar';

describe('StudentFilterBar Component', () => {
  const dummyCourses = [
    { id: 1, title: 'Bússola Astrológica' },
    { id: 2, title: 'Curso de Tarot' },
  ];

  it('renderiza campos de busca, ordenação, filtro de curso, mês e data', () => {
    render(
      <StudentFilterBar
        search=""
        setSearch={vi.fn()}
        onSearchSubmit={vi.fn()}
        onClearSearch={vi.fn()}
        orderBy="recent"
        setOrderBy={vi.fn()}
        selectedCourseId=""
        setSelectedCourseId={vi.fn()}
        courses={dummyCourses}
        selectedMonth=""
        setSelectedMonth={vi.fn()}
        selectedDate=""
        setSelectedDate={vi.fn()}
        onResetFilters={vi.fn()}
        hasActiveFilters={false}
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        loading={false}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText(/Buscar aluno por nome ou e-mail/i)).toBeInTheDocument();
    expect(screen.getByTestId('order-by-select')).toBeInTheDocument();
    expect(screen.getByTestId('filter-course-select')).toBeInTheDocument();
    expect(screen.getByTestId('filter-month-input')).toBeInTheDocument();
    expect(screen.getByTestId('filter-date-input')).toBeInTheDocument();
    expect(screen.getByText('Bússola Astrológica')).toBeInTheDocument();
  });

  it('dispara alteração de ordenação e filtro de curso', () => {
    const setOrderBy = vi.fn();
    const setSelectedCourseId = vi.fn();

    render(
      <StudentFilterBar
        search=""
        setSearch={vi.fn()}
        onSearchSubmit={vi.fn()}
        onClearSearch={vi.fn()}
        orderBy="recent"
        setOrderBy={setOrderBy}
        selectedCourseId=""
        setSelectedCourseId={setSelectedCourseId}
        courses={dummyCourses}
        selectedMonth=""
        setSelectedMonth={vi.fn()}
        selectedDate=""
        setSelectedDate={vi.fn()}
        onResetFilters={vi.fn()}
        hasActiveFilters={true}
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        loading={false}
        onRefresh={vi.fn()}
      />
    );

    const orderSelect = screen.getByTestId('order-by-select');
    fireEvent.change(orderSelect, { target: { value: 'progress_desc' } });
    expect(setOrderBy).toHaveBeenCalledWith('progress_desc');

    const courseSelect = screen.getByTestId('filter-course-select');
    fireEvent.change(courseSelect, { target: { value: '1' } });
    expect(setSelectedCourseId).toHaveBeenCalledWith('1');

    const resetBtn = screen.getByTestId('reset-filters-btn');
    expect(resetBtn).toBeInTheDocument();
  });

  it('dispara alteração de engajamento e faixa de progresso (%)', () => {
    const setEngagementLevel = vi.fn();
    const setMinProgress = vi.fn();
    const setMaxProgress = vi.fn();

    render(
      <StudentFilterBar
        search=""
        setSearch={vi.fn()}
        onSearchSubmit={vi.fn()}
        onClearSearch={vi.fn()}
        orderBy="recent"
        setOrderBy={vi.fn()}
        selectedCourseId=""
        setSelectedCourseId={vi.fn()}
        courses={dummyCourses}
        selectedMonth=""
        setSelectedMonth={vi.fn()}
        selectedDate=""
        setSelectedDate={vi.fn()}
        engagementLevel=""
        setEngagementLevel={setEngagementLevel}
        minProgress=""
        setMinProgress={setMinProgress}
        maxProgress=""
        setMaxProgress={setMaxProgress}
        onResetFilters={vi.fn()}
        hasActiveFilters={false}
        isLightBg={false}
        textColor="#f8fafc"
        subTextColor="#94a3b8"
        loading={false}
        onRefresh={vi.fn()}
      />
    );

    fireEvent.change(screen.getByTestId('filter-engagement-select'), { target: { value: 'medium' } });
    expect(setEngagementLevel).toHaveBeenCalledWith('medium');

    fireEvent.change(screen.getByTestId('filter-min-progress-input'), { target: { value: '51' } });
    expect(setMinProgress).toHaveBeenCalledWith('51');

    fireEvent.change(screen.getByTestId('filter-max-progress-input'), { target: { value: '90' } });
    expect(setMaxProgress).toHaveBeenCalledWith('90');
  });
});
