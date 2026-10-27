import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatMessageMediaAttachment from './ChatMessageMediaAttachment';

describe('ChatMessageMediaAttachment Component', () => {
  it('returns null if message has no media_url', () => {
    const { container } = render(<ChatMessageMediaAttachment message={{ id: 1 }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders standard image with eager loading and async decoding', () => {
    const message = {
      id: 10,
      media_url: 'https://cdn.example.com/photo.png',
      media_type: 'image',
    };

    render(<ChatMessageMediaAttachment message={message} />);

    const img = screen.getByTestId('chat-media-img-10');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/photo.png');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(img).toHaveAttribute('data-is-gif', 'false');
    expect(screen.queryByTestId('chat-media-gif-badge-10')).not.toBeInTheDocument();
  });

  it('identifies and renders animated GIF with sync decoding, wake-up layer, and GIF badge', () => {
    const message = {
      id: 20,
      media_url: 'https://media.giphy.com/media/NEvPzZ8bd1V4Y/giphy.gif',
      media_type: 'image',
    };

    render(<ChatMessageMediaAttachment message={message} />);

    const img = screen.getByTestId('chat-media-img-20');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://media.giphy.com/media/NEvPzZ8bd1V4Y/giphy.gif');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('decoding', 'sync');
    expect(img).toHaveAttribute('data-is-gif', 'true');

    // Badge visual de GIF
    const badge = screen.getByTestId('chat-media-gif-badge-20');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('GIF');
  });

  it('identifies GIF by extension even if media_type is generic', () => {
    const message = {
      id: 21,
      media_url: 'https://storage.googleapis.com/test-bucket/animation.GIF?token=123',
    };

    render(<ChatMessageMediaAttachment message={message} />);

    const img = screen.getByTestId('chat-media-img-21');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('decoding', 'sync');
    expect(img).toHaveAttribute('data-is-gif', 'true');
    expect(screen.getByTestId('chat-media-gif-badge-21')).toBeInTheDocument();
  });

  it('renders audio player when media_type is audio', () => {
    const message = {
      id: 30,
      media_url: 'https://cdn.example.com/audio.webm',
      media_type: 'audio',
    };

    render(<ChatMessageMediaAttachment message={message} />);

    expect(screen.getByTestId('chat-media-audio-30')).toBeInTheDocument();
    const audio = screen.getByTestId('chat-media-audio-30').querySelector('audio');
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute('src', 'https://cdn.example.com/audio.webm');
  });

  it('renders video player when media_type is video', () => {
    const message = {
      id: 40,
      media_url: 'https://cdn.example.com/video.mp4',
      media_type: 'video',
    };

    render(<ChatMessageMediaAttachment message={message} />);

    expect(screen.getByTestId('chat-media-video-40')).toBeInTheDocument();
    const video = screen.getByTestId('chat-media-video-40').querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://cdn.example.com/video.mp4');
  });

  it('renders document link when media_type is file', () => {
    const message = {
      id: 50,
      media_url: 'https://cdn.example.com/relatorio.pdf',
      media_type: 'file',
    };

    render(<ChatMessageMediaAttachment message={message} />);

    const link = screen.getByText('Visualizar Documento').closest('a');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://cdn.example.com/relatorio.pdf');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
