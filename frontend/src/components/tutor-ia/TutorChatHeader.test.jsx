import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TutorChatHeader from './TutorChatHeader';

describe('TutorChatHeader Component', () => {
  it('renders tutor name and triggers actions correctly', () => {
    const handleClear = vi.fn();
    const handleRefresh = vi.fn();
    const handleIndex = vi.fn();
    const handleExport = vi.fn();

    render(
      <TutorChatHeader
        tutorName="Sofia - Tutora IA"
        hasMessages={true}
        onClearHistory={handleClear}
        onRefresh={handleRefresh}
        onExportChat={handleExport}
        isManager={true}
        onIndexRagLesson={handleIndex}
      />
    );

    expect(screen.getByText('Sofia - Tutora IA da Aula')).toBeInTheDocument();

    const exportBtn = screen.getByTestId('btn-export-tutor-chat');
    fireEvent.click(exportBtn);
    expect(handleExport).toHaveBeenCalled();

    const clearBtn = screen.getByTestId('btn-clear-tutor-history');
    fireEvent.click(clearBtn);
    expect(handleClear).toHaveBeenCalled();

    const refreshBtn = screen.getByTestId('btn-refresh-tutor');
    fireEvent.click(refreshBtn);
    expect(handleRefresh).toHaveBeenCalled();

    const indexBtn = screen.getByTestId('btn-index-lesson-rag');
    fireEvent.click(indexBtn);
    expect(handleIndex).toHaveBeenCalled();
  });
});
