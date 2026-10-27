import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FunnelManagement from './FunnelManagement';
import App from '../../App';
import { ToastProvider } from '../../context/ToastContext';

// Mock dos subcomponentes de FunnelManagement para teste isolado
vi.mock('./FunnelsListPage', () => ({
  default: ({ onSelectFunnel }) => (
    <div data-testid="funnels-list-page">
      <span>Lista de Funis</span>
      <button data-testid="select-funnel-btn" onClick={() => onSelectFunnel(42)}>
        Abrir Funil 42
      </button>
    </div>
  ),
}));

vi.mock('./FunnelCanvasPage', () => ({
  default: ({ funnelId, onBack }) => (
    <div data-testid="funnel-canvas-page">
      <span>Editando Canvas do Funil {funnelId}</span>
      <button data-testid="back-to-funnel-list-btn" onClick={onBack}>
        Voltar para Lista
      </button>
    </div>
  ),
}));

describe('FunnelManagement View Mode & App Sidebar Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('notifies onFunnelViewChange(true) when opening a funnel, and onFunnelViewChange(false) when going back', () => {
    const handleFunnelViewChange = vi.fn();

    render(<FunnelManagement onFunnelViewChange={handleFunnelViewChange} />);

    // Inicialmente exibe a lista de funis
    expect(screen.getByTestId('funnels-list-page')).toBeInTheDocument();
    expect(screen.queryByTestId('funnel-canvas-page')).not.toBeInTheDocument();

    // Clica para abrir o funil
    fireEvent.click(screen.getByTestId('select-funnel-btn'));

    // Deve notificar o pai para ocultar a sidebar
    expect(handleFunnelViewChange).toHaveBeenCalledWith(true);
    expect(screen.getByTestId('funnel-canvas-page')).toBeInTheDocument();
    expect(screen.getByText('Editando Canvas do Funil 42')).toBeInTheDocument();

    // Clica em voltar para a lista
    fireEvent.click(screen.getByTestId('back-to-funnel-list-btn'));

    // Deve notificar o pai para reexibir a sidebar
    expect(handleFunnelViewChange).toHaveBeenCalledWith(false);
    expect(screen.getByTestId('funnels-list-page')).toBeInTheDocument();
    expect(screen.queryByTestId('funnel-canvas-page')).not.toBeInTheDocument();
  });

  it('hides sidebar in App when entering a funnel canvas and restores it on back', async () => {
    localStorage.setItem('auth_token', 'mock_token');
    localStorage.setItem(
      'auth_user',
      JSON.stringify({
        id: 1,
        name: 'Super Admin',
        email: 'admin@test.com',
        role: 'superadmin',
      })
    );
    localStorage.setItem('active_tab', 'funnels');

    render(
      <ToastProvider>
        <App />
      </ToastProvider>
    );

    // Sidebar inicialmente visível
    expect(screen.getByRole('complementary', { name: /menu lateral/i })).toBeInTheDocument();
    expect(screen.getByTestId('funnels-list-page')).toBeInTheDocument();

    // Entra no canvas do funil
    fireEvent.click(screen.getByTestId('select-funnel-btn'));

    // A sidebar deve ser ocultada do DOM
    expect(screen.queryByRole('complementary', { name: /menu lateral/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('funnel-canvas-page')).toBeInTheDocument();

    // Clica para voltar à lista
    fireEvent.click(screen.getByTestId('back-to-funnel-list-btn'));

    // A sidebar deve reaparecer
    expect(screen.getByRole('complementary', { name: /menu lateral/i })).toBeInTheDocument();
    expect(screen.getByTestId('funnels-list-page')).toBeInTheDocument();
  });
});
