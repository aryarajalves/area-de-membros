import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChatDateSeparator from './ChatDateSeparator';

describe('ChatDateSeparator Component', () => {
  it('renders "Hoje" separator for today timestamp', () => {
    const today = new Date().toISOString();
    render(<ChatDateSeparator date={today} />);

    const separator = screen.getByTestId('chat-date-separator');
    expect(separator).toBeInTheDocument();
    expect(screen.getByText('Hoje')).toBeInTheDocument();
  });

  it('renders "Ontem" separator for yesterday timestamp', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    render(<ChatDateSeparator date={yesterday.toISOString()} />);

    expect(screen.getByText('Ontem')).toBeInTheDocument();
  });

  it('returns null and does not render when date is invalid or empty', () => {
    const { container } = render(<ChatDateSeparator date="" />);
    expect(container).toBeEmptyDOMElement();
  });
});
