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
    expect(screen.getByText('Aula vinculada')).toBeInTheDocument();
  });

  it('renders attached lesson with course and module context in preview', () => {
    const link = {
      label: '🎥 Aula 3: Configuração do Ambiente',
      url: 'internal://lesson/10/55?course=React%20Expert&module=Fundamentos',
      courseTitle: 'React Expert',
      moduleTitle: 'Fundamentos',
    };
    render(<ChatAttachedLinkPreview attachedLink={link} onRemove={vi.fn()} />);

    expect(screen.getByText('🎥 Aula 3: Configuração do Ambiente')).toBeInTheDocument();
    expect(screen.getByText('Aula vinculada • React Expert › Fundamentos')).toBeInTheDocument();
  });

  it('extracts course and module context from query string if not provided in top-level props', () => {
    const link = {
      label: '🎥 Aula 4: Hooks na Prática',
      url: 'internal://lesson/10/55?course=React%20Expert&module=Avan%C3%A7ado',
    };
    render(<ChatAttachedLinkPreview attachedLink={link} onRemove={vi.fn()} />);

    expect(screen.getByText('🎥 Aula 4: Hooks na Prática')).toBeInTheDocument();
    expect(screen.getByText('Aula vinculada • React Expert › Avançado')).toBeInTheDocument();
  });

  it('renders attached course link with course description', () => {
    const link = {
      label: '📚 Curso de React Completo',
      url: 'internal://course/10',
    };
    render(<ChatAttachedLinkPreview attachedLink={link} onRemove={vi.fn()} />);

    expect(screen.getByText('📚 Curso de React Completo')).toBeInTheDocument();
    expect(screen.getByText('Curso vinculado')).toBeInTheDocument();
  });

  it('renders attached tab link with platform tab description', () => {
    const link = {
      label: '📍 Central de Suporte',
      url: 'internal://tab/support',
    };
    render(<ChatAttachedLinkPreview attachedLink={link} onRemove={vi.fn()} />);

    expect(screen.getByText('📍 Central de Suporte')).toBeInTheDocument();
    expect(screen.getByText('Aba da plataforma vinculada')).toBeInTheDocument();
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
