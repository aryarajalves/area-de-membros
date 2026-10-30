import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ModuleDripSettings from './ModuleDripSettings';

describe('ModuleDripSettings', () => {
  it('renderiza todos os botões de tipo de liberação e tiers de Elo', () => {
    render(
      <ModuleDripSettings
        releaseType="immediate"
        setReleaseType={vi.fn()}
        releaseDays={7}
        setReleaseDays={vi.fn()}
        releaseDate=""
        setReleaseDate={vi.fn()}
        requiredTier={null}
        setRequiredTier={vi.fn()}
      />
    );

    expect(screen.getByTestId('drip-type-immediate')).toBeInTheDocument();
    expect(screen.getByTestId('drip-type-days-after')).toBeInTheDocument();
    expect(screen.getByTestId('drip-type-specific-date')).toBeInTheDocument();
    expect(screen.queryByTestId('drip-release-days-input')).not.toBeInTheDocument();
    expect(screen.queryByTestId('drip-release-date-input')).not.toBeInTheDocument();

    // Opções de Elo
    expect(screen.getByTestId('elo-tier-option-none')).toBeInTheDocument();
    expect(screen.getByTestId('elo-tier-option-Bronze')).toBeInTheDocument();
    expect(screen.getByTestId('elo-tier-option-Prata')).toBeInTheDocument();
    expect(screen.getByTestId('elo-tier-option-Ouro')).toBeInTheDocument();
    expect(screen.getByTestId('elo-tier-option-Diamante')).toBeInTheDocument();
    expect(screen.getByTestId('elo-tier-option-Lenda')).toBeInTheDocument();
  });

  it('permite selecionar um Elo mínimo exigido', () => {
    const setRequiredTier = vi.fn();
    render(
      <ModuleDripSettings
        releaseType="immediate"
        setReleaseType={vi.fn()}
        releaseDays={7}
        setReleaseDays={vi.fn()}
        releaseDate=""
        setReleaseDate={vi.fn()}
        requiredTier="Bronze"
        setRequiredTier={setRequiredTier}
      />
    );

    fireEvent.click(screen.getByTestId('elo-tier-option-Ouro'));
    expect(setRequiredTier).toHaveBeenCalledWith('Ouro');

    fireEvent.click(screen.getByTestId('elo-tier-option-none'));
    expect(setRequiredTier).toHaveBeenCalledWith(null);
  });

  it('exibe input de dias quando releaseType é days_after e chama setReleaseDays', () => {
    const setReleaseDays = vi.fn();
    render(
      <ModuleDripSettings
        releaseType="days_after"
        setReleaseType={vi.fn()}
        releaseDays={14}
        setReleaseDays={setReleaseDays}
        releaseDate=""
        setReleaseDate={vi.fn()}
        requiredTier={null}
        setRequiredTier={vi.fn()}
      />
    );

    const input = screen.getByTestId('drip-release-days-input');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('14');

    fireEvent.change(input, { target: { value: '21' } });
    expect(setReleaseDays).toHaveBeenCalledWith(21);
  });

  it('exibe input de data quando releaseType é specific_date e chama setReleaseDate', () => {
    const setReleaseDate = vi.fn();
    render(
      <ModuleDripSettings
        releaseType="specific_date"
        setReleaseType={vi.fn()}
        releaseDays={7}
        setReleaseDays={vi.fn()}
        releaseDate="2026-11-15T10:00"
        setReleaseDate={setReleaseDate}
        requiredTier={null}
        setRequiredTier={vi.fn()}
      />
    );

    const input = screen.getByTestId('drip-release-date-input');
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('2026-11-15T10:00');

    fireEvent.change(input, { target: { value: '2026-12-01T15:30' } });
    expect(setReleaseDate).toHaveBeenCalledWith('2026-12-01T15:30');
  });

  it('dispara setReleaseType ao clicar nas opções', () => {
    const setReleaseType = vi.fn();
    render(
      <ModuleDripSettings
        releaseType="immediate"
        setReleaseType={setReleaseType}
        releaseDays={7}
        setReleaseDays={vi.fn()}
        releaseDate=""
        setReleaseDate={vi.fn()}
        requiredTier={null}
        setRequiredTier={vi.fn()}
      />
    );

    fireEvent.click(screen.getByTestId('drip-type-days-after'));
    expect(setReleaseType).toHaveBeenCalledWith('days_after');

    fireEvent.click(screen.getByTestId('drip-type-specific-date'));
    expect(setReleaseType).toHaveBeenCalledWith('specific_date');
  });
});
