import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnlineStatusBadge, { OnlineStatusDot, formatLastSeen } from './OnlineStatusBadge';

describe('OnlineStatusBadge Component', () => {
  it('renders "Online agora" when isOnline is true', () => {
    render(<OnlineStatusBadge isOnline={true} />);
    expect(screen.getByText('Online agora')).toBeInTheDocument();
  });

  it('renders "Offline" when isOnline is false and no lastSeenAt is provided', () => {
    render(<OnlineStatusBadge isOnline={false} />);
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('formats last seen correctly when lastSeenAt is provided', () => {
    const now = new Date();
    const tenMinAgo = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    render(<OnlineStatusBadge isOnline={false} lastSeenAt={tenMinAgo} />);
    expect(screen.getByText('Visto há 10 min')).toBeInTheDocument();
  });

  it('renders OnlineStatusDot with green color when online and grey when offline', () => {
    const { rerender } = render(<OnlineStatusDot isOnline={true} dataTestId="dot-test" />);
    const dot = screen.getByTestId('dot-test');
    expect(dot).toHaveStyle({ backgroundColor: '#10b981' });

    rerender(<OnlineStatusDot isOnline={false} dataTestId="dot-test" />);
    expect(dot).toHaveStyle({ backgroundColor: '#64748b' });
  });

  it('formatLastSeen helper returns humanized string', () => {
    expect(formatLastSeen(null)).toBe('Offline');
    const recent = new Date().toISOString();
    expect(formatLastSeen(recent)).toBe('Visto há instantes');
  });
});
