import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TopNavbar from './TopNavbar';

describe('TopNavbar Component', () => {
  const mockUser = {
    id: 1,
    name: 'Aryaraj Alves',
    email: 'aryaraj@test.com',
    role: 'superadmin',
    avatar_url: null,
  };

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'mock_token');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          counts: { total: 3, topics: 1, lessons: 1, comments: 1, messages: 0 },
        }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders favorites button and user avatar in top navbar', async () => {
    render(<TopNavbar user={mockUser} />);

    expect(screen.getByTestId('mobile-header')).toBeInTheDocument();
    expect(screen.getByTestId('global-favorites-btn')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-header-avatar')).toHaveTextContent('A');

    await waitFor(() => {
      expect(screen.getByTestId('navbar-favorites-badge')).toHaveTextContent('3');
    });
  });

  it('opens and closes favorites dropdown when clicking favorites button', () => {
    render(<TopNavbar user={mockUser} />);

    const favBtn = screen.getByTestId('global-favorites-btn');
    expect(screen.queryByTestId('favorites-dropdown')).not.toBeInTheDocument();

    // Abre
    fireEvent.click(favBtn);
    expect(screen.getByTestId('favorites-dropdown')).toBeInTheDocument();

    // Fecha
    fireEvent.click(favBtn);
    expect(screen.queryByTestId('favorites-dropdown')).not.toBeInTheDocument();
  });

  it('calls onOpenMobileMenu when clicking mobile menu button', () => {
    const handleOpenMobile = vi.fn();
    render(<TopNavbar user={mockUser} onOpenMobileMenu={handleOpenMobile} />);

    const mobileBtn = screen.getByTestId('mobile-menu-toggle-btn');
    expect(mobileBtn).toBeInTheDocument();

    fireEvent.click(mobileBtn);
    expect(handleOpenMobile).toHaveBeenCalledTimes(1);
  });
});
