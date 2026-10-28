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

  it('allows changing existing thumbnail directly without having to remove first', async () => {
    const onChange = vi.fn();
    const onUploadThumbnail = vi.fn().mockResolvedValue('https://b2.com/replaced-poster.jpg');

    render(
      <LessonThumbnailManager
        thumbnailUrl="https://b2.com/old-poster.jpg"
        onChange={onChange}
        onUploadThumbnail={onUploadThumbnail}
      />
    );

    // Botão de trocar deve estar presente
    const changeBtn = screen.getByTestId('change-lesson-thumbnail-btn');
    expect(changeBtn).toBeInTheDocument();
    expect(changeBtn).toHaveTextContent('Trocar Imagem de Capa');

    // Input de arquivo continua acessível
    const input = screen.getByTestId('lesson-thumbnail-file-input');
    const newFile = new File(['new-bytes'], 'replaced-poster.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [newFile] } });

    await waitFor(() => {
      expect(onUploadThumbnail).toHaveBeenCalledWith(newFile);
      expect(onChange).toHaveBeenCalledWith('https://b2.com/replaced-poster.jpg');
    });
  });

  it('exibe modal centralizado de progresso (UploadProgressModal) durante o envio da imagem', async () => {
    let resolveUpload;
    const uploadPromise = new Promise((resolve) => {
      resolveUpload = resolve;
    });
    const onUploadThumbnail = vi.fn().mockReturnValue(uploadPromise);

    render(
      <LessonThumbnailManager
        thumbnailUrl=""
        onChange={vi.fn()}
        onUploadThumbnail={onUploadThumbnail}
      />
    );

    const input = screen.getByTestId('lesson-thumbnail-file-input');
    const file = new File(['img-bytes'], 'capa.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    // O modal de carregamento deve estar visível na tela
    expect(screen.getByTestId('upload-progress-modal')).toBeInTheDocument();
    expect(screen.getByText('Enviando imagem de capa...')).toBeInTheDocument();

    // Finaliza o upload
    resolveUpload('https://b2.com/capa-final.png');

    await waitFor(() => {
      expect(screen.queryByTestId('upload-progress-modal')).not.toBeInTheDocument();
    });
  });
  it('supports custom vertical poster aspect ratio, recommended text and entity label', () => {
    const onChange = vi.fn();
    render(
      <LessonThumbnailManager
        thumbnailUrl="https://b2.com/poster-vertical.jpg"
        onChange={onChange}
        onUploadThumbnail={vi.fn()}
        title="Pôster do Módulo"
        aspectRatio="2 / 3"
        recommendedText="600 × 900 pixels (Proporção 2:3 vertical / Estilo Pôster Netflix)."
        entityLabel="Imagem de capa vinculada ao módulo"
        emptyHelpText="Nenhum pôster selecionado."
        confirmDeleteTitle="Remover Capa do Módulo?"
        confirmDeleteMessage="Deseja remover o pôster deste módulo?"
        previewMaxWidth="180px"
        previewMaxHeight="270px"
        imageFit="cover"
      />
    );

    expect(screen.getByText('Pôster do Módulo')).toBeInTheDocument();
    expect(screen.getByText(/600 × 900 pixels/i)).toBeInTheDocument();
    expect(screen.getByText(/Proporção 2:3 vertical/i)).toBeInTheDocument();
    expect(screen.getByText('Imagem de capa vinculada ao módulo')).toBeInTheDocument();

    const img = screen.getByTestId('lesson-thumbnail-preview');
    expect(img.style.objectFit).toBe('cover');

    // Clica em remover
    fireEvent.click(screen.getByTestId('remove-lesson-thumbnail-btn'));
    expect(screen.getByText('Remover Capa do Módulo?')).toBeInTheDocument();
    expect(screen.getByText('Deseja remover o pôster deste módulo?')).toBeInTheDocument();
  });
});
