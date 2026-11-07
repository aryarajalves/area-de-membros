import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TutorExportChatModal, { generateMarkdownContent } from './TutorExportChatModal';
import { ToastProvider } from '../../context/ToastContext';

describe('TutorExportChatModal Component', () => {
  const mockMessages = [
    {
      id: 1,
      role: 'user',
      content: 'Qual o significado de Saturno na Casa 2?',
      created_at: '2026-11-06T10:00:00Z'
    },
    {
      id: 2,
      role: 'assistant',
      content: 'Saturno na Casa 2 representa responsabilidade financeira e foco em estrutura.',
      created_at: '2026-11-06T10:00:15Z',
      related_lessons: [
        {
          course_title: 'Bússola Astrológica',
          lesson_title: 'Aula 02 - Casas Astrológicas'
        }
      ]
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithToast = (ui) => render(<ToastProvider>{ui}</ToastProvider>);

  it('generates markdown content with headers, messages and related lessons', () => {
    const md = generateMarkdownContent(mockMessages, 'Sofia IA', 'Aula 02 - Saturno');
    expect(md).toContain('# Histórico de Dúvidas - Sofia IA');
    expect(md).toContain('**Aula:** Aula 02 - Saturno');
    expect(md).toContain('👤 Aluno');
    expect(md).toContain('Qual o significado de Saturno na Casa 2?');
    expect(md).toContain('🤖 Sofia IA');
    expect(md).toContain('Saturno na Casa 2 representa responsabilidade financeira');
    expect(md).toContain('Bússola Astrológica • Aula 02 - Casas Astrológicas');
  });

  it('does not render when isOpen is false', () => {
    renderWithToast(
      <TutorExportChatModal
        isOpen={false}
        onClose={vi.fn()}
        messages={mockMessages}
      />
    );
    expect(screen.queryByTestId('tutor-export-chat-modal')).not.toBeInTheDocument();
  });

  it('renders modal when open and displays message count and tutor name', () => {
    renderWithToast(
      <TutorExportChatModal
        isOpen={true}
        onClose={vi.fn()}
        messages={mockMessages}
        tutorName="Sofia IA"
      />
    );

    expect(screen.getByTestId('tutor-export-chat-modal')).toBeInTheDocument();
    expect(screen.getByText('Exportar Conversa da Aula')).toBeInTheDocument();
    expect(screen.getByText('2 mensagens na conversa')).toBeInTheDocument();
    expect(screen.getByText('Sofia IA')).toBeInTheDocument();
    expect(screen.getByTestId('btn-export-markdown')).toBeInTheDocument();
    expect(screen.getByTestId('btn-export-pdf')).toBeInTheDocument();
  });

  it('closes modal when close button is clicked', () => {
    const handleClose = vi.fn();
    renderWithToast(
      <TutorExportChatModal
        isOpen={true}
        onClose={handleClose}
        messages={mockMessages}
      />
    );

    const closeBtn = screen.getByTestId('btn-close-export-modal');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('handles markdown download and triggers onClose', () => {
    const handleClose = vi.fn();
    // Mocks para URL e createObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test');
    global.URL.revokeObjectURL = vi.fn();

    renderWithToast(
      <TutorExportChatModal
        isOpen={true}
        onClose={handleClose}
        messages={mockMessages}
        tutorName="Sofia IA"
        lessonTitle="Aula 02 - Saturno"
      />
    );

    const mdBtn = screen.getByTestId('btn-export-markdown');
    fireEvent.click(mdBtn);

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it('handles PDF print window open and document write', () => {
    const handleClose = vi.fn();
    const mockPrintWindow = {
      document: {
        open: vi.fn(),
        write: vi.fn(),
        close: vi.fn()
      }
    };
    window.open = vi.fn().mockReturnValue(mockPrintWindow);

    renderWithToast(
      <TutorExportChatModal
        isOpen={true}
        onClose={handleClose}
        messages={mockMessages}
        tutorName="Sofia IA"
      />
    );

    const pdfBtn = screen.getByTestId('btn-export-pdf');
    fireEvent.click(pdfBtn);

    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(mockPrintWindow.document.write).toHaveBeenCalled();
    expect(mockPrintWindow.document.close).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });
});
