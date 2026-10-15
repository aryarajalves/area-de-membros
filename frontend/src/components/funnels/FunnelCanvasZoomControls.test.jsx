import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelCanvasZoomControls from './FunnelCanvasZoomControls';

describe('FunnelCanvasZoomControls Component Unit Tests', () => {
  it('renders zoom percentage and action buttons', () => {
    render(
      <FunnelCanvasZoomControls
        zoom={1.25}
        setZoom={vi.fn()}
        pan={{ x: 0, y: 0 }}
        setPan={vi.fn()}
        onZoomIn={vi.fn()}
        onZoomOut={vi.fn()}
        onOpenAddMenu={vi.fn()}
      />
    );

    expect(screen.getByTestId('zoom-percentage')).toHaveTextContent('125%');
    expect(screen.getByTestId('add-node-canvas-btn')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-in-btn')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-out-btn')).toBeInTheDocument();
    expect(screen.getByTestId('zoom-reset-btn')).toBeInTheDocument();
  });

  it('triggers onZoomIn and onZoomOut callbacks when clicked', () => {
    const onZoomInMock = vi.fn();
    const onZoomOutMock = vi.fn();

    render(
      <FunnelCanvasZoomControls
        zoom={1}
        setZoom={vi.fn()}
        pan={{ x: 0, y: 0 }}
        setPan={vi.fn()}
        onZoomIn={onZoomInMock}
        onZoomOut={onZoomOutMock}
        onOpenAddMenu={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('zoom-in-btn'));
    expect(onZoomInMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('zoom-out-btn'));
    expect(onZoomOutMock).toHaveBeenCalledTimes(1);
  });

  it('calls custom onReset when reset button is clicked', () => {
    const onResetMock = vi.fn();

    render(
      <FunnelCanvasZoomControls
        zoom={0.8}
        setZoom={vi.fn()}
        pan={{ x: 100, y: 50 }}
        setPan={vi.fn()}
        onReset={onResetMock}
        onOpenAddMenu={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('zoom-reset-btn'));
    expect(onResetMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to setZoom(1) and setPan({x:0, y:0}) when onReset is not provided', () => {
    const setZoomMock = vi.fn();
    const setPanMock = vi.fn();

    render(
      <FunnelCanvasZoomControls
        zoom={0.5}
        setZoom={setZoomMock}
        pan={{ x: 250, y: 150 }}
        setPan={setPanMock}
        onOpenAddMenu={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('zoom-reset-btn'));
    expect(setZoomMock).toHaveBeenCalledWith(1);
    expect(setPanMock).toHaveBeenCalledWith({ x: 0, y: 0 });
  });

  it('triggers onOpenAddMenu when clicking add node button', () => {
    const onOpenAddMenuMock = vi.fn();

    render(
      <FunnelCanvasZoomControls
        zoom={1}
        setZoom={vi.fn()}
        pan={{ x: 0, y: 0 }}
        setPan={vi.fn()}
        onOpenAddMenu={onOpenAddMenuMock}
      />
    );

    fireEvent.click(screen.getByTestId('add-node-canvas-btn'));
    expect(onOpenAddMenuMock).toHaveBeenCalledTimes(1);
  });
});
