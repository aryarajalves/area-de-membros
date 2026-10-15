import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatInternalLinkModal from './ChatInternalLinkModal';

describe('ChatInternalLinkModal Component', () => {
  const mockOnSelectLink = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/v1/courses/101/modules')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            {
              id: 201,
              title: 'Módulo 1: Começando',
              lessons: [
                { id: 301, title: 'Aula 1: Boas-vindas', duration: '05:30' },
                { id: 302, title: 'Aula 2: Primeiro Passo', duration: '12:00' },
              ],
            },
          ],
        });
      }
      if (url.includes('/api/v1/courses')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 101, title: 'Curso Completo de React' },
            { id: 102, title: 'Masterclass de Python' },
          ],
        });
      }
      return Promise.resolve({ ok: false });
    });
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <ChatInternalLinkModal isOpen={false} onSelectLink={mockOnSelectLink} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with system tabs by default and selects a tab link', () => {
    render(
      <ChatInternalLinkModal isOpen={true} onSelectLink={mockOnSelectLink} onClose={mockOnClose} />
    );

    expect(screen.getByTestId('chat-internal-link-modal')).toBeInTheDocument();
    expect(screen.getByText('Compartilhar Link no Chat')).toBeInTheDocument();

    const homeTabBtn = screen.getByTestId('select-tab-home');
    expect(homeTabBtn).toBeInTheDocument();

    fireEvent.click(homeTabBtn);
    expect(mockOnSelectLink).toHaveBeenCalledWith({
      label: '📍 Início',
      url: 'internal://tab/home',
    });
  });

  it('filters tabs based on search term', () => {
    render(
      <ChatInternalLinkModal isOpen={true} onSelectLink={mockOnSelectLink} onClose={mockOnClose} />
    );

    const searchInput = screen.getByTestId('internal-link-search-input');
    fireEvent.change(searchInput, { target: { value: 'ranking' } });

    expect(screen.getByTestId('select-tab-ranking')).toBeInTheDocument();
    expect(screen.queryByTestId('select-tab-home')).not.toBeInTheDocument();
  });

  it('fetches and lists courses in courses tab and selects a course link', async () => {
    render(
      <ChatInternalLinkModal isOpen={true} onSelectLink={mockOnSelectLink} onClose={mockOnClose} />
    );

    const coursesTabBtn = screen.getByTestId('tab-system-courses');
    fireEvent.click(coursesTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('select-course-101')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-course-101'));
    expect(mockOnSelectLink).toHaveBeenCalledWith({
      label: '📚 Curso Completo de React',
      url: 'internal://course/101',
    });
  });

  it('navigates to lessons tab, loads course modules, and selects a lesson link', async () => {
    render(
      <ChatInternalLinkModal isOpen={true} onSelectLink={mockOnSelectLink} onClose={mockOnClose} />
    );

    const lessonsTabBtn = screen.getByTestId('tab-system-lessons');
    fireEvent.click(lessonsTabBtn);

    await waitFor(() => {
      expect(screen.getByTestId('choose-course-for-lessons-101')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('choose-course-for-lessons-101'));

    await waitFor(() => {
      expect(screen.getByTestId('select-lesson-301')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('select-lesson-301'));
    expect(mockOnSelectLink).toHaveBeenCalledWith({
      label: '🎥 Aula 1: Boas-vindas',
      url: 'internal://lesson/101/301',
    });
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <ChatInternalLinkModal isOpen={true} onSelectLink={mockOnSelectLink} onClose={mockOnClose} />
    );

    const closeBtn = screen.getByTestId('close-internal-link-modal');
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
