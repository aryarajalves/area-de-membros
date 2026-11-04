import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  COURSE_ACCESS_DURATION_OPTIONS,
  CreateInviteModal,
  EditUserRoleModal,
  parseCustomDuration,
  formatCustomDuration,
} from './UserModals';

describe('UserModals & Short Trial Access Duration (Hours, Days, Custom)', () => {
  it('inclui todas as opções de horas, dias e customizado em COURSE_ACCESS_DURATION_OPTIONS', () => {
    const values = COURSE_ACCESS_DURATION_OPTIONS.map((o) => o.value);
    expect(values).toContain('1_hour');
    expect(values).toContain('2_hours');
    expect(values).toContain('4_hours');
    expect(values).toContain('6_hours');
    expect(values).toContain('12_hours');
    expect(values).toContain('1_day');
    expect(values).toContain('2_days');
    expect(values).toContain('3_days');
    expect(values).toContain('4_days');
    expect(values).toContain('5_days');
    expect(values).toContain('6_days');
    expect(values).toContain('7_days');
    expect(values).toContain('lifetime');
    expect(values).toContain('1_month');
    expect(values).toContain('custom');
  });

  it('permite escolher horas no EditUserRoleModal', () => {
    const mockCourses = [
      { id: 20, title: 'Astrowake', thumbnail_url: null },
    ];
    const mockSetCourseAccessMap = vi.fn();

    render(
      <EditUserRoleModal
        isOpen={true}
        onClose={vi.fn()}
        editingUser={{ id: 5, name: 'Lead Teste', email: 'lead@teste.com' }}
        selectedRole="aluno"
        setSelectedRole={vi.fn()}
        courses={mockCourses}
        selectedCourseIds={[20]}
        setSelectedCourseIds={vi.fn()}
        courseAccessMap={{ 20: '6_hours' }}
        setCourseAccessMap={mockSetCourseAccessMap}
        onSave={vi.fn()}
      />
    );

    const durationSelect = screen.getByTestId('edit-course-duration-20');
    expect(durationSelect).toHaveValue('6_hours');

    fireEvent.change(durationSelect, { target: { value: '12_hours' } });
    expect(mockSetCourseAccessMap).toHaveBeenCalledWith(expect.any(Function));
  });

  it('exibe campos numéricos de dias e horas ao escolher a opção personalizada', () => {
    const mockCourses = [
      { id: 20, title: 'Astrowake', thumbnail_url: null },
    ];
    let accessMap = { 20: 'custom:2d_6h' };
    const mockSetCourseAccessMap = vi.fn((updater) => {
      if (typeof updater === 'function') {
        accessMap = updater(accessMap);
      } else {
        accessMap = updater;
      }
    });

    const { rerender } = render(
      <EditUserRoleModal
        isOpen={true}
        onClose={vi.fn()}
        editingUser={{ id: 5, name: 'Lead Teste', email: 'lead@teste.com' }}
        selectedRole="aluno"
        setSelectedRole={vi.fn()}
        courses={mockCourses}
        selectedCourseIds={[20]}
        setSelectedCourseIds={vi.fn()}
        courseAccessMap={accessMap}
        setCourseAccessMap={mockSetCourseAccessMap}
        onSave={vi.fn()}
      />
    );

    const durationSelect = screen.getByTestId('edit-course-duration-20');
    expect(durationSelect).toHaveValue('custom');

    const daysInput = screen.getByTestId('edit-custom-days-input-20');
    const hoursInput = screen.getByTestId('edit-custom-hours-input-20');
    expect(daysInput).toHaveValue(2);
    expect(hoursInput).toHaveValue(6);

    // Altera dias para 3
    fireEvent.change(daysInput, { target: { value: '3' } });
    expect(mockSetCourseAccessMap).toHaveBeenCalled();

    // Altera horas para 12
    fireEvent.change(hoursInput, { target: { value: '12' } });
    expect(mockSetCourseAccessMap).toHaveBeenCalled();
  });

  it('valida utilitários parseCustomDuration e formatCustomDuration', () => {
    expect(parseCustomDuration('custom:5d_10h')).toEqual({ days: 5, hours: 10 });
    expect(parseCustomDuration('custom:0d_3h')).toEqual({ days: 0, hours: 3 });
    expect(parseCustomDuration('lifetime')).toEqual({ days: 0, hours: 0 });
    expect(parseCustomDuration(null)).toEqual({ days: 0, hours: 0 });

    expect(formatCustomDuration(4, 8)).toBe('custom:4d_8h');
    expect(formatCustomDuration('0', '5')).toBe('custom:0d_5h');
  });
});
