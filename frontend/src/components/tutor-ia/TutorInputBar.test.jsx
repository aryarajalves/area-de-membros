import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorInputBar from './TutorInputBar';

describe('TutorInputBar Component', () => {
  it('renders input bar and shows quota count', () => {
    render(
      <TutorInputBar
        onSendMessage={vi.fn()}
        canAsk={true}
        remainingQuestions={2}
        totalLimit={3}
      />
    );

    expect(screen.getByText(/2 de 3 perguntas gratuitas restantes/)).toBeInTheDocument();
    expect(screen.getByTestId('input-tutor-message')).not.toBeDisabled();
  });

  it('allows typing and triggers onSendMessage when clicking send button', () => {
    const onSendMessage = vi.fn();
    render(
      <TutorInputBar
        onSendMessage={onSendMessage}
        canAsk={true}
        remainingQuestions={2}
        totalLimit={3}
      />
    );

    const input = screen.getByTestId('input-tutor-message');
    fireEvent.change(input, { target: { value: 'Minha dúvida sobre a aula' } });

    const sendBtn = screen.getByTestId('btn-send-tutor-message');
    fireEvent.click(sendBtn);

    expect(onSendMessage).toHaveBeenCalledWith('Minha dúvida sobre a aula');
  });

  it('triggers onSendMessage on Ctrl+Enter', () => {
    const onSendMessage = vi.fn();
    render(
      <TutorInputBar
        onSendMessage={onSendMessage}
        canAsk={true}
        remainingQuestions={2}
        totalLimit={3}
      />
    );

    const input = screen.getByTestId('input-tutor-message');
    fireEvent.change(input, { target: { value: 'Dúvida via atalho' } });
    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });

    expect(onSendMessage).toHaveBeenCalledWith('Dúvida via atalho');
  });

  it('disables input when canAsk is false', () => {
    render(
      <TutorInputBar
        onSendMessage={vi.fn()}
        canAsk={false}
        remainingQuestions={0}
        totalLimit={3}
      />
    );

    expect(screen.getByTestId('input-tutor-message')).toBeDisabled();
    expect(screen.getByTestId('btn-send-tutor-message')).toBeDisabled();
  });
});
