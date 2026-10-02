import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonArticleEditor from './LessonArticleEditor';

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() })
}));

describe('LessonArticleEditor Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders editor tabs and typing updates textContent', () => {
    const handleChange = vi.fn();
    render(
      <LessonArticleEditor
        textContent="Texto base"
        onChange={handleChange}
      />
    );

    const textarea = screen.getByTestId('lesson-text-content-input');
    expect(textarea).toHaveValue('Texto base');

    fireEvent.change(textarea, { target: { value: 'Texto alterado' } });
    expect(handleChange).toHaveBeenCalledWith('Texto alterado');
  });

  it('allows inserting title, bold and list formatting via toolbar buttons', () => {
    const handleChange = vi.fn();
    render(
      <LessonArticleEditor
        textContent=""
        onChange={handleChange}
      />
    );

    // Clica no botão de negrito
    const boldBtn = screen.getByTitle('Texto em Negrito');
    fireEvent.click(boldBtn);
    expect(handleChange).toHaveBeenCalledWith(expect.stringContaining('**texto em destaque**'));
  });

  it('allows uploading image from PC and inserts markdown image tag', async () => {
    const handleChange = vi.fn();
    const mockUpload = vi.fn().mockResolvedValue('https://b2.com/foto_aula.png');

    render(
      <LessonArticleEditor
        textContent="Meu artigo inicial"
        onChange={handleChange}
        onUploadImage={mockUpload}
      />
    );

    const fileInput = screen.getByTestId('article-image-file-input');
    const fakeFile = new File(['fake image content'], 'diagrama.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith(fakeFile);
      expect(handleChange).toHaveBeenCalledWith(
        expect.stringContaining('![diagrama](https://b2.com/foto_aula.png)')
      );
    });
  });

  it('allows inserting external image URL and renders preview', () => {
    const handleChange = vi.fn();
    render(
      <LessonArticleEditor
        textContent={`![Capa](https://b2.com/capa.png)\n\n## Subtítulo`}
        onChange={handleChange}
      />
    );

    // Alterna para aba de pré-visualização
    const previewTab = screen.getByTestId('article-tab-preview-btn');
    fireEvent.click(previewTab);

    const previewContainer = screen.getByTestId('article-preview-container');
    expect(previewContainer).toBeInTheDocument();
    expect(screen.getByAltText('Capa')).toHaveAttribute('src', 'https://b2.com/capa.png');
    expect(screen.getByText('Subtítulo')).toBeInTheDocument();
  });
});
