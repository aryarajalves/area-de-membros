import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LogDateFilter from './LogDateFilter';

describe('LogDateFilter Component', () => {
  it('renders date, start time, end time inputs and actions', () => {
    const onDateChange = vi.fn();
    const onStartTimeChange = vi.fn();
    const onEndTimeChange = vi.fn();
    const onApplyFilter = vi.fn();
    const onClearFilter = vi.fn();

    render(
      <LogDateFilter
        selectedDate="2026-09-29"
        onDateChange={onDateChange}
        startTime="14:00"
        onStartTimeChange={onStartTimeChange}
        endTime="16:00"
        onEndTimeChange={onEndTimeChange}
        onApplyFilter={onApplyFilter}
        onClearFilter={onClearFilter}
        isActive={true}
      />
    );

    expect(screen.getByTestId('log-date-filter-bar')).toBeInTheDocument();
    expect(screen.getByTestId('log-date-input')).toHaveValue('2026-09-29');
    expect(screen.getByTestId('log-start-time-input')).toHaveValue('14:00');
    expect(screen.getByTestId('log-end-time-input')).toHaveValue('16:00');
    expect(screen.getByTestId('apply-date-filter-btn')).toBeInTheDocument();
    expect(screen.getByTestId('clear-date-filter-btn')).toBeInTheDocument();
  });

  it('triggers onApplyFilter when clicking filter button', () => {
    const onApplyFilter = vi.fn();
    render(
      <LogDateFilter
        selectedDate="2026-09-29"
        onDateChange={vi.fn()}
        startTime=""
        onStartTimeChange={vi.fn()}
        endTime=""
        onEndTimeChange={vi.fn()}
        onApplyFilter={onApplyFilter}
        onClearFilter={vi.fn()}
        isActive={true}
      />
    );

    fireEvent.click(screen.getByTestId('apply-date-filter-btn'));
    expect(onApplyFilter).toHaveBeenCalledTimes(1);
  });

  it('sets today date in Brasilia timezone when clicking Hoje button', () => {
    const onDateChange = vi.fn();
    render(
      <LogDateFilter
        selectedDate=""
        onDateChange={onDateChange}
        startTime=""
        onStartTimeChange={vi.fn()}
        endTime=""
        onEndTimeChange={vi.fn()}
        onApplyFilter={vi.fn()}
        onClearFilter={vi.fn()}
        isActive={false}
      />
    );

    fireEvent.click(screen.getByTestId('btn-today-date'));
    expect(onDateChange).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
  });

  it('triggers onClearFilter when clicking clear button', () => {
    const onClearFilter = vi.fn();
    render(
      <LogDateFilter
        selectedDate="2026-09-29"
        onDateChange={vi.fn()}
        startTime="10:00"
        onStartTimeChange={vi.fn()}
        endTime="12:00"
        onEndTimeChange={vi.fn()}
        onApplyFilter={vi.fn()}
        onClearFilter={onClearFilter}
        isActive={true}
      />
    );

    fireEvent.click(screen.getByTestId('clear-date-filter-btn'));
    expect(onClearFilter).toHaveBeenCalledTimes(1);
  });
});
