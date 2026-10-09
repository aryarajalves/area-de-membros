import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LessonVideoPreviewPlayer from './LessonVideoPreviewPlayer';

describe('LessonVideoPreviewPlayer Component', () => {
  it('renders nothing when videoUrl is null or empty', () => {
    const { container } = render(<LessonVideoPreviewPlayer videoUrl="" onRemove={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders native video player with controls for direct video files', () => {
    render(
      <LessonVideoPreviewPlayer
        videoUrl="https://s3.backblazeb2.com/videos/aula-01.mp4"
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByText('Vídeo Anexado à Aula')).toBeInTheDocument();
    const video = screen.getByTestId('lesson-video-preview-player');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://s3.backblazeb2.com/videos/aula-01.mp4');
    expect(video).toHaveAttribute('controls');
  });

  it('renders iframe for YouTube embed URLs', () => {
    render(
      <LessonVideoPreviewPlayer
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        onRemove={vi.fn()}
      />
    );

    const iframe = screen.getByTestId('lesson-video-preview-iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe.src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('calls onRemove when clicking Remover Vídeo button', () => {
    const handleRemove = vi.fn();
    render(
      <LessonVideoPreviewPlayer
        videoUrl="https://s3.backblazeb2.com/videos/aula-01.mp4"
        onRemove={handleRemove}
      />
    );

    const removeBtn = screen.getByTestId('remove-video-btn');
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });
});
