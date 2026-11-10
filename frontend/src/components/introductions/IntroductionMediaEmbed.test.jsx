import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IntroductionMediaEmbed from './IntroductionMediaEmbed';

describe('IntroductionMediaEmbed Component', () => {
  it('não renderiza nada se mediaType for none', () => {
    const { container } = render(<IntroductionMediaEmbed mediaType="none" />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza player nativo de vídeo quando mediaType for video com mediaUrl', () => {
    render(
      <IntroductionMediaEmbed
        mediaType="video"
        mediaUrl="/api/v1/introductions/media/video.mp4"
        title="Meu Vídeo"
      />
    );
    expect(screen.getByTestId('intro-media-embed-local-video')).toBeInTheDocument();
    const video = screen.getByTestId('intro-native-video');
    expect(video).toHaveAttribute('src', '/api/v1/introductions/media/video.mp4');
  });

  it('renderiza iframe quando houver embed de YouTube', () => {
    render(
      <IntroductionMediaEmbed
        mediaType="youtube"
        videoEmbedUrl="https://www.youtube.com/embed/dQw4w9WgXcQ"
        title="Vídeo YouTube"
      />
    );
    expect(screen.getByTestId('intro-media-embed-video')).toBeInTheDocument();
    const iframe = screen.getByTitle('Vídeo YouTube');
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('renderiza imagem e abre lightbox com zoom ao clicar', () => {
    render(
      <IntroductionMediaEmbed
        mediaType="image"
        mediaUrl="https://bucket.com/foto.jpg"
        title="Foto Pessoal"
      />
    );
    const img = screen.getByAltText('Foto Pessoal');
    expect(img).toHaveAttribute('src', 'https://bucket.com/foto.jpg');

    // Abre lightbox
    fireEvent.click(img);
    expect(screen.getByTestId('intro-lightbox-backdrop')).toBeInTheDocument();

    // Fecha lightbox
    fireEvent.click(screen.getByLabelText('Fechar zoom'));
    expect(screen.queryByTestId('intro-lightbox-backdrop')).not.toBeInTheDocument();
  });
});
