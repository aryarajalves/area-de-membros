import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AppErrorBoundary from './AppErrorBoundary';

function BombComponent() {
  throw new Error('Falha simulada de renderização');
}

describe('AppErrorBoundary', () => {
  it('renderiza filhos normalmente quando não há erro', () => {
    render(
      <AppErrorBoundary>
        <div data-testid="healthy-child">Conteúdo OK</div>
      </AppErrorBoundary>
    );
    expect(screen.getByTestId('healthy-child')).toBeInTheDocument();
  });

  it('exibe fallback amigável em português quando ocorre erro em componente filho', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <AppErrorBoundary>
        <BombComponent />
      </AppErrorBoundary>
    );

    expect(screen.getByTestId('app-error-boundary-fallback')).toBeInTheDocument();
    expect(screen.getByText('Ops! Algo inesperado aconteceu')).toBeInTheDocument();
    expect(screen.getByTestId('error-boundary-reload-btn')).toHaveTextContent('Recarregar Página');

    consoleSpy.mockRestore();
  });
});
