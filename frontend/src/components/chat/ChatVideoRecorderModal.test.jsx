import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatVideoRecorderModal from './ChatVideoRecorderModal';
import { ToastProvider } from '../../context/ToastContext';

describe('ChatVideoRecorderModal Component', () => {
  const mockTrack = { stop: vi.fn() };
  const mockStream = {
    getTracks: () => [mockTrack],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/mock-video');
    global.URL.revokeObjectURL = vi.fn();

    vi.stubGlobal('navigator', {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    function MockMediaRecorder() {
      return {
        start: vi.fn(),
        stop: vi.fn(),
        ondataavailable: null,
        onstop: null,
        state: 'recording',
      };
    }
    MockMediaRecorder.isTypeSupported = vi.fn().mockReturnValue(true);
    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
  });

  const renderComponent = (props = {}) => {
    return render(
      <ToastProvider>
        <ChatVideoRecorderModal
          onSendRecordedVideo={vi.fn().mockResolvedValue(true)}
          onClose={vi.fn()}
          {...props}
        />
      </ToastProvider>
    );
  };

  it('initializes camera and renders start recording button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({ audio: true })
      );
      expect(screen.getByTestId('start-video-record-btn')).toBeInTheDocument();
    });
  });

  it('starts recording and displays timer and stop recording button', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('start-video-record-btn')).toBeInTheDocument();
    });

    const startBtn = screen.getByTestId('start-video-record-btn');
    fireEvent.click(startBtn);

    expect(screen.getByTestId('stop-video-record-btn')).toBeInTheDocument();
    expect(screen.getByTestId('recording-timer-badge')).toBeInTheDocument();
  });

  it('calls onClose and stops media tracks when clicking close button', async () => {
    const handleClose = vi.fn();
    renderComponent({ onClose: handleClose });

    await waitFor(() => {
      expect(screen.getByTestId('close-video-recorder-btn')).toBeInTheDocument();
    });

    const closeBtn = screen.getByTestId('close-video-recorder-btn');
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(mockTrack.stop).toHaveBeenCalled();
  });
});
