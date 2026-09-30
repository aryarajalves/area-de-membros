import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonAttachmentsManager, { formatFileSize } from './LessonAttachmentsManager';
import { ToastProvider } from '../../context/ToastContext';

describe('LessonAttachmentsManager Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'test_token');
    vi.restoreAllMocks();
  });

  const mockAttachments = [
    {
      title: 'Apostila de Tráfego.pdf',
      description: 'Guia completo de tráfego pago',
      file_url: 'https://b2.com/apostila.pdf',
      file_type: 'pdf',
      file_size_bytes: 2097152
    }
  ];

  it('formats file sizes accurately', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(2097152)).toBe('2.0 MB');
  });

  it('renders attached files and allows title, description edit and removal', () => {
    const handleChange = vi.fn();

    render(
      <ToastProvider>
        <LessonAttachmentsManager
          attachments={mockAttachments}
          onChange={handleChange}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Materiais Complementares e Anexos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Apostila de Tráfego.pdf')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Guia completo de tráfego pago')).toBeInTheDocument();
    expect(screen.getByText('2.0 MB')).toBeInTheDocument();

    // Editar título do anexo
    const titleInput = screen.getByTestId('attachment-title-input-0');
    fireEvent.change(titleInput, { target: { value: 'Apostila Atualizada.pdf' } });
    expect(handleChange).toHaveBeenCalledWith([
      expect.objectContaining({ title: 'Apostila Atualizada.pdf' })
    ]);

    // Editar descrição do anexo
    const descInput = screen.getByTestId('attachment-description-input-0');
    fireEvent.change(descInput, { target: { value: 'Nova descrição do guia' } });
    expect(handleChange).toHaveBeenCalledWith([
      expect.objectContaining({ description: 'Nova descrição do guia' })
    ]);

    // Clicar em remover anexo (abre popup de confirmação)
    const removeBtn = screen.getByTestId('remove-attachment-0');
    fireEvent.click(removeBtn);

    // Verifica que o popup de confirmação abriu
    expect(screen.getByTestId('file-delete-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Excluir Anexo da Aula?')).toBeInTheDocument();

    // Confirmar exclusão no popup
    const confirmDeleteBtn = screen.getByTestId('confirm-file-delete-btn');
    fireEvent.click(confirmDeleteBtn);
    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('handles uploading a document from pc', async () => {
    const handleChange = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'Planilha.xlsx',
        file_url: 'https://b2.com/planilha.xlsx',
        file_type: 'xlsx',
        file_size_bytes: 102400
      })
    });

    render(
      <ToastProvider>
        <LessonAttachmentsManager
          attachments={[]}
          onChange={handleChange}
        />
      </ToastProvider>
    );

    expect(screen.getByText('Nenhum documento anexado a esta aula.')).toBeInTheDocument();

    const fileInput = screen.getByTestId('attachment-file-input');
    const fakeFile = new File(['mock content'], 'Planilha.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'Planilha.xlsx',
          description: '',
          file_url: 'https://b2.com/planilha.xlsx',
          file_type: 'xlsx'
        })
      ]);
    });
  });
});
