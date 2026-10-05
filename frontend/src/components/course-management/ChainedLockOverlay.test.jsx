import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChainedLockOverlay from './ChainedLockOverlay';

describe('ChainedLockOverlay Component', () => {
  it('renders chained lock overlay with SVG chains and center locked badge', () => {
    render(<ChainedLockOverlay isLightBg={false} />);

    expect(screen.getByTestId('chained-lock-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('chained-lock-svg')).toBeInTheDocument();
    expect(screen.getByTestId('chained-lock-center-badge')).toBeInTheDocument();
    expect(screen.getByText('Produto Fechado')).toBeInTheDocument();
    expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
  });
});
