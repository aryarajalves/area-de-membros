import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TutorQuickPrompts from './TutorQuickPrompts';

describe('TutorQuickPrompts Component', () => {
  const sampleQuestions = [
    'O que é o retorno de Saturno?',
    'Como calcular os aspectos planetários?',
    'Qual a diferença entre signos e casas?'
  ];

  it('renders questions and calls onSelectQuestion when a chip is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <TutorQuickPrompts
        questions={sampleQuestions}
        onSelectQuestion={handleSelect}
        hasCustomQa={true}
      />
    );

    expect(screen.getByText('Dúvidas frequentes desta aula (clique para perguntar):')).toBeInTheDocument();
    expect(screen.getByText('Baseado no vídeo')).toBeInTheDocument();
    expect(screen.getByText('O que é o retorno de Saturno?')).toBeInTheDocument();

    const firstBtn = screen.getByTestId('btn-quick-prompt-0');
    fireEvent.click(firstBtn);
    expect(handleSelect).toHaveBeenCalledWith('O que é o retorno de Saturno?');
  });

  it('disables buttons when disabled prop is true', () => {
    const handleSelect = vi.fn();
    render(
      <TutorQuickPrompts
        questions={sampleQuestions}
        onSelectQuestion={handleSelect}
        disabled={true}
      />
    );

    const firstBtn = screen.getByTestId('btn-quick-prompt-0');
    expect(firstBtn).toBeDisabled();
    fireEvent.click(firstBtn);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('returns null when questions array is empty', () => {
    const { container } = render(<TutorQuickPrompts questions={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
