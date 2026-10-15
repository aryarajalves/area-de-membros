import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatImageCaptionModal from './ChatImageCaptionModal';

describe('ChatImageCaptionModal Component', () => {
  const fakeFile = new File(['fake content'], 'screenshot.png', { type: 'image/png' });

  beforeAll(() => {
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-preview');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders image preview and allows typing caption', () => {
    const handleConfirm = vi.fn();
    const handleCancel = vi.fn();

    render(
      <ChatImageCaptionModal
        imageFile={fakeFile}
        initialCaption="Olha essa tela"
        onConfirmSend={handleConfirm}
        onCancel={handleCancel}
      />
    );

    expect(screen.getByTestId('chat-image-caption-modal')).toBeInTheDocument();
    expect(screen.getByTestId('image-caption-preview')).toBeInTheDocument();

    const captionInput = screen.getByTestId('image-caption-input');
    expect(captionInput).toHaveValue('Olha essa tela');

    fireEvent.change(captionInput, { target: { value: 'Nova legenda' } });
    expect(captionInput).toHaveValue('Nova legenda');
  });

  it('calls onConfirmSend when clicking send button', () => {
    const handleConfirm = vi.fn();

    render(
      <ChatImageCaptionModal
        imageFile={fakeFile}
        initialCaption="Teste"
        onConfirmSend={handleConfirm}
        onCancel={vi.fn()}
      />
    );

    const sendBtn = screen.getByTestId('send-image-caption-btn');
    fireEvent.click(sendBtn);

    expect(handleConfirm).toHaveBeenCalledWith('Teste');
  });

  it('calls onCancel when clicking cancel button or close button', () => {
    const handleCancel = vi.fn();

    render(
      <ChatImageCaptionModal
        imageFile={fakeFile}
        onConfirmSend={vi.fn()}
        onCancel={handleCancel}
      />
    );

    const cancelBtn = screen.getByTestId('cancel-image-caption-btn');
    fireEvent.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
