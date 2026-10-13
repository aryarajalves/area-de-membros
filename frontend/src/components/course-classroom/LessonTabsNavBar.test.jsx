import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LessonTabsNavBar from './LessonTabsNavBar';

describe('LessonTabsNavBar Component', () => {
  it('renders all 5 lesson navigation tabs with icons and labels', () => {
    render(
      <LessonTabsNavBar
        activeTab="overview"
        onTabChange={() => {}}
        attachmentsCount={0}
      />
    );

    expect(screen.getByTestId('tab-lesson-overview')).toBeInTheDocument();
    expect(screen.getByTestId('tab-lesson-transcription')).toBeInTheDocument();
    expect(screen.getByTestId('tab-lesson-attachments')).toBeInTheDocument();
    expect(screen.getByTestId('tab-lesson-notes')).toBeInTheDocument();
    expect(screen.getByTestId('tab-lesson-comments')).toBeInTheDocument();
  });

  it('renders both full and mobile labels for responsive display without truncating', () => {
    render(
      <LessonTabsNavBar
        activeTab="overview"
        onTabChange={() => {}}
        attachmentsCount={0}
      />
    );

    // Aba Transcrição
    const transcriptionBtn = screen.getByTestId('tab-lesson-transcription');
    expect(transcriptionBtn.querySelector('.tab-label-full')).toHaveTextContent(
      'Transcrição & Resumo IA'
    );
    expect(transcriptionBtn.querySelector('.tab-label-mobile')).toHaveTextContent(
      'Transcrição IA'
    );

    // Aba Materiais
    const attachmentsBtn = screen.getByTestId('tab-lesson-attachments');
    expect(attachmentsBtn.querySelector('.tab-label-full')).toHaveTextContent(
      'Materiais Complementares'
    );
    expect(attachmentsBtn.querySelector('.tab-label-mobile')).toHaveTextContent(
      'Materiais'
    );

    // Aba Anotações
    const notesBtn = screen.getByTestId('tab-lesson-notes');
    expect(notesBtn.querySelector('.tab-label-full')).toHaveTextContent(
      'Minhas Anotações'
    );
    expect(notesBtn.querySelector('.tab-label-mobile')).toHaveTextContent(
      'Anotações'
    );
  });

  it('ensures each tab button has flexShrink 0 to prevent being crushed/cut on small mobile screens', () => {
    render(
      <LessonTabsNavBar
        activeTab="overview"
        onTabChange={() => {}}
        attachmentsCount={0}
      />
    );

    const tabs = [
      'tab-lesson-overview',
      'tab-lesson-transcription',
      'tab-lesson-attachments',
      'tab-lesson-notes',
      'tab-lesson-comments'
    ];

    tabs.forEach((testId) => {
      const btn = screen.getByTestId(testId);
      expect(btn).toHaveStyle({ flexShrink: '0', whiteSpace: 'nowrap' });
    });
  });

  it('marks active tab with aria-selected and active class', () => {
    render(
      <LessonTabsNavBar
        activeTab="notes"
        onTabChange={() => {}}
        attachmentsCount={0}
      />
    );

    const notesBtn = screen.getByTestId('tab-lesson-notes');
    expect(notesBtn).toHaveAttribute('aria-selected', 'true');
    expect(notesBtn.className).toContain('active');

    const overviewBtn = screen.getByTestId('tab-lesson-overview');
    expect(overviewBtn).toHaveAttribute('aria-selected', 'false');
    expect(overviewBtn.className).not.toContain('active');
  });

  it('calls onTabChange with correct id when a tab button is clicked', () => {
    const handleTabChange = vi.fn();
    render(
      <LessonTabsNavBar
        activeTab="overview"
        onTabChange={handleTabChange}
        attachmentsCount={2}
      />
    );

    const commentsBtn = screen.getByTestId('tab-lesson-comments');
    fireEvent.click(commentsBtn);
    expect(handleTabChange).toHaveBeenCalledWith('comments');

    const attachmentsBtn = screen.getByTestId('tab-lesson-attachments');
    fireEvent.click(attachmentsBtn);
    expect(handleTabChange).toHaveBeenCalledWith('attachments');
  });

  it('displays count badge only on attachments tab when attachmentsCount > 0', () => {
    const { rerender } = render(
      <LessonTabsNavBar
        activeTab="overview"
        onTabChange={() => {}}
        attachmentsCount={3}
      />
    );

    expect(screen.getByTestId('badge-count-attachments')).toHaveTextContent('3');

    // Quando 0 anexos, o badge não deve aparecer
    rerender(
      <LessonTabsNavBar
        activeTab="overview"
        onTabChange={() => {}}
        attachmentsCount={0}
      />
    );
    expect(screen.queryByTestId('badge-count-attachments')).not.toBeInTheDocument();
  });
});
