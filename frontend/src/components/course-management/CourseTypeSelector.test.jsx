import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CourseTypeSelector from './CourseTypeSelector';

describe('CourseTypeSelector Component', () => {
  it('renderiza os botões de tipo de conteúdo Curso e Ferramenta', () => {
    render(
      <CourseTypeSelector
        itemType="course"
        onChangeItemType={vi.fn()}
        toolUrl=""
        onChangeToolUrl={vi.fn()}
      />
    );

    expect(screen.getByText('Tipo do Conteúdo *')).toBeInTheDocument();
    expect(screen.getByText('Curso Completo')).toBeInTheDocument();
    expect(screen.getByText('Ferramenta / App')).toBeInTheDocument();
    // No modo course, o campo de URL da ferramenta não deve estar visível
    expect(screen.queryByTestId('tool-url-field-container')).not.toBeInTheDocument();
  });

  it('exibe o campo de link da ferramenta quando o itemType for tool', () => {
    render(
      <CourseTypeSelector
        itemType="tool"
        onChangeItemType={vi.fn()}
        toolUrl="https://app.test.com"
        onChangeToolUrl={vi.fn()}
      />
    );

    expect(screen.getByTestId('tool-url-field-container')).toBeInTheDocument();
    expect(screen.getByLabelText(/Link de Acesso da Ferramenta/i)).toBeInTheDocument();
    const input = screen.getByTestId('course-tool-url-input');
    expect(input).toHaveValue('https://app.test.com');
  });

  it('chama onChangeItemType ao clicar nas opções', () => {
    const handleChangeType = vi.fn();
    render(
      <CourseTypeSelector
        itemType="course"
        onChangeItemType={handleChangeType}
        toolUrl=""
        onChangeToolUrl={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('item-type-tool-btn'));
    expect(handleChangeType).toHaveBeenCalledWith('tool');
  });

  it('chama onChangeToolUrl ao digitar no campo de link', () => {
    const handleChangeUrl = vi.fn();
    render(
      <CourseTypeSelector
        itemType="tool"
        onChangeItemType={vi.fn()}
        toolUrl=""
        onChangeToolUrl={handleChangeUrl}
      />
    );

    const input = screen.getByTestId('course-tool-url-input');
    fireEvent.change(input, { target: { value: 'https://meuapp.com' } });
    expect(handleChangeUrl).toHaveBeenCalledWith('https://meuapp.com');
  });
});
