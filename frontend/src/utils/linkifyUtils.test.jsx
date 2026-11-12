import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderTextWithLinks } from './linkifyUtils';

describe('renderTextWithLinks', () => {
  it('deve renderizar links clicáveis para URLs https', () => {
    const text = 'Visite nosso site: https://google.com.br e confira!';
    render(<p data-testid="container">{renderTextWithLinks(text)}</p>);

    const link = screen.getByRole('link', { name: 'https://google.com.br' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://google.com.br');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('deve prefixar https:// para links iniciados por www.', () => {
    const text = 'Acesse www.exemplo.com.br';
    render(<p data-testid="container">{renderTextWithLinks(text)}</p>);

    const link = screen.getByRole('link', { name: 'www.exemplo.com.br' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://www.exemplo.com.br');
  });

  it('deve manter texto sem links inalterado', () => {
    const text = 'Apenas uma mensagem sem links';
    render(<p data-testid="container">{renderTextWithLinks(text)}</p>);

    expect(screen.getByText('Apenas uma mensagem sem links')).toBeInTheDocument();
  });
});
