import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelNodeRenderer from './FunnelNodeRenderer';

describe('FunnelNodeRenderer Unit Tests', () => {
  it('renders delay node when node.type is delay', () => {
    render(
      <FunnelNodeRenderer
        node={{ id: 'd1', type: 'delay', data: { delay_seconds: 3 } }}
        isSelected={false}
        onUpdateData={vi.fn()}
        onDeleteNode={vi.fn()}
        onDuplicateNode={vi.fn()}
        onStartConnect={vi.fn()}
        onConnectTarget={vi.fn()}
        isTargetActive={false}
      />
    );
    expect(screen.getByText('DELAY')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('renders media node when node.type is media', () => {
    render(
      <FunnelNodeRenderer
        node={{ id: 'm1', type: 'media', data: { media_url: 'https://site.com/pic.png' } }}
        isSelected={false}
        onUpdateData={vi.fn()}
        onDeleteNode={vi.fn()}
        onDuplicateNode={vi.fn()}
        onStartConnect={vi.fn()}
        onConnectTarget={vi.fn()}
        isTargetActive={false}
      />
    );
    expect(screen.getByText('MÍDIA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://site.com/pic.png')).toBeInTheDocument();
  });

  it('renders audio node when node.type is audio', () => {
    render(
      <FunnelNodeRenderer
        node={{ id: 'a1', type: 'audio', data: { audio_url: 'https://site.com/audio.ogg' } }}
        isSelected={false}
        onUpdateData={vi.fn()}
        onDeleteNode={vi.fn()}
        onDuplicateNode={vi.fn()}
        onStartConnect={vi.fn()}
        onConnectTarget={vi.fn()}
        isTargetActive={false}
      />
    );
    expect(screen.getByText('ÁUDIO')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://site.com/audio.ogg')).toBeInTheDocument();
  });

  it('renders message node when node.type is message or fallback', () => {
    render(
      <FunnelNodeRenderer
        node={{ id: 'msg1', type: 'message', data: { text: 'Texto de teste' } }}
        isSelected={false}
        onUpdateData={vi.fn()}
        onDeleteNode={vi.fn()}
        onDuplicateNode={vi.fn()}
        onStartConnect={vi.fn()}
        onConnectTarget={vi.fn()}
        isTargetActive={false}
      />
    );
    expect(screen.getByText('MENSAGEM')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Texto de teste')).toBeInTheDocument();
  });
});
