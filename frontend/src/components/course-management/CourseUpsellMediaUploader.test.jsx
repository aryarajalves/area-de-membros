import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CourseUpsellMediaUploader from './CourseUpsellMediaUploader';

describe('CourseUpsellMediaUploader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'fake-test-token');
  });

  it('renders initial dropzone when no mediaUrl is provided', () => {
    render(
      <CourseUpsellMediaUploader
        mediaType="image"
        mediaUrl=""
        onMediaChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('upsell-dropzone-box')).toBeInTheDocument();
    expect(screen.getByText('Clique ou arraste o arquivo de Imagem')).toBeInTheDocument();
    expect(screen.getByTestId('upsell-choose-file-btn')).toBeInTheDocument();
    expect(screen.getByTestId('upsell-media-file-input')).toBeInTheDocument();
  });

  it('renders video dropzone and accepts video formats when mediaType is video', () => {
    render(
      <CourseUpsellMediaUploader
        mediaType="video"
        mediaUrl=""
        onMediaChange={vi.fn()}
      />
    );

    expect(screen.getByText('Clique ou arraste o arquivo de Vídeo')).toBeInTheDocument();
    expect(screen.getByText(/Formatos: MP4, WebM, MOV ou MKV/)).toBeInTheDocument();
    const input = screen.getByTestId('upsell-media-file-input');
    expect(input.getAttribute('accept')).toContain('video/mp4');
  });

  it('validates image file size (> 5MB) and calls addToast with error', () => {
    const addToast = vi.fn();
    render(
      <CourseUpsellMediaUploader
        mediaType="image"
        mediaUrl=""
        onMediaChange={vi.fn()}
        addToast={addToast}
      />
    );

    const largeFile = new File(['x'.repeat(100)], 'huge.png', { type: 'image/png' });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

    const input = screen.getByTestId('upsell-media-file-input');
    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(addToast).toHaveBeenCalledWith(
      'A imagem excede o limite máximo permitido de 5 MB.',
      'error'
    );
  });

  it('renders image preview and allows removal when mediaUrl is set', () => {
    const onMediaChange = vi.fn();
    render(
      <CourseUpsellMediaUploader
        mediaType="image"
        mediaUrl="https://exemplo.com/banner.png"
        onMediaChange={onMediaChange}
      />
    );

    expect(screen.getByTestId('upsell-media-preview-box')).toBeInTheDocument();
    expect(screen.getByTestId('upsell-image-preview-img')).toHaveAttribute(
      'src',
      'https://exemplo.com/banner.png'
    );

    fireEvent.click(screen.getByTestId('upsell-media-remove-btn'));
    expect(onMediaChange).toHaveBeenCalledWith('');
  });

  it('renders video preview when mediaUrl is set with video format', () => {
    render(
      <CourseUpsellMediaUploader
        mediaType="video"
        mediaUrl="https://exemplo.com/pitch.mp4"
        onMediaChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('upsell-media-preview-box')).toBeInTheDocument();
    expect(screen.getByTestId('upsell-video-preview-player')).toHaveAttribute(
      'src',
      'https://exemplo.com/pitch.mp4'
    );
  });

  it('allows toggling manual URL field and editing mediaUrl', () => {
    const onMediaChange = vi.fn();
    render(
      <CourseUpsellMediaUploader
        mediaType="image"
        mediaUrl=""
        onMediaChange={onMediaChange}
      />
    );

    const toggleBtn = screen.getByTestId('upsell-toggle-manual-url-btn');
    fireEvent.click(toggleBtn);

    const urlInput = screen.getByTestId('upsell-media-url-input');
    expect(urlInput).toBeInTheDocument();

    fireEvent.change(urlInput, { target: { value: 'https://exemplo.com/manual-banner.jpg' } });
    expect(onMediaChange).toHaveBeenCalledWith('https://exemplo.com/manual-banner.jpg');
  });
});
