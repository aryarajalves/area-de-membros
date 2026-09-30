import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LessonThumbnailManager from './LessonThumbnailManager';

describe('LessonThumbnailManager Component', () => {
  it('renders thumbnail specifications (1280x720, 16:9, max 5 MB)', () => {
    render(
      <LessonThumbnailManager
        thumbnailUrl=""
        onChange={vi.fn()}
        onUploadThumbnail={vi.fn()}
      />
    );

    expect(screen.getByText('Capa do Vídeo da Aula (Thumbnail / Poster)')).toBeInTheDocument();
    expect(screen.getByText(/1280 × 720 pixels/i)).toBeInTheDocument();
    expect(screen.getByText(/16:9/i)).toBeInTheDocument();
    expect(screen.getByText(/máx\. 5 MB/i)).toBeInTheDocument();
    expect(screen.getByText('Fazer Upload da Capa')).toBeInTheDocument();
  });

  it('renders preview and allows removing the thumbnail', () => {
    const onChange = vi.fn();
    render(
      <LessonThumbnailManager
        thumbnailUrl="https://b2.com/poster.jpg"
        onChange={onChange}
        onUploadThumbnail={vi.fn()}
      />
    );

    const img = screen.getByTestId('lesson-thumbnail-preview');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://b2.com/poster.jpg');

    const removeBtn = screen.getByTestId('remove-lesson-thumbnail-btn');
    fireEvent.click(removeBtn);

    // Deve abrir o popup de confirmação de exclusão
    expect(screen.getByTestId('file-delete-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Remover Capa da Aula?')).toBeInTheDocument();

    // Confirmar exclusão no popup
    const confirmDeleteBtn = screen.getByTestId('confirm-file-delete-btn');
    fireEvent.click(confirmDeleteBtn);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('uploads valid image file and triggers onChange with uploaded URL', async () => {
    const onChange = vi.fn();
    const onUploadThumbnail = vi.fn().mockResolvedValue('https://b2.com/new-poster.png');

    render(
      <LessonThumbnailManager
        thumbnailUrl=""
        onChange={onChange}
        onUploadThumbnail={onUploadThumbnail}
      />
    );

    const file = new File(['dummy-image-bytes'], 'poster.png', { type: 'image/png' });
    const input = screen.getByTestId('lesson-thumbnail-file-input');

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onUploadThumbnail).toHaveBeenCalledWith(file);
      expect(onChange).toHaveBeenCalledWith('https://b2.com/new-poster.png');
    });
  });
});
