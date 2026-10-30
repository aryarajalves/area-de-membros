import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ModuleCardLockOverlay, { formatUnlockDate } from './ModuleCardLockOverlay';

describe('ModuleCardLockOverlay', () => {
  it('não renderiza nada se isLocked for falso', () => {
    const { container } = render(
      <ModuleCardLockOverlay isLocked={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza ícone e mensagem de bloqueio padrão quando isLocked for verdadeiro', () => {
    render(
      <ModuleCardLockOverlay
        isLocked={true}
        releaseDays={7}
      />
    );

    expect(screen.getByTestId('module-locked-badge')).toBeInTheDocument();
    expect(screen.getByTestId('module-drip-lock-icon')).toBeInTheDocument();
    expect(screen.getByText('Bloqueado')).toBeInTheDocument();
    expect(screen.getByText('Liberado em 7 dias')).toBeInTheDocument();
  });

  it('formata data fixa corretamente', () => {
    render(
      <ModuleCardLockOverlay
        isLocked={true}
        availableAt="2026-11-20T12:00:00Z"
      />
    );

    expect(screen.getByText(/Liberado em/)).toBeInTheDocument();
  });

  it('renderiza estilo de recompensa de elo quando lockedReason for elo', () => {
    render(
      <ModuleCardLockOverlay
        isLocked={true}
        lockedReason="elo"
        requiredTier="Ouro"
        requiredTierColor="#f59e0b"
      />
    );

    expect(screen.getByTestId('module-locked-badge')).toBeInTheDocument();
    expect(screen.getByTestId('module-elo-lock-icon')).toBeInTheDocument();
    expect(screen.getByText('Recompensa de Elo')).toBeInTheDocument();
    expect(screen.getByText('Exige Elo Ouro')).toBeInTheDocument();
  });

  it('função helper formatUnlockDate retorna fallback se não houver data nem dias nem elo', () => {
    expect(formatUnlockDate(null, null)).toBe('Conteúdo programado');
    expect(formatUnlockDate(null, 5)).toBe('Liberado em 5 dias');
    expect(formatUnlockDate(null, null, 'elo', 'Diamante')).toBe('Exige Elo Diamante');
  });
});
