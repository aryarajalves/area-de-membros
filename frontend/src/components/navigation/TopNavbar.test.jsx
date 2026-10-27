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

  it('renders notifications button and opens notifications modal', async () => {
    render(<TopNavbar user={mockUser} />);

    const notifBtn = screen.getByTestId('global-notifications-btn');
    expect(notifBtn).toBeInTheDocument();

    fireEvent.click(notifBtn);
    expect(screen.getByTestId('notifications-modal')).toBeInTheDocument();
  });

  it('applies responsive mobile classes to favorites and dm buttons and labels', () => {
    render(<TopNavbar user={mockUser} />);

    const favBtn = screen.getByTestId('global-favorites-btn');
    expect(favBtn).toHaveClass('topbar-action-btn');

    const dmBtn = screen.getByTestId('global-dm-btn');
    expect(dmBtn).toHaveClass('topbar-action-btn');

    expect(favBtn.querySelector('.topbar-btn-text')).toHaveTextContent('Favoritos');
    expect(dmBtn.querySelector('.topbar-btn-text')).toHaveTextContent('DMs');
  });

  it('elevates header zIndex to 999999 when favorites dropdown is open and renders dm modal with high zIndex', () => {
    render(<TopNavbar user={mockUser} />);

    const header = screen.getByTestId('mobile-header');
    expect(header).toHaveStyle({ zIndex: '1000' });

    // Abre favoritos
    const favBtn = screen.getByTestId('global-favorites-btn');
    fireEvent.click(favBtn);
    expect(header).toHaveStyle({ zIndex: '999999' });

    // Abre DM
    const dmBtn = screen.getByTestId('global-dm-btn');
    fireEvent.click(dmBtn);
    expect(screen.getByTestId('chat-dm-modal')).toHaveStyle({ zIndex: '1000002' });
  });
});
