import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ChatAttachedLinkPreview from './ChatAttachedLinkPreview';

describe('ChatAttachedLinkPreview Component', () => {
  it('returns null when attachedLink is null or undefined', () => {
    const { container } = render(<ChatAttachedLinkPreview attachedLink={null} onRemove={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders attached lesson link cleanly with green play icon and label', () => {
    const link = {
      label: '🎥 Aula 1: Primeiros Passos',
      url: 'internal://lesson/10/55',
    };
    render(<ChatAttachedLinkPreview attachedLink={link} onRemove={vi.fn()} />);

    expect(screen.getByTestId('chat-attached-link-preview')).toBeInTheDocument();
    expect(screen.getByText('🎥 Aula 1: Primeiros Passos')).toBeInTheDocument();
    expect(screen.getByText(/Aula vinculada • Abre em nova aba/i)).toBeInTheDocument();
  });

  it('renders attached course link with course description', () => {
    const link = {
      label: '📚 Curso de React Completo',
      url: 'internal://course/10',
    };
    render(<ChatAttachedLinkPreview attachedLink={link} onRemove={vi.fn()} />);

    expect(screen.getByText('📚 Curso de React Completo')).toBeInTheDocument();
    expect(screen.getByText(/Curso vinculado • Abre em nova aba/i)).toBeInTheDocument();
  });

  it('renders attached tab link with platform tab description', () => {
    const link = {
      label: '📍 Central de Suporte',
      url: 'internal://tab/support',
    };
    render(<ChatAttachedLinkPreview attachedLink={link} onRemove={vi.fn()} />);

    expect(screen.getByText('📍 Central de Suporte')).toBeInTheDocument();
    expect(screen.getByText(/Aba da plataforma vinculada • Abre em nova aba/i)).toBeInTheDocument();
  });

  it('calls onRemove when the remove (X) button is clicked', () => {
    const handleRemove = vi.fn();
    const link = {
      label: '🎥 Aula 2: Introdução',
      url: 'internal://lesson/1/2',
    };
    render(<ChatAttachedLinkPreview attachedLink={link} onRemove={handleRemove} />);

    const removeBtn = screen.getByTestId('chat-attached-link-remove-btn');
    fireEvent.click(removeBtn);

    expect(handleRemove).toHaveBeenCalledTimes(1);
  });
});
