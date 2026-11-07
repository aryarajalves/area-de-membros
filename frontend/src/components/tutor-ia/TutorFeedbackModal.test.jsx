import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TutorFeedbackModal from './TutorFeedbackModal';

describe('TutorFeedbackModal Component', () => {
  it('renders correctly and submits feedback with text', async () => {
    const handleSubmit = vi.fn().mockResolvedValue({});
    const handleClose = vi.fn();

    render(
      <TutorFeedbackModal
        isOpen={true}
        messageId={42}
        onClose={handleClose}
        onSubmitFeedback={handleSubmit}
      />
    );

    expect(screen.getByText('Como podemos melhorar esta resposta?')).toBeInTheDocument();

    const textarea = screen.getByTestId('textarea-feedback-reason');
    fireEvent.change(textarea, { target: { value: 'O minuto citado não existia no vídeo.' } });

    const submitBtn = screen.getByTestId('btn-submit-feedback');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        messageId: 42,
        rating: 'dislike',
        feedbackText: 'O minuto citado não existia no vídeo.'
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('allows submitting without feedback text (empty optional reason)', async () => {
    const handleSubmit = vi.fn().mockResolvedValue({});
    const handleClose = vi.fn();

    render(
      <TutorFeedbackModal
        isOpen={true}
        messageId={42}
        onClose={handleClose}
        onSubmitFeedback={handleSubmit}
      />
    );

    const submitBtn = screen.getByTestId('btn-submit-feedback');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        messageId: 42,
        rating: 'dislike',
        feedbackText: null
      });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it('does not render anything when isOpen is false', () => {
    const { container } = render(
      <TutorFeedbackModal
        isOpen={false}
        messageId={42}
        onClose={vi.fn()}
        onSubmitFeedback={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
