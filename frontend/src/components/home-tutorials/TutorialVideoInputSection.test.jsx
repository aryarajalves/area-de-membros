import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TutorialVideoInputSection from './TutorialVideoInputSection';

describe('TutorialVideoInputSection Component', () => {
  it('renders upload mode and switches between upload and url tabs', () => {
    const setVideoType = vi.fn();
    render(
      <TutorialVideoInputSection
        videoType="upload"
        setVideoType={setVideoType}
        isEditing={false}
        videoUrl=""
        setVideoUrl={vi.fn()}
        selectedFile={null}
        handleFileChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('tutorial-video-type-upload-btn')).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-file-input')).toBeInTheDocument();

    const urlBtn = screen.getByTestId('tutorial-video-type-url-btn');
    fireEvent.click(urlBtn);
    expect(setVideoType).toHaveBeenCalledWith('url');
  });

  it('renders url input when videoType is "url"', () => {
    const setVideoUrl = vi.fn();
    render(
      <TutorialVideoInputSection
        videoType="url"
        setVideoType={vi.fn()}
        isEditing={false}
        videoUrl="https://youtube.com/watch?v=123"
        setVideoUrl={setVideoUrl}
        selectedFile={null}
        handleFileChange={vi.fn()}
      />
    );

    const input = screen.getByTestId('tutorial-video-url-input');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('https://youtube.com/watch?v=123');
    fireEvent.change(input, { target: { value: 'https://youtube.com/watch?v=456' } });
    expect(setVideoUrl).toHaveBeenCalledWith('https://youtube.com/watch?v=456');
  });

  it('displays selected file feedback when a file is provided', () => {
    const mockFile = new File(['dummy'], 'tutorial_aula.mp4', { type: 'video/mp4' });
    render(
      <TutorialVideoInputSection
        videoType="upload"
        setVideoType={vi.fn()}
        isEditing={false}
        videoUrl=""
        setVideoUrl={vi.fn()}
        selectedFile={mockFile}
        handleFileChange={vi.fn()}
      />
    );

    expect(screen.getByText(/tutorial_aula\.mp4/i)).toBeInTheDocument();
  });
});
