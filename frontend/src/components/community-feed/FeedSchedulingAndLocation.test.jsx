import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedMediaReorderGrid from './FeedMediaReorderGrid';
import FeedScheduleLocationControls from './FeedScheduleLocationControls';
import { renderTextWithLinks } from '../../utils/linkifyUtils';

describe('FeedMediaReorderGrid', () => {
  it('renderiza números de posição nas mídias e permite reordenar', () => {
    const urls = ['https://img.com/1.jpg', 'https://img.com/2.jpg', 'https://img.com/3.jpg'];
    const handleMove = vi.fn();
    const handleRemove = vi.fn();

    render(
      <FeedMediaReorderGrid
        mediaUrls={urls}
        mediaType="carousel"
        onMoveMedia={handleMove}
        onRemoveMedia={handleRemove}
      />
    );

    // Verifica badges numéricos
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();

    // Clica no botão de mover para a direita da foto 1
    const moveNext0 = screen.getByTestId('feed-move-media-next-0');
    fireEvent.click(moveNext0);
    expect(handleMove).toHaveBeenCalledWith(0, 1);

    // Clica no botão de mover para a esquerda da foto 2
    const movePrev1 = screen.getByTestId('feed-move-media-prev-1');
    fireEvent.click(movePrev1);
    expect(handleMove).toHaveBeenCalledWith(1, 0);

    // Clica no botão de remover da foto 2
    const removeBtn1 = screen.getByTestId('feed-remove-media-btn-1');
    fireEvent.click(removeBtn1);
    expect(handleRemove).toHaveBeenCalledWith(1);
  });
});

describe('FeedScheduleLocationControls', () => {
  it('permite adicionar e remover localização', () => {
    const handleLocChange = vi.fn();
    const handleSchedChange = vi.fn();

    const { rerender } = render(
      <FeedScheduleLocationControls
        location={null}
        onLocationChange={handleLocChange}
        scheduledAt={null}
        onScheduledAtChange={handleSchedChange}
      />
    );

    // Abre popover de localização
    const openLocBtn = screen.getByTestId('feed-open-location-btn');
    fireEvent.click(openLocBtn);

    const input = screen.getByTestId('feed-location-input');
    fireEvent.change(input, { target: { value: 'Curitiba, PR' } });

    const applyBtn = screen.getByTestId('feed-apply-location-btn');
    fireEvent.click(applyBtn);
    expect(handleLocChange).toHaveBeenCalledWith('Curitiba, PR');

    // Rerender com a localização definida
    rerender(
      <FeedScheduleLocationControls
        location="Curitiba, PR"
        onLocationChange={handleLocChange}
        scheduledAt={null}
        onScheduledAtChange={handleSchedChange}
      />
    );

    expect(screen.getByText('Curitiba, PR')).toBeInTheDocument();
    const removeLocBtn = screen.getByTestId('feed-remove-location-btn');
    fireEvent.click(removeLocBtn);
    expect(handleLocChange).toHaveBeenCalledWith(null);
  });

  it('permite definir agendamento de postagem', () => {
    const handleSchedChange = vi.fn();

    const { rerender } = render(
      <FeedScheduleLocationControls
        location={null}
        onLocationChange={vi.fn()}
        scheduledAt={null}
        onScheduledAtChange={handleSchedChange}
      />
    );

    // Abre popover de agendamento
    const openSchedBtn = screen.getByTestId('feed-open-schedule-btn');
    fireEvent.click(openSchedBtn);

    const dateInput = screen.getByTestId('feed-schedule-datetime-input');
    fireEvent.change(dateInput, { target: { value: '2026-12-01T15:00' } });

    const applySchedBtn = screen.getByTestId('feed-apply-schedule-btn');
    fireEvent.click(applySchedBtn);
    expect(handleSchedChange).toHaveBeenCalled();

    // Rerender com agendamento ativo
    rerender(
      <FeedScheduleLocationControls
        location={null}
        onLocationChange={vi.fn()}
        scheduledAt="2026-12-01T15:00:00.000Z"
        onScheduledAtChange={handleSchedChange}
      />
    );

    expect(screen.getByTestId('feed-schedule-pill')).toBeInTheDocument();
    const removeSchedBtn = screen.getByTestId('feed-remove-schedule-btn');
    fireEvent.click(removeSchedBtn);
    expect(handleSchedChange).toHaveBeenCalledWith(null);
  });
});

describe('linkifyUtils com Hashtags', () => {
  it('renderiza hashtags clicáveis e dispara callback ao clicar', () => {
    const handleHashtag = vi.fn();
    const result = renderTextWithLinks('Aprenda mais com #react e #javascript no curso', handleHashtag);

    render(<div>{result}</div>);

    const reactTag = screen.getByText('#react');
    const jsTag = screen.getByText('#javascript');

    expect(reactTag).toHaveClass('feed-post-hashtag');
    expect(jsTag).toHaveClass('feed-post-hashtag');

    fireEvent.click(reactTag);
    expect(handleHashtag).toHaveBeenCalledWith('react');
  });
});
