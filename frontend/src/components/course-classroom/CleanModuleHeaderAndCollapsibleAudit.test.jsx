import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ModuleTimelineSidebar from './ModuleTimelineSidebar';
import SuperAdminLessonAuditFilterBar from './SuperAdminLessonAuditFilterBar';
import { ToastProvider } from '../../context/ToastContext';

describe('Item 2 - Limpeza do Cabeçalho dos Módulos e Filtros Super Admin Retrátil', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleModules = [
    {
      id: 1,
      title: 'Módulo 1 - Comece Aqui',
      lessons: [
        { id: 101, title: 'Aula 01', duration: '10:00' },
        { id: 102, title: 'Aula 02', duration: '15:00' }
      ]
    }
  ];

  it('exibe o subtítulo limpo no formato X/Y aulas e não exibe o texto Fechado (clique para abrir)', () => {
    render(
      <ModuleTimelineSidebar
        courseId={1}
        modules={sampleModules}
        selectedModule={sampleModules[0]}
        activeLesson={sampleModules[0].lessons[0]}
        completedLessonIds={[101]}
        totalLessonsCount={2}
        isManager={false}
      />
    );

    // Deve exibir 1/2 aulas (pois aula 101 está em completedLessonIds)
    expect(screen.getByText('1/2 aulas')).toBeInTheDocument();

    // NÃO deve conter o texto redundante
    expect(screen.queryByText(/Fechado \(clique para abrir\)/i)).not.toBeInTheDocument();
  });

  it('permite recolher e expandir o card de Filtros Super Admin', () => {
    render(
      <ToastProvider>
        <SuperAdminLessonAuditFilterBar
          isSuperAdmin={true}
          courseId={1}
          activeFilter="all"
          onSelectFilter={vi.fn()}
          counts={{ all: 5, any_issue: 2, unoptimized_video: 1 }}
          unoptimizedItems={[{ mod: sampleModules[0], lesson: sampleModules[0].lessons[0] }]}
        />
      </ToastProvider>
    );

    // Inicialmente expandido: botão de Otimizar em Fila está visível
    expect(screen.getByTestId('superadmin-open-batch-opt-modal-btn')).toBeInTheDocument();

    const collapseBtn = screen.getByTestId('superadmin-audit-toggle-collapse-btn');
    expect(collapseBtn).toBeInTheDocument();

    // Clica para recolher
    fireEvent.click(collapseBtn);

    // O botão interno deve ficar oculto
    expect(screen.queryByTestId('superadmin-open-batch-opt-modal-btn')).not.toBeInTheDocument();

    // Clica novamente para expandir
    fireEvent.click(collapseBtn);
    expect(screen.getByTestId('superadmin-open-batch-opt-modal-btn')).toBeInTheDocument();
  });
});
