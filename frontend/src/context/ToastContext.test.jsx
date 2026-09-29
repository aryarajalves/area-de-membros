import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { ToastProvider, useToast } from './ToastContext';

function TestConsumer({ triggerType, message }) {
  const { addToast } = useToast();
  return (
    <button
      onClick={() => addToast(message, triggerType)}
      data-testid="trigger-toast"
    >
      Trigger
    </button>
  );
}

describe('ToastContext & Toast Notifications', () => {
  it('renders success toast when triggered', () => {
    render(
      <ToastProvider>
        <TestConsumer triggerType="success" message="Link de convite copiado!" />
      </ToastProvider>
    );

    const triggerBtn = screen.getByTestId('trigger-toast');
    act(() => {
      triggerBtn.click();
    });

    expect(screen.getByText('Link de convite copiado!')).toBeInTheDocument();
    expect(screen.getByTestId('toast-success')).toBeInTheDocument();
  });

  it('renders error toast when triggered with error type', () => {
    render(
      <ToastProvider>
        <TestConsumer triggerType="error" message="Erro ao gerar convite." />
      </ToastProvider>
    );

    const triggerBtn = screen.getByTestId('trigger-toast');
    act(() => {
      triggerBtn.click();
    });

    expect(screen.getByText('Erro ao gerar convite.')).toBeInTheDocument();
    expect(screen.getByTestId('toast-error')).toBeInTheDocument();
  });
});
