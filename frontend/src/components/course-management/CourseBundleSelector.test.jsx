import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CourseBundleSelector from './CourseBundleSelector';

describe('CourseBundleSelector Component', () => {
  const mockCourses = [
    { id: 1, title: 'Curso de Tráfego', item_type: 'course' },
    { id: 2, title: 'ZapVoice Web', item_type: 'tool' },
    { id: 3, title: 'Curso de Copywriting', item_type: 'course' }
  ];

  it('renderiza os cursos e ferramentas disponíveis para o combo', () => {
    render(
      <CourseBundleSelector
        availableCourses={mockCourses}
        currentCourseId={1}
        selectedCourseIds={[]}
        onChangeSelectedCourseIds={vi.fn()}
      />
    );

    expect(screen.getByText(/Produtos e Ferramentas Inclusos neste Pacote/i)).toBeInTheDocument();
    // Curso atual (id 1) não deve ser listado para evitar auto-associação
    expect(screen.queryByText('Curso de Tráfego')).not.toBeInTheDocument();
    // Outros devem aparecer
    expect(screen.getByText('ZapVoice Web')).toBeInTheDocument();
    expect(screen.getByText('Curso de Copywriting')).toBeInTheDocument();
  });

  it('permite selecionar e desmarcar itens chamando onChangeSelectedCourseIds', () => {
    const handleSelectionChange = vi.fn();
    render(
      <CourseBundleSelector
        availableCourses={mockCourses}
        currentCourseId={1}
        selectedCourseIds={[2]}
        onChangeSelectedCourseIds={handleSelectionChange}
      />
    );

    // Deve exibir badge de 1 incluído
    expect(screen.getByTestId('bundle-selected-count-badge')).toHaveTextContent('1 incluído(s)');

    // Clica no item 3 para incluir
    fireEvent.click(screen.getByTestId('bundle-item-3'));
    expect(handleSelectionChange).toHaveBeenCalledWith([2, 3]);

    // Clica no item 2 já selecionado para desmarcar
    fireEvent.click(screen.getByTestId('bundle-item-2'));
    expect(handleSelectionChange).toHaveBeenCalledWith([]);
  });

  it('exibe mensagem quando não há outros cursos cadastrados', () => {
    render(
      <CourseBundleSelector
        availableCourses={[{ id: 1, title: 'Curso Único', item_type: 'course' }]}
        currentCourseId={1}
        selectedCourseIds={[]}
        onChangeSelectedCourseIds={vi.fn()}
      />
    );

    expect(screen.getByText(/Não há outros cursos ou ferramentas cadastrados/i)).toBeInTheDocument();
  });
});
