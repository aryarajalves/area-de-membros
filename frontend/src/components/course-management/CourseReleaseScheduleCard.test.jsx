import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CourseReleaseScheduleCard, { toDatetimeLocalValue, formatReleaseDateTimePtBr } from './CourseReleaseScheduleCard';

describe('CourseReleaseScheduleCard', () => {
  it('renderiza as três opções de liberação do curso', () => {
    const setReleaseType = vi.fn();
    render(
      <CourseReleaseScheduleCard
        releaseType="immediate"
        setReleaseType={setReleaseType}
        releaseDate=""
        setReleaseDate={vi.fn()}
      />
    );

    expect(screen.getByTestId('course-release-schedule-card')).toBeInTheDocument();
    expect(screen.getByTestId('course-release-status-badge')).toHaveTextContent('Liberado');
    expect(screen.getByTestId('course-release-option-immediate')).toBeInTheDocument();
    expect(screen.getByTestId('course-release-option-closed')).toBeInTheDocument();
    expect(screen.getByTestId('course-release-option-specific_date')).toBeInTheDocument();
  });

  it('aciona setReleaseType ao clicar em Fechar para Todos os Alunos', () => {
    const setReleaseType = vi.fn();
    render(
      <CourseReleaseScheduleCard
        releaseType="immediate"
        setReleaseType={setReleaseType}
        releaseDate=""
        setReleaseDate={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('course-release-option-closed'));
    expect(setReleaseType).toHaveBeenCalledWith('closed');
  });

  it('exibe o seletor de data e hora quando releaseType é specific_date', () => {
    const setReleaseDate = vi.fn();
    render(
      <CourseReleaseScheduleCard
        releaseType="specific_date"
        setReleaseType={vi.fn()}
        releaseDate="2027-05-10T14:30"
        setReleaseDate={setReleaseDate}
      />
    );

    expect(screen.getByTestId('course-release-status-badge')).toHaveTextContent('Agendado');
    const dtInput = screen.getByTestId('course-release-datetime-input');
    expect(dtInput).toBeInTheDocument();
    expect(dtInput.value).toBe('2027-05-10T14:30');

    fireEvent.change(dtInput, { target: { value: '2027-06-15T19:00' } });
    expect(setReleaseDate).toHaveBeenCalledWith('2027-06-15T19:00');
  });

  it('converte e formata datas corretamente com toDatetimeLocalValue e formatReleaseDateTimePtBr', () => {
    expect(toDatetimeLocalValue('')).toBe('');
    expect(formatReleaseDateTimePtBr('')).toBe('');
    const iso = '2027-05-10T14:30:00.000Z';
    expect(toDatetimeLocalValue(iso)).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(formatReleaseDateTimePtBr(iso)).toContain('2027');
  });
});
