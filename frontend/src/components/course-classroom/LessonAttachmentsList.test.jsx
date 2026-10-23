import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LessonAttachmentsList from './LessonAttachmentsList';
import { ToastProvider } from '../../context/ToastContext';

describe('LessonAttachmentsList Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('auth_token', 'test_token');
    vi.restoreAllMocks();
  });

  const mockList = [
    {
      id: 1,
      title: 'Checklist de Lançamento.pdf',
      description: 'Checklist detalhado com todas as tarefas de lançamento',
      file_url: 'https://b2.com/chk.pdf',
      file_type: 'pdf',
      file_size_bytes: 1048576
    },
    {
      id: 2,
      title: 'Modelos de Scripts.zip',
      description: 'Arquivos de scripts e templates para envio',
      file_url: 'https://b2.com/scripts.zip',
      file_type: 'zip',
      file_size_bytes: 5242880
    }
  ];

  it('renders empty state when there are no attachments', () => {
    render(
      <ToastProvider>
        <LessonAttachmentsList attachments={[]} isManager={false} />
      </ToastProvider>
    );
    expect(screen.getByText('Nenhum material complementar anexado')).toBeInTheDocument();
    expect(screen.getByTestId('empty-attachments-state')).toBeInTheDocument();
    expect(screen.queryByTestId('manager-attachments-toolbar')).not.toBeInTheDocument();
  });

  it('renders list of materials with description and Acessar buttons', () => {
    render(
      <ToastProvider>
        <LessonAttachmentsList attachments={mockList} isManager={false} />
      </ToastProvider>
    );

    expect(screen.getByText('Checklist de Lançamento.pdf')).toBeInTheDocument();
    expect(screen.getByText('Checklist detalhado com todas as tarefas de lançamento')).toBeInTheDocument();
    expect(screen.getByText('1.0 MB')).toBeInTheDocument();

    expect(screen.getByText('Modelos de Scripts.zip')).toBeInTheDocument();
    expect(screen.getByText('Arquivos de scripts e templates para envio')).toBeInTheDocument();
    expect(screen.getByText('5.0 MB')).toBeInTheDocument();

    const accessButtons = screen.getAllByRole('link', { name: /Acessar/i });
    expect(accessButtons).toHaveLength(2);
    expect(accessButtons[0]).toHaveAttribute('href', 'https://b2.com/chk.pdf');
    expect(accessButtons[1]).toHaveAttribute('href', 'https://b2.com/scripts.zip');
    expect(screen.queryByTestId('delete-attachment-btn-1')).not.toBeInTheDocument();
  });

  it('renders manager toolbar with upload button when isManager is true', () => {
    render(
      <ToastProvider>
        <LessonAttachmentsList
          attachments={mockList}
          isManager={true}
          courseId={1}
          moduleId={2}
          lessonId={10}
        />
      </ToastProvider>
    );

    expect(screen.getByTestId('manager-attachments-toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('direct-upload-attachment-btn')).toBeInTheDocument();
    expect(screen.getByText(/\+ Anexar Arquivo.* do PC/i)).toBeInTheDocument();
    expect(screen.getByTestId('direct-attachment-file-input')).toHaveAttribute('multiple');
    expect(screen.getByTestId('delete-attachment-btn-1')).toBeInTheDocument();
  });

  it('handles direct upload from PC for admin and calls onAttachmentAdded', async () => {
    const onAttachmentAdded = vi.fn();

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url === '/api/v1/courses/upload-attachment') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            file_url: 'https://b2.com/doc_novo.pdf',
            file_name: 'Guia_Astrologico.pdf',
            file_size: 204800,
            file_type: 'pdf'
          })
        });
      }
      if (url.includes('/attachments')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 99,
            title: 'Guia_Astrologico.pdf',
            file_url: 'https://b2.com/doc_novo.pdf',
            file_size_bytes: 204800,
            file_type: 'pdf'
          })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <ToastProvider>
        <LessonAttachmentsList
          attachments={mockList}
          isManager={true}
          courseId={1}
          moduleId={2}
          lessonId={10}
          onAttachmentAdded={onAttachmentAdded}
        />
      </ToastProvider>
    );

    const fileInput = screen.getByTestId('direct-attachment-file-input');
    const fakeFile = new File(['pdf content'], 'Guia_Astrologico.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    await waitFor(() => {
      expect(onAttachmentAdded).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 99,
          title: 'Guia_Astrologico.pdf',
          file_url: 'https://b2.com/doc_novo.pdf'
        })
      );
    });
  });

  it('allows manager to delete an attachment with confirmation modal', async () => {
    const onAttachmentDeleted = vi.fn();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Deleted' })
    });

    render(
      <ToastProvider>
        <LessonAttachmentsList
          attachments={mockList}
          isManager={true}
          courseId={1}
          moduleId={2}
          lessonId={10}
          onAttachmentDeleted={onAttachmentDeleted}
        />
      </ToastProvider>
    );

    const deleteBtn = screen.getByTestId('delete-attachment-btn-1');
    fireEvent.click(deleteBtn);

    // Modal de confirmação
    expect(screen.getByTestId('file-delete-confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Excluir Documento da Aula?')).toBeInTheDocument();

    const confirmBtn = screen.getByTestId('confirm-file-delete-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/1/modules/2/lessons/10/attachments/1',
        expect.objectContaining({ method: 'DELETE' })
      );
      expect(onAttachmentDeleted).toHaveBeenCalledWith(1);
    });
  });

  it('handles multiple files upload in a single batch and calls onAttachmentAdded for each file', async () => {
    const onAttachmentAdded = vi.fn();
    let uploadCallIndex = 0;

    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url === '/api/v1/courses/upload-attachment') {
        uploadCallIndex++;
        return Promise.resolve({
          ok: true,
          json: async () => ({
            file_url: `https://b2.com/doc_${uploadCallIndex}.pdf`,
            file_name: `Arquivo_${uploadCallIndex}.pdf`,
            file_size: 102400,
            file_type: 'pdf'
          })
        });
      }
      if (url.includes('/attachments') && options?.method === 'POST') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 100 + uploadCallIndex,
            title: body.title,
            file_url: body.file_url,
            file_size_bytes: 102400,
            file_type: 'pdf'
          })
        });
      }
      return Promise.reject(new Error('Unknown url'));
    });

    render(
      <ToastProvider>
        <LessonAttachmentsList
          attachments={mockList}
          isManager={true}
          courseId={1}
          moduleId={2}
          lessonId={10}
          onAttachmentAdded={onAttachmentAdded}
        />
      </ToastProvider>
    );

    const fileInput = screen.getByTestId('direct-attachment-file-input');
    const file1 = new File(['conteudo 1'], 'Checklist.pdf', { type: 'application/pdf' });
    const file2 = new File(['conteudo 2'], 'Ebook.pdf', { type: 'application/pdf' });
    const file3 = new File(['conteudo 3'], 'Apostila.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [file1, file2, file3] } });

    await waitFor(() => {
      expect(onAttachmentAdded).toHaveBeenCalledTimes(3);
    });
  });
});
