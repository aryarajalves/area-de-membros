import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ExpandableTextarea from './ExpandableTextarea';

describe('ExpandableTextarea Component', () => {
  it('renders default compact textarea with label and maximize button', () => {
    const handleChange = vi.fn();
    render(
      <ExpandableTextarea
        label="Descrição da Aula"
        value="Texto inicial"
        onChange={handleChange}
        placeholder="Digite algo..."
        testId="test-desc-textarea"
        toggleTestId="test-desc-toggle-btn"
      />
    );

    expect(screen.getByText('Descrição da Aula')).toBeInTheDocument();
    const toggleBtn = screen.getByTestId('test-desc-toggle-btn');
    expect(toggleBtn).toBeInTheDocument();
    expect(toggleBtn).toHaveTextContent('Maximizar');

    const textarea = screen.getByTestId('test-desc-textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('Texto inicial');
    expect(textarea).toHaveAttribute('rows', '2');
    expect(textarea.style.minHeight).toBe('65px');
  });

  it('toggles expansion state when clicking maximize and restore', () => {
    render(
      <ExpandableTextarea
        label="Descrição do Módulo"
        value=""
        onChange={() => {}}
        testId="module-textarea"
        toggleTestId="module-toggle-btn"
      />
    );

    const toggleBtn = screen.getByTestId('module-toggle-btn');
    const textarea = screen.getByTestId('module-textarea');

    // Inicialmente compacto
    expect(toggleBtn).toHaveTextContent('Maximizar');
    expect(textarea).toHaveAttribute('rows', '2');

    // Clica para maximizar
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent('Restaurar');
    expect(textarea).toHaveAttribute('rows', '8');
    expect(textarea.style.minHeight).toBe('230px');

    // Clica novamente para restaurar
    fireEvent.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent('Maximizar');
    expect(textarea).toHaveAttribute('rows', '2');
    expect(textarea.style.minHeight).toBe('65px');
  });

  it('triggers onChange when user types in textarea', () => {
    const handleChange = vi.fn();
    render(
      <ExpandableTextarea
        label="Descrição"
        value=""
        onChange={handleChange}
        testId="desc-textarea"
      />
    );

    const textarea = screen.getByTestId('desc-textarea');
    fireEvent.change(textarea, { target: { value: 'Nova descrição detalhada' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('opens giant fullscreen popup modal when clicking Tela Cheia and allows editing', () => {
    const handleChange = vi.fn();
    render(
      <ExpandableTextarea
        label="Descrição do Curso"
        value="Esse é o curso da bussola astrologica"
        onChange={handleChange}
        testId="course-desc-textarea"
        fullscreenTestId="course-desc-fullscreen-btn"
      />
    );

    // Botão de tela cheia renderizado
    const fullscreenBtn = screen.getByTestId('course-desc-fullscreen-btn');
    expect(fullscreenBtn).toBeInTheDocument();
    expect(fullscreenBtn).toHaveTextContent('Tela Cheia');

    // Inicialmente o modal não está aberto
    expect(screen.queryByTestId('fullscreen-textarea-modal')).not.toBeInTheDocument();

    // Clica para abrir o popup gigante de tela cheia
    fireEvent.click(fullscreenBtn);

    // Modal gigante no meio da tela
    expect(screen.getByTestId('fullscreen-textarea-modal')).toBeInTheDocument();
    expect(screen.getByTestId('fullscreen-modal-title')).toHaveTextContent('Descrição do Curso — Modo Tela Cheia');
    expect(screen.getByTestId('fullscreen-char-counter')).toHaveTextContent('7 palavras • 37 caracteres');

    // Textarea gigante dentro do popup
    const fullscreenTextarea = screen.getByTestId('course-desc-textarea-fullscreen');
    expect(fullscreenTextarea).toBeInTheDocument();
    expect(fullscreenTextarea).toHaveValue('Esse é o curso da bussola astrologica');

    // Digitação no modal gigante
    fireEvent.change(fullscreenTextarea, { target: { value: 'Texto expandido em tela cheia' } });
    expect(handleChange).toHaveBeenCalled();

    // Fecha ao clicar em Concluir Edição
    const finishBtn = screen.getByTestId('finish-fullscreen-btn');
    fireEvent.click(finishBtn);
    expect(screen.queryByTestId('fullscreen-textarea-modal')).not.toBeInTheDocument();
  });

  it('closes giant fullscreen popup modal when pressing Escape key', () => {
    render(
      <ExpandableTextarea
        label="Descrição"
        value="Texto de exemplo"
        onChange={() => {}}
        fullscreenTestId="esc-fullscreen-btn"
      />
    );

    // Abre o popup
    fireEvent.click(screen.getByTestId('esc-fullscreen-btn'));
    expect(screen.getByTestId('fullscreen-textarea-modal')).toBeInTheDocument();

    // Pressiona Esc
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByTestId('fullscreen-textarea-modal')).not.toBeInTheDocument();
  });

  it('closes giant fullscreen popup modal when clicking the close X button', () => {
    render(
      <ExpandableTextarea
        label="Descrição"
        value="Texto"
        onChange={() => {}}
        fullscreenTestId="close-fullscreen-btn-test"
      />
    );

    // Abre o popup
    fireEvent.click(screen.getByTestId('close-fullscreen-btn-test'));
    expect(screen.getByTestId('fullscreen-textarea-modal')).toBeInTheDocument();

    // Clica no botão X
    fireEvent.click(screen.getByTestId('close-fullscreen-btn'));
    expect(screen.queryByTestId('fullscreen-textarea-modal')).not.toBeInTheDocument();
  });
});
