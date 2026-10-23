import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BannerPositionAdjuster from './BannerPositionAdjuster';

describe('BannerPositionAdjuster Component', () => {
  it('não renderiza nada se coverImageUrl for vazio ou nulo', () => {
    const { container } = render(
      <BannerPositionAdjuster coverImageUrl="" position={50} onChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza pré-visualização, slider e presets quando coverImageUrl é fornecida', () => {
    render(
      <BannerPositionAdjuster
        coverImageUrl="https://exemplo.com/banner.jpg"
        position={50}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByTestId('banner-position-adjuster')).toBeInTheDocument();
    expect(screen.getByTestId('banner-drag-preview')).toBeInTheDocument();
    expect(screen.getByTestId('banner-position-slider')).toBeInTheDocument();
    expect(screen.getByText(/Enquadramento do Banner/)).toBeInTheDocument();
    expect(screen.getByText('50% (Centro)')).toBeInTheDocument();
  });

  it('exibe estilo e posição inicial corretamente no preview', () => {
    render(
      <BannerPositionAdjuster
        coverImageUrl="https://exemplo.com/banner.jpg"
        position={25}
        onChange={vi.fn()}
      />
    );

    const preview = screen.getByTestId('banner-drag-preview');
    expect(preview.style.backgroundPosition).toBe('center 25%');
    const slider = screen.getByTestId('banner-position-slider');
    expect(slider.value).toBe('25');
  });

  it('chama onChange quando o valor do slider é alterado', () => {
    const onChangeMock = vi.fn();
    render(
      <BannerPositionAdjuster
        coverImageUrl="https://exemplo.com/banner.jpg"
        position={50}
        onChange={onChangeMock}
      />
    );

    const slider = screen.getByTestId('banner-position-slider');
    fireEvent.change(slider, { target: { value: '80' } });

    expect(onChangeMock).toHaveBeenCalledWith(80);
  });

  it('permite selecionar presets rápidos (Topo 0%, Centro 50%, Base 100%)', () => {
    const onChangeMock = vi.fn();
    render(
      <BannerPositionAdjuster
        coverImageUrl="https://exemplo.com/banner.jpg"
        position={50}
        onChange={onChangeMock}
      />
    );

    const topoBtn = screen.getByTestId('banner-preset-0');
    fireEvent.click(topoBtn);
    expect(onChangeMock).toHaveBeenCalledWith(0);

    const baseBtn = screen.getByTestId('banner-preset-100');
    fireEvent.click(baseBtn);
    expect(onChangeMock).toHaveBeenCalledWith(100);

    const centroBtn = screen.getByTestId('banner-preset-50');
    fireEvent.click(centroBtn);
    expect(onChangeMock).toHaveBeenCalledWith(50);
  });

  it('inicia e finaliza o arrasto com mouse no preview', () => {
    const onChangeMock = vi.fn();
    render(
      <BannerPositionAdjuster
        coverImageUrl="https://exemplo.com/banner.jpg"
        position={50}
        onChange={onChangeMock}
      />
    );

    const preview = screen.getByTestId('banner-drag-preview');
    fireEvent.mouseDown(preview, { clientY: 100 });

    // Move mouse no window
    fireEvent.mouseMove(window, { clientY: 70 });
    expect(onChangeMock).toHaveBeenCalled();

    // Solta mouse
    fireEvent.mouseUp(window);
    expect(preview).toBeInTheDocument();
  });
});
