import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AttachmentCardItem from './AttachmentCardItem';

describe('AttachmentCardItem Component', () => {
  const mockAtt = {
    id: 42,
    title: 'Super guia das Casas Astrológicas.pdf',
    description: 'Guia completo em PDF para download',
    file_type: 'pdf',
    file_size_bytes: 4800000,
    file_url: 'https://cdn.example.com/casas.pdf'
  };

  it('renderiza título, descrição, tag de tipo e link de acesso', () => {
    render(<AttachmentCardItem attachment={mockAtt} index={0} isManager={false} />);

    expect(screen.getByText('Super guia das Casas Astrológicas.pdf')).toBeInTheDocument();
    expect(screen.getByText('Guia completo em PDF para download')).toBeInTheDocument();
    expect(screen.getByText('4.6 MB')).toBeInTheDocument();
    expect(screen.getByTestId('access-attachment-btn-42')).toHaveAttribute(
      'href',
      'https://cdn.example.com/casas.pdf'
    );
    expect(screen.getByTestId('access-attachment-btn-42')).not.toHaveAttribute('download');
    expect(screen.queryByTestId('rename-attachment-btn-42')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-attachment-btn-42')).not.toBeInTheDocument();
  });

  it('exibe botões de renomear e excluir quando isManager é true e dispara callbacks', () => {
    const handleRename = vi.fn();
    const handleDelete = vi.fn();

    render(
      <AttachmentCardItem
        attachment={mockAtt}
        index={0}
        isManager={true}
        onRename={handleRename}
        onDelete={handleDelete}
      />
    );

    const renameBtn = screen.getByTestId('rename-attachment-btn-42');
    const deleteBtn = screen.getByTestId('delete-attachment-btn-42');

    expect(renameBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    fireEvent.click(renameBtn);
    expect(handleRename).toHaveBeenCalledWith(mockAtt);

    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockAtt);
  });

  it('usa proxy seguro do backend e abre na nova aba sem forçar download quando hospedado no Backblaze B2', async () => {
    localStorage.setItem('auth_token', 'jwt-aluno');
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: async () => new Blob(['%PDF'], { type: 'application/pdf' }),
    });
    URL.createObjectURL = vi.fn().mockReturnValue('blob:http://localhost/pdf-1');
    URL.revokeObjectURL = vi.fn();
    const docWriteSpy = vi.fn();
    const fakePreviewTab = {
      opener: window,
      location: { href: '', replace: vi.fn() },
      document: { open: vi.fn(), write: docWriteSpy, close: vi.fn() },
    };
    window.open = vi.fn().mockReturnValue(fakePreviewTab);

    const b2Att = {
      ...mockAtt,
      id: 99,
      file_url: 'https://s3.us-west-004.backblazeb2.com/zap-voice/AreaDeMembros/attachments/att_123.pdf',
    };

    render(<AttachmentCardItem attachment={b2Att} index={0} isManager={false} />);
    const btn = screen.getByTestId('access-attachment-btn-99');
    expect(btn).toHaveAttribute('href', '/api/v1/courses/attachments/99/access');
    expect(btn).not.toHaveAttribute('download');

    fireEvent.click(btn);
    expect(window.open).toHaveBeenCalledWith('about:blank', '_blank');
    expect(docWriteSpy).toHaveBeenCalledWith(expect.stringContaining('Preparando e abrindo seu material com segurança...'));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/v1/courses/attachments/99/access',
        expect.objectContaining({ headers: { Authorization: 'Bearer jwt-aluno' } }),
      );
      expect(fakePreviewTab.location.replace).toHaveBeenCalledWith('blob:http://localhost/pdf-1');
    });
  });
});
