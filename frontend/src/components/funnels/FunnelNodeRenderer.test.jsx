import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FunnelNodeRenderer from './FunnelNodeRenderer';
import { ToastProvider } from '../../context/ToastContext';

describe('FunnelNodeRenderer Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
    localStorage.setItem('auth_token', 'test-token');
  });

  it('renders delay node when node.type is delay', () => {
    const handleUpdate = vi.fn();
    render(
      <ToastProvider>
        <FunnelNodeRenderer
          node={{ id: 'd1', type: 'delay', data: { delay_seconds: 3 } }}
          isSelected={false}
          onUpdateData={handleUpdate}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
          isTargetActive={false}
        />
      </ToastProvider>
    );
    expect(screen.getByText('DELAY')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('3'), { target: { value: '5' } });
    expect(handleUpdate).toHaveBeenCalledWith('d1', expect.objectContaining({ delay_seconds: 5 }));
  });

  it('renders media node with image preview and handles removing media', () => {
    const handleUpdate = vi.fn();
    render(
      <ToastProvider>
        <FunnelNodeRenderer
          node={{
            id: 'm1',
            type: 'media',
            data: { media_type: 'image', media_url: 'https://site.com/pic.png', media_filename: 'pic.png' },
          }}
          isSelected={false}
          onUpdateData={handleUpdate}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
          isTargetActive={false}
        />
      </ToastProvider>
    );
    expect(screen.getByText('MÍDIA')).toBeInTheDocument();
    expect(screen.getByAltText('Pré-visualização')).toBeInTheDocument();

    const removeBtn = screen.getByTestId('node-media-remove-m1');
    fireEvent.click(removeBtn);
    expect(handleUpdate).toHaveBeenCalledWith('m1', expect.objectContaining({ media_url: '' }));
  });

  it('handles media file upload successfully', async () => {
    const handleUpdate = vi.fn();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'foto_uploaded.png',
        media_url: 'https://site.com/uploads/foto_uploaded.png',
        media_type: 'image',
      }),
    });

    render(
      <ToastProvider>
        <FunnelNodeRenderer
          node={{ id: 'm2', type: 'media', data: { media_type: 'image', media_url: '' } }}
          isSelected={false}
          onUpdateData={handleUpdate}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
          isTargetActive={false}
        />
      </ToastProvider>
    );

    const fileInput = screen.getByTestId('node-media-file-input-m2');
    const fakeFile = new File(['dummy content'], 'foto.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/funnels/upload-media', expect.any(Object));
      expect(handleUpdate).toHaveBeenCalledWith('m2', expect.objectContaining({
        media_url: 'https://site.com/uploads/foto_uploaded.png',
        media_filename: 'foto_uploaded.png',
      }));
    });
  });

  it('renders audio node with audio player and handles removing audio', () => {
    const handleUpdate = vi.fn();
    render(
      <ToastProvider>
        <FunnelNodeRenderer
          node={{
            id: 'a1',
            type: 'audio',
            data: { audio_url: 'https://site.com/audio.mp3', audio_filename: 'audio.mp3', is_voice_note: true },
          }}
          isSelected={false}
          onUpdateData={handleUpdate}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
          isTargetActive={false}
        />
      </ToastProvider>
    );
    expect(screen.getByText('ÁUDIO')).toBeInTheDocument();
    expect(screen.getByTestId('node-audio-player-a1')).toBeInTheDocument();

    const removeBtn = screen.getByTestId('node-audio-remove-a1');
    fireEvent.click(removeBtn);
    expect(handleUpdate).toHaveBeenCalledWith('a1', expect.objectContaining({ audio_url: '' }));
  });

  it('handles audio file upload successfully', async () => {
    const handleUpdate = vi.fn();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        filename: 'audio_rec.mp3',
        media_url: 'https://site.com/uploads/audio_rec.mp3',
        media_type: 'audio',
      }),
    });

    render(
      <ToastProvider>
        <FunnelNodeRenderer
          node={{ id: 'a2', type: 'audio', data: { audio_url: '' } }}
          isSelected={false}
          onUpdateData={handleUpdate}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
          isTargetActive={false}
        />
      </ToastProvider>
    );

    const fileInput = screen.getByTestId('node-audio-file-input-a2');
    const fakeFile = new File(['audio bytes'], 'gravacao.mp3', { type: 'audio/mp3' });

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/v1/funnels/upload-media', expect.any(Object));
      expect(handleUpdate).toHaveBeenCalledWith('a2', expect.objectContaining({
        audio_url: 'https://site.com/uploads/audio_rec.mp3',
        audio_filename: 'audio_rec.mp3',
      }));
    });
  });

  it('renders message node and allows updating text', () => {
    const handleUpdate = vi.fn();
    render(
      <ToastProvider>
        <FunnelNodeRenderer
          node={{ id: 'msg1', type: 'message', data: { text: 'Texto inicial' } }}
          isSelected={false}
          onUpdateData={handleUpdate}
          onDeleteNode={vi.fn()}
          onDuplicateNode={vi.fn()}
          onStartConnect={vi.fn()}
          onConnectTarget={vi.fn()}
          isTargetActive={false}
        />
      </ToastProvider>
    );
    expect(screen.getByText('MENSAGEM')).toBeInTheDocument();
    expect(screen.queryByText('APENAS HORÁRIO COMERCIAL?')).not.toBeInTheDocument();
    expect(screen.queryByText('DISPARAR NA MEMÓRIA?')).not.toBeInTheDocument();
    const textarea = screen.getByDisplayValue('Texto inicial');
    fireEvent.change(textarea, { target: { value: 'Texto alterado' } });
    expect(handleUpdate).toHaveBeenCalledWith('msg1', expect.objectContaining({ text: 'Texto alterado' }));
  });
});
