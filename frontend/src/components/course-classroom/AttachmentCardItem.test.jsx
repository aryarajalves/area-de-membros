import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
});
