import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatDmNewContactSelector from './ChatDmNewContactSelector';

describe('ChatDmNewContactSelector Component', () => {
  const mockCandidates = {
    items: [
      {
        id: 1,
        name: 'Carlos Admin',
        email: 'carlos@test.com',
        role: 'admin',
        is_online: true,
        level: 5,
        level_title: 'Ouro I',
        total_points: 300,
        course_ids: [10],
      },
      {
        id: 2,
        name: 'Beatriz Aluna',
        email: 'beatriz@test.com',
        role: 'aluno',
        is_online: false,
        level: 2,
        level_title: 'Bronze II',
        total_points: 50,
        course_ids: [10, 20],
      },
    ],
    total: 25,
    page: 1,
    limit: 20,
    pages: 2,
  };

  const mockCourses = [
    { id: 10, title: 'Curso de Astrologia Básica' },
    { id: 20, title: 'Trânsitos Planetários' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_token', 'fake-jwt-token');

    global.fetch = vi.fn((url) => {
      if (url.includes('/api/v1/courses')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCourses),
        });
      }
      if (url.includes('/api/v1/chat/dm/candidates')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCandidates),
        });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  it('renders search input, filter selects and contact items', async () => {
    render(<ChatDmNewContactSelector onSelectContact={vi.fn()} onClose={vi.fn()} />);

    expect(screen.getByPlaceholderText('Buscar por nome ou e-mail...')).toBeInTheDocument();
    expect(screen.getByTestId('filter-role-select')).toBeInTheDocument();
    expect(screen.getByTestId('filter-course-select')).toBeInTheDocument();
    expect(screen.getByTestId('filter-order-select')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
      expect(screen.getByText('Beatriz Aluna')).toBeInTheDocument();
    });

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('1 / 2')).toBeInTheDocument();
  });

  it('calls onSelectContact when clicking on a contact item', async () => {
    const handleSelect = vi.fn();
    render(<ChatDmNewContactSelector onSelectContact={handleSelect} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('dm-contact-item-1'));
    expect(handleSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Carlos Admin' }));
  });

  it('filters by role when role select changes', async () => {
    render(<ChatDmNewContactSelector onSelectContact={vi.fn()} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('filter-role-select'), { target: { value: 'aluno' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('role=aluno'),
        expect.any(Object)
      );
    });
  });

  it('filters by course when course select changes', async () => {
    render(<ChatDmNewContactSelector onSelectContact={vi.fn()} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('filter-course-select'), { target: { value: '10' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('course_id=10'),
        expect.any(Object)
      );
    });
  });

  it('changes order_by when order select changes', async () => {
    render(<ChatDmNewContactSelector onSelectContact={vi.fn()} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId('filter-order-select'), { target: { value: 'level_desc' } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('order_by=level_desc'),
        expect.any(Object)
      );
    });
  });

  it('navigates to next page when clicking next button', async () => {
    render(<ChatDmNewContactSelector onSelectContact={vi.fn()} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Carlos Admin')).toBeInTheDocument();
    });

    const nextBtn = screen.getByTestId('dm-pagination-next-btn');
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });
});
