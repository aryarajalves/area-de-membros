import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  COURSE_ACCESS_DURATION_OPTIONS,
  CreateInviteModal,
  EditUserRoleModal,
} from './UserModals';

describe('UserModals & Short Trial Access Duration (1 to 7 days)', () => {
  it('inclui todas as opções de 1 a 7 dias em COURSE_ACCESS_DURATION_OPTIONS', () => {
    const values = COURSE_ACCESS_DURATION_OPTIONS.map((o) => o.value);
    expect(values).toContain('1_day');
    expect(values).toContain('2_days');
    expect(values).toContain('3_days');
    expect(values).toContain('4_days');
    expect(values).toContain('5_days');
    expect(values).toContain('6_days');
    expect(values).toContain('7_days');
    expect(values).toContain('lifetime');
    expect(values).toContain('1_month');
  });

  it('permite escolher de 1 a 7 dias no seletor de curso dentro do CreateInviteModal', () => {
    const mockCourses = [
      { id: 10, title: 'Bussola Astrologica', thumbnail_url: null },
    ];
    const mockSetCourseAccessMap = vi.fn();

    render(
      <CreateInviteModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        inviteRole="aluno"
        setInviteRole={vi.fn()}
        expireHours="24"
        setExpireHours={vi.fn()}
        courses={mockCourses}
        selectedCourseIds={[10]}
        setSelectedCourseIds={vi.fn()}
        courseAccessMap={{ 10: 'lifetime' }}
        setCourseAccessMap={mockSetCourseAccessMap}
      />
    );

    const durationSelect = screen.getByTestId('invite-course-duration-10');
    expect(durationSelect).toBeInTheDocument();

    // Confirma que as opções de 1 a 7 dias existem no select do curso
    expect(within(durationSelect).getByRole('option', { name: '1 dia' })).toBeInTheDocument();
    expect(within(durationSelect).getByRole('option', { name: '2 dias' })).toBeInTheDocument();
    expect(within(durationSelect).getByRole('option', { name: '3 dias' })).toBeInTheDocument();
    expect(within(durationSelect).getByRole('option', { name: '4 dias' })).toBeInTheDocument();
    expect(within(durationSelect).getByRole('option', { name: '5 dias' })).toBeInTheDocument();
    expect(within(durationSelect).getByRole('option', { name: '6 dias' })).toBeInTheDocument();
    expect(within(durationSelect).getByRole('option', { name: '7 dias' })).toBeInTheDocument();

    // Seleciona '3_days'
    fireEvent.change(durationSelect, { target: { value: '3_days' } });
    expect(mockSetCourseAccessMap).toHaveBeenCalled();
  });

  it('permite escolher de 1 a 7 dias no EditUserRoleModal', () => {
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
        courseAccessMap={{ 20: '5_days' }}
        setCourseAccessMap={mockSetCourseAccessMap}
        onSave={vi.fn()}
      />
    );

    const durationSelect = screen.getByTestId('edit-course-duration-20');
    expect(durationSelect).toHaveValue('5_days');

    fireEvent.change(durationSelect, { target: { value: '7_days' } });
    expect(mockSetCourseAccessMap).toHaveBeenCalled();
  });
});
