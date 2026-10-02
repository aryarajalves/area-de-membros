import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LessonVideoManager from './LessonVideoManager';

describe('LessonVideoManager Component', () => {
  it('renders default Portuguese tab and allows switching video type', () => {
    const onChange = vi.fn();
    render(
      <LessonVideoManager
        videos={[{ language: 'pt', language_label: 'Português', video_url: '', video_type: 'upload' }]}
        onChange={onChange}
        onUploadVideo={vi.fn()}
        uploading={false}
        setUploading={vi.fn()}
      />
    );

    expect(screen.getByText('Vídeos da Aula por Idioma')).toBeInTheDocument();
    expect(screen.getByTestId('lang-tab-pt')).toBeInTheDocument();

    // Alternar para Link Externo
    fireEvent.click(screen.getByTestId('tab-url-video'));
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ language: 'pt', video_type: 'url' })
    ]));
  });

  it('allows adding a new language and removing language tracks', () => {
    const onChange = vi.fn();
    render(
      <LessonVideoManager
        videos={[
          { language: 'pt', language_label: 'Português', video_url: 'https://b2.com/pt.mp4', video_type: 'upload' },
          { language: 'en', language_label: 'Inglês', video_url: 'https://b2.com/en.mp4', video_type: 'upload' }
        ]}
        onChange={onChange}
        onUploadVideo={vi.fn()}
        uploading={false}
        setUploading={vi.fn()}
      />
    );

    // Remover Inglês - abre popup de confirmação
    fireEvent.click(screen.getByTestId('remove-lang-en'));
    expect(screen.getByTestId('file-delete-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText(/Remover Idioma \(Inglês\)\?/i)).toBeInTheDocument();

    // Confirmar exclusão
    fireEvent.click(screen.getByTestId('confirm-file-delete-btn'));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ language: 'pt' })
    ]);
  });

  it('opens confirmation modal before removing uploaded video and proceeds only on confirm', () => {
    const onChange = vi.fn();
    render(
      <LessonVideoManager
        videos={[
          { language: 'pt', language_label: 'Português', video_url: 'https://b2.com/pt.mp4', video_type: 'upload' }
        ]}
        onChange={onChange}
        onUploadVideo={vi.fn()}
        uploading={false}
        setUploading={vi.fn()}
      />
    );

    const removeVideoBtn = screen.getByTestId('remove-video-btn');
    fireEvent.click(removeVideoBtn);

    // Deve abrir o modal de confirmação
    expect(screen.getByTestId('file-delete-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Remover Vídeo da Aula?')).toBeInTheDocument();

    // Confirmar exclusão
    fireEvent.click(screen.getByTestId('confirm-file-delete-btn'));
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ language: 'pt', video_url: '' })
    ]);
  });

  it('renders upload progress modal when uploading is true', () => {
    render(
      <LessonVideoManager
        videos={[{ language: 'pt', language_label: 'Português', video_url: '', video_type: 'upload' }]}
        onChange={vi.fn()}
        onUploadVideo={vi.fn()}
        uploading={true}
        setUploading={vi.fn()}
      />
    );

    expect(screen.getByTestId('upload-progress-modal')).toBeInTheDocument();
    expect(screen.getByText('Enviando vídeo da aula...')).toBeInTheDocument();
    expect(screen.getByText(/Aguarde o envio seguro para o Backblaze B2/i)).toBeInTheDocument();
  });

  it('displays 2 GB upload limit and defaults to Upload tab', () => {
    render(
      <LessonVideoManager
        videos={[{ language: 'pt', language_label: 'Português', video_url: '', video_type: 'upload' }]}
        onChange={vi.fn()}
        onUploadVideo={vi.fn()}
        uploading={false}
        setUploading={vi.fn()}
      />
    );

    expect(screen.getByText(/até 2 GB/i)).toBeInTheDocument();
    expect(screen.getByTestId('tab-upload-video')).toHaveClass('primary-btn');
    expect(screen.getByText('Escolher Vídeo do Computador')).toBeInTheDocument();
  });

  it('renders and updates title and description fields for the active language', () => {
    const onChange = vi.fn();
    render(
      <LessonVideoManager
        videos={[{ language: 'pt', language_label: 'Português', title: 'Aula em PT', description: 'Desc em PT', video_url: '', video_type: 'upload' }]}
        onChange={onChange}
        onUploadVideo={vi.fn()}
        uploading={false}
        setUploading={vi.fn()}
      />
    );

    const titleInput = screen.getByTestId('lesson-lang-title-input-pt');
    expect(titleInput).toBeInTheDocument();
    expect(titleInput).toHaveValue('Aula em PT');

    const descInput = screen.getByTestId('lesson-lang-desc-input-pt');
    expect(descInput).toBeInTheDocument();
    expect(descInput).toHaveValue('Desc em PT');

    fireEvent.change(titleInput, { target: { value: 'Aula Atualizada PT' } });
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ language: 'pt', title: 'Aula Atualizada PT' })
    ]));
  });

  it('renders language_label input and allows changing the custom language name', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <LessonVideoManager
        videos={[{ language: 'pt', language_label: 'Português', title: '', description: '', video_url: '', video_type: 'upload' }]}
        onChange={onChange}
        onUploadVideo={vi.fn()}
        uploading={false}
        setUploading={vi.fn()}
      />
    );

    const labelInput = screen.getByTestId('lesson-lang-label-input-pt');
    expect(labelInput).toBeInTheDocument();
    expect(labelInput).toHaveValue('Português');

    fireEvent.change(labelInput, { target: { value: 'Português (Brasil)' } });
    expect(onChange).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ language: 'pt', language_label: 'Português (Brasil)' })
    ]));

    // Rerenderiza com o nome atualizado para comprovar que a aba e os labels refletem o novo nome
    rerender(
      <LessonVideoManager
        videos={[{ language: 'pt', language_label: 'Português (Brasil)', title: '', description: '', video_url: '', video_type: 'upload' }]}
        onChange={onChange}
        onUploadVideo={vi.fn()}
        uploading={false}
        setUploading={vi.fn()}
      />
    );

    expect(screen.getByTestId('lang-tab-pt')).toHaveTextContent('Português (Brasil)');
    expect(screen.getByText('Nome da Aula em Português (Brasil)')).toBeInTheDocument();
  });

  it('handles video file upload and triggers onUploadVideo with progress callback', async () => {
    const onChange = vi.fn();
    const setUploading = vi.fn();
    const onUploadVideo = vi.fn().mockImplementation(async (file, onProgress) => {
      onProgress(50);
      return 'https://s3.backblazeb2.com/video.mp4';
    });

    render(
      <LessonVideoManager
        videos={[{ language: 'pt', language_label: 'Português', video_url: '', video_type: 'upload' }]}
        onChange={onChange}
        onUploadVideo={onUploadVideo}
        uploading={false}
        setUploading={setUploading}
      />
    );

    const file = new File(['dummy video content'], 'aula.mp4', { type: 'video/mp4' });
    const input = document.getElementById('lesson-video-file-input-pt');
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(setUploading).toHaveBeenCalledWith(true);
    expect(onUploadVideo).toHaveBeenCalled();
  });
});

