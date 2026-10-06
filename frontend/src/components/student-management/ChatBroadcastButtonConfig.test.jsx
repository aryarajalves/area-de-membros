import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatBroadcastButtonConfig from './ChatBroadcastButtonConfig';

describe('ChatBroadcastButtonConfig Component', () => {
  const mockCourses = [
    { id: 1, title: 'Bússola Astrológica' },
    { id: 2, title: 'Astrowake' },
  ];

  it('renders collapsed state when enableButton is false and toggles open on click', () => {
    const setEnableButton = vi.fn();
    render(
      <ChatBroadcastButtonConfig
        enableButton={false}
        setEnableButton={setEnableButton}
        buttonText=""
        setButtonText={vi.fn()}
        buttonUrl=""
        setButtonUrl={vi.fn()}
        buttonActionType="url"
        setButtonActionType={vi.fn()}
        courses={mockCourses}
      />
    );

    expect(screen.getByText('Botão de Ação Interativo (CTA)')).toBeInTheDocument();
    expect(screen.queryByTestId('broadcast-button-text-input')).not.toBeInTheDocument();

    const toggle = screen.getByTestId('toggle-broadcast-button');
    fireEvent.click(toggle);
    expect(setEnableButton).toHaveBeenCalledWith(true);
  });

  it('renders inputs and live preview when enableButton is true', () => {
    const setButtonText = vi.fn();
    const setButtonUrl = vi.fn();
    const setButtonActionType = vi.fn();

    render(
      <ChatBroadcastButtonConfig
        enableButton={true}
        setEnableButton={vi.fn()}
        buttonText="Acessar Grupo VIP"
        setButtonText={setButtonText}
        buttonUrl="https://chat.whatsapp.com/123"
        setButtonUrl={setButtonUrl}
        buttonActionType="url"
        setButtonActionType={setButtonActionType}
        courses={mockCourses}
      />
    );

    expect(screen.getByTestId('broadcast-button-text-input')).toBeInTheDocument();
    expect(screen.getByTestId('broadcast-button-url-input')).toBeInTheDocument();
    expect(screen.getByTestId('button-action-url-btn')).toBeInTheDocument();
    expect(screen.getByTestId('button-action-course-btn')).toBeInTheDocument();
    expect(screen.getByTestId('button-action-lesson-btn')).toBeInTheDocument();

    // Pré-visualização ao vivo
    expect(screen.getByTestId('broadcast-button-preview')).toBeInTheDocument();
    expect(screen.getByText('Acessar Grupo VIP')).toBeInTheDocument();

    // Mudar texto
    fireEvent.change(screen.getByTestId('broadcast-button-text-input'), { target: { value: 'Novo Botão' } });
    expect(setButtonText).toHaveBeenCalledWith('Novo Botão');

    // Mudar tipo para curso
    fireEvent.click(screen.getByTestId('button-action-course-btn'));
    expect(setButtonActionType).toHaveBeenCalledWith('course');
  });

  it('renders course dropdown when buttonActionType is course', () => {
    const setButtonUrl = vi.fn();
    render(
      <ChatBroadcastButtonConfig
        enableButton={true}
        setEnableButton={vi.fn()}
        buttonText="Abrir Curso"
        setButtonText={vi.fn()}
        buttonUrl="/course/1"
        setButtonUrl={setButtonUrl}
        buttonActionType="course"
        setButtonActionType={vi.fn()}
        courses={mockCourses}
      />
    );

    const select = screen.getByTestId('broadcast-button-course-select');
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: '2' } });
    expect(setButtonUrl).toHaveBeenCalledWith('/course/2');
  });
});
