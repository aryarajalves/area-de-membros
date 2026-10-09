import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseClassroom from './CourseClassroom';
import { ToastProvider } from '../../context/ToastContext';

describe('CourseClassroom Batch Import Button Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.restoreAllMocks();
  });

  const mockCourseData = {
    id: 1,
    title: 'Curso de Especialização',
    modules: []
  };

  it('exibe o botão "Importar Pasta de Aulas" para administradores e abre o modal', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCourseData
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'admin' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('open-batch-import-btn')).toBeInTheDocument();
      expect(screen.getByText('Importar Pasta de Aulas')).toBeInTheDocument();
    });

    // Clica no botão para abrir o modal de lote
    fireEvent.click(screen.getByTestId('open-batch-import-btn'));

    // Modal deve estar visível
    expect(screen.getByTestId('batch-import-modal')).toBeInTheDocument();
    expect(screen.getByText('Importação em Lote de Aulas')).toBeInTheDocument();
  });

  it('não exibe o botão "Importar Pasta de Aulas" para alunos comuns', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockCourseData
    });

    render(
      <ToastProvider>
        <CourseClassroom
          course={{ id: 1, title: 'Curso de Especialização' }}
          currentUser={{ role: 'aluno' }}
          onBack={vi.fn()}
        />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('open-batch-import-btn')).not.toBeInTheDocument();
    });
  });
});
