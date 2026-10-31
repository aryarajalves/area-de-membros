import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StudentLessonSearchBar from './StudentLessonSearchBar';
import ModuleTimelineSidebar from './ModuleTimelineSidebar';

describe('Item 1 - Busca Instantânea e Filtro Rápido na Sidebar', () => {
  const sampleModules = [
    {
      id: 1,
      title: 'Módulo 1 - Comece Aqui',
      lessons: [
        { id: 101, title: 'Boas-vindas e Visão Geral', description: 'Introdução ao método' },
        { id: 102, title: 'Configurando seu Ambiente', description: 'Passo a passo inicial' }
      ]
    },
    {
      id: 2,
      title: 'Módulo 2 - Técnicas Avançadas',
      lessons: [
        { id: 201, title: 'Dominando Automações Complexas', description: 'Fluxos avançados' }
      ]
    }
  ];

  it('renderiza o campo de busca e as pílulas de filtro com contadores', () => {
    const onSearchChange = vi.fn();
    const onStatusFilterChange = vi.fn();

    render(
      <StudentLessonSearchBar
        searchQuery=""
        onSearchChange={onSearchChange}
        statusFilter="all"
        onStatusFilterChange={onStatusFilterChange}
        counts={{ all: 3, pending: 2, completed: 1 }}
      />
    );

    expect(screen.getByTestId('student-lesson-search-bar')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Buscar aula ou tema...')).toBeInTheDocument();
    expect(screen.getByTestId('student-filter-btn-all')).toHaveTextContent('Todas (3)');
    expect(screen.getByTestId('student-filter-btn-pending')).toHaveTextContent('Não Assistidas (2)');
    expect(screen.getByTestId('student-filter-btn-completed')).toHaveTextContent('Concluídas (1)');
  });

  it('permite digitar termo de busca e limpar pelo botão X', () => {
    const onSearchChange = vi.fn();
    const { rerender } = render(
      <StudentLessonSearchBar
        searchQuery=""
        onSearchChange={onSearchChange}
        statusFilter="all"
        onStatusFilterChange={vi.fn()}
      />
    );

    const input = screen.getByTestId('student-lesson-search-input');
    fireEvent.change(input, { target: { value: 'Ambiente' } });
    expect(onSearchChange).toHaveBeenCalledWith('Ambiente');

    // Rerenderiza com searchQuery preenchido para testar o botão limpar
    rerender(
      <StudentLessonSearchBar
        searchQuery="Ambiente"
        onSearchChange={onSearchChange}
        statusFilter="all"
        onStatusFilterChange={vi.fn()}
      />
    );

    const clearBtn = screen.getByTestId('student-lesson-search-clear-btn');
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('filtra as aulas em tempo real e auto-expande módulos correspondentes na ModuleTimelineSidebar', () => {
    render(
      <ModuleTimelineSidebar
        courseId={1}
        modules={sampleModules}
        selectedModule={sampleModules[0]}
        activeLesson={sampleModules[0].lessons[0]}
        completedLessonIds={[101]}
        totalLessonsCount={3}
        isManager={false}
        currentUser={{ id: 5, role: 'student' }}
      />
    );

    // Inicialmente exibe as aulas (idx + 1 prefixado no texto)
    expect(screen.getByTestId('lesson-title-101')).toHaveTextContent('Boas-vindas e Visão Geral');
    expect(screen.getByTestId('lesson-title-102')).toHaveTextContent('Configurando seu Ambiente');

    // Filtra pelo termo 'Ambiente'
    const searchInput = screen.getByTestId('student-lesson-search-input');
    fireEvent.change(searchInput, { target: { value: 'Ambiente' } });

    // Apenas a aula que contém 'Ambiente' deve aparecer
    expect(screen.getByTestId('lesson-title-102')).toHaveTextContent('Configurando seu Ambiente');
    expect(screen.queryByTestId('lesson-title-101')).not.toBeInTheDocument();
    expect(screen.queryByTestId('lesson-title-201')).not.toBeInTheDocument();

    // Limpa a busca
    fireEvent.change(searchInput, { target: { value: '' } });

    // Clica no filtro 'Concluídas' (somente aula 101 está em completedLessonIds)
    const completedFilterBtn = screen.getByTestId('student-filter-btn-completed');
    fireEvent.click(completedFilterBtn);

    expect(screen.getByTestId('lesson-title-101')).toHaveTextContent('Boas-vindas e Visão Geral');
    expect(screen.queryByTestId('lesson-title-102')).not.toBeInTheDocument();
  });
});
