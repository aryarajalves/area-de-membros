import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorEmptyState from './TutorEmptyState';

describe('TutorEmptyState Component', () => {
  it('renders welcome message and quick prompts in empty chat state', () => {
    const onSelect = vi.fn();
    render(
      <TutorEmptyState
        textColor="#fff"
        subTextColor="#aaa"
        suggestedQuestions={{
          questions: ['O que é trânsito de Saturno?'],
          hasCustomQa: true
        }}
        onSelectQuestion={onSelect}
        disabled={false}
        isLightBg={false}
        tutorName="Sofia IA"
      />
    );

    expect(screen.getByTestId('tutor-empty-state')).toBeInTheDocument();
    expect(screen.getByText(/Como posso te ajudar com esta aula hoje\?/i)).toBeInTheDocument();
    expect(screen.getByText('O que é trânsito de Saturno?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('O que é trânsito de Saturno?'));
    expect(onSelect).toHaveBeenCalledWith('O que é trânsito de Saturno?');
  });
});
