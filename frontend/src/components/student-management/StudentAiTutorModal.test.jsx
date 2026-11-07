import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentAiTutorModal from './StudentAiTutorModal';
import { ToastProvider } from '../../context/ToastContext';

describe('StudentAiTutorModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders student AI tutor metrics and saves changes', async () => {
    const mockStudent = { id: 42, full_name: 'Maria Silva', email: 'maria@exemplo.com' };

    global.fetch = vi.fn().mockImplementation((url, opts) => {
      if (url.includes('/api/v1/tutor-ia/students/42') && (!opts || opts.method === 'GET' || !opts.method)) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              ai_tutor_active: false,
              ai_tutor_expires_at: null,
              ai_tutor_custom_monthly_limit: null,
              used_this_month: 2,
              cost_this_month_brl: 0.015,
              total_cost_all_time_brl: 0.12,
              total_questions_all_time: 15,
              can_ask: true
            })
        });
      }
      if (url.includes('/api/v1/tutor-ia/students/42') && opts?.method === 'PUT') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    const onClose = vi.fn();
    const onStudentUpdated = vi.fn();

    render(
      <ToastProvider>
        <StudentAiTutorModal
          isOpen={true}
          onClose={onClose}
          student={mockStudent}
          onStudentUpdated={onStudentUpdated}
        />
      </ToastProvider>
    );

    // Aguarda carregar dados
    expect(await screen.findByText(/Maria Silva/i)).toBeInTheDocument();
    expect(screen.getByText(/Perguntas no Mês/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Custo Consumido na API/i)).toBeInTheDocument();

    // Ativa toggle de assinatura
    const toggleCheckbox = screen.getByRole('checkbox');
    fireEvent.click(toggleCheckbox);

    // Salva alterações
    const saveBtn = screen.getByTestId('btn-save-student-tutor-modal');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/tutor-ia/students/42',
        expect.objectContaining({ method: 'PUT' })
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('does not render modal when isOpen is false', () => {
    render(
      <ToastProvider>
        <StudentAiTutorModal isOpen={false} onClose={() => {}} student={{ id: 1 }} />
      </ToastProvider>
    );
    expect(screen.queryByTestId('student-ai-tutor-modal')).not.toBeInTheDocument();
  });
});
