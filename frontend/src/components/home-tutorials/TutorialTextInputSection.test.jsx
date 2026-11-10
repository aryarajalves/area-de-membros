import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TutorialTextInputSection from './TutorialTextInputSection';

describe('TutorialTextInputSection', () => {
  it('renders write mode with textarea and toolbar buttons', () => {
    const onChangeText = vi.fn();
    const onChangeDuration = vi.fn();

    render(
      <TutorialTextInputSection
        textContent="Texto inicial de teste"
        onChangeText={onChangeText}
        duration="3 min"
        onChangeDuration={onChangeDuration}
      />
    );

    expect(screen.getByTestId('tutorial-text-content-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Escrever/i })).toBeInTheDocument();
    expect(screen.getByTestId('tab-preview-markdown')).toBeInTheDocument();
  });

  it('allows switching to preview tab and displays markdown preview', () => {
    const onChangeText = vi.fn();
    const onChangeDuration = vi.fn();

    render(
      <TutorialTextInputSection
        textContent={'# Titulo Principal\n## Subtitulo\n> Citação importante\n- Item de lista\n**Texto em negrito**'}
        onChangeText={onChangeText}
        duration="5 min"
        onChangeDuration={onChangeDuration}
      />
    );

    const previewBtn = screen.getByTestId('tab-preview-markdown');
    fireEvent.click(previewBtn);

    expect(screen.getByText('Titulo Principal')).toBeInTheDocument();
    expect(screen.getByText('Subtitulo')).toBeInTheDocument();
    expect(screen.getByText('Citação importante')).toBeInTheDocument();
    expect(screen.getByText('Item de lista')).toBeInTheDocument();
    expect(screen.getByText('Texto em negrito')).toBeInTheDocument();
  });

  it('calls onChangeText when typing in textarea', () => {
    const onChangeText = vi.fn();
    const onChangeDuration = vi.fn();

    render(
      <TutorialTextInputSection
        textContent=""
        onChangeText={onChangeText}
        duration=""
        onChangeDuration={onChangeDuration}
      />
    );

    const textarea = screen.getByTestId('tutorial-text-content-input');
    fireEvent.change(textarea, { target: { value: 'Novo conteúdo digitado' } });

    expect(onChangeText).toHaveBeenCalledWith('Novo conteúdo digitado');
  });

  it('inserts markdown tags when clicking toolbar buttons', () => {
    const onChangeText = vi.fn();
    const onChangeDuration = vi.fn();

    render(
      <TutorialTextInputSection
        textContent="Meu texto"
        onChangeText={onChangeText}
        duration="3 min"
        onChangeDuration={onChangeDuration}
      />
    );

    const boldBtn = screen.getByTitle('Negrito');
    fireEvent.click(boldBtn);

    expect(onChangeText).toHaveBeenCalled();
  });
});
