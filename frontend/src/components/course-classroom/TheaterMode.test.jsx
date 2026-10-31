import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TheaterModeToggleBtn from './TheaterModeToggleBtn';
import LessonPlayer from './LessonPlayer';
import { ToastProvider } from '../../context/ToastContext';

describe('Item 6 - Botão de Modo Cinema / Teatro', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renderiza o botão de alternância de Modo Teatro com estados visuais corretos', () => {
    const onToggle = vi.fn();

    const { rerender } = render(
      <TheaterModeToggleBtn
        isTheaterMode={false}
        onToggleTheaterMode={onToggle}
      />
    );

    const btn = screen.getByTestId('theater-mode-toggle-btn');
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent('Modo Teatro');

    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);

    // Rerenderiza com isTheaterMode=true
    rerender(
      <TheaterModeToggleBtn
        isTheaterMode={true}
        onToggleTheaterMode={onToggle}
      />
    );

    expect(btn).toHaveTextContent('Modo Normal');
  });

  it('no LessonPlayer, clicar em Modo Teatro expande a tela e recolhe a sidebar lateral direita', () => {
    const sampleLesson = {
      id: 1,
      title: 'Aula de Astrologia Prática',
      video_url: 'https://cdn.example.com/video.mp4',
      duration: '15:00'
    };

    render(
      <ToastProvider>
        <LessonPlayer
          lesson={sampleLesson}
          rightSidebar={<div data-testid="test-right-sidebar">Barra Lateral de Módulos</div>}
        />
      </ToastProvider>
    );

    // Inicialmente a barra lateral está visível
    expect(screen.getByTestId('test-right-sidebar')).toBeInTheDocument();

    const theaterBtn = screen.getByTestId('theater-mode-toggle-btn');
    expect(theaterBtn).toHaveTextContent('Modo Teatro');

    // Clica para ativar o Modo Teatro
    fireEvent.click(theaterBtn);

    // O botão muda para Modo Normal e a sidebar lateral direita é recolhida
    expect(theaterBtn).toHaveTextContent('Modo Normal');
    expect(screen.queryByTestId('test-right-sidebar')).not.toBeInTheDocument();

    // Clica novamente para voltar ao Modo Normal
    fireEvent.click(theaterBtn);
    expect(theaterBtn).toHaveTextContent('Modo Teatro');
    expect(screen.getByTestId('test-right-sidebar')).toBeInTheDocument();
  });
});
