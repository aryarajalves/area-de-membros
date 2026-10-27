import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FunnelFolderBar from './FunnelFolderBar';

describe('FunnelFolderBar Component', () => {
  const mockFolders = [
    { id: 1, name: 'Boas-vindas', color: '#10b981', funnels_count: 3 },
    { id: 2, name: 'Recuperação', color: '#ec4899', funnels_count: 1 },
  ];

  it('renders "Todos os Funis", custom folders and "Sem Pasta" when count > 0', () => {
    render(
      <FunnelFolderBar
        folders={mockFolders}
        selectedFolderId={null}
        onSelectFolder={vi.fn()}
        onCreateFolderClick={vi.fn()}
        onEditFolderClick={vi.fn()}
        onDeleteFolderClick={vi.fn()}
        totalFunnelsCount={5}
        unassignedFunnelsCount={1}
      />
    );

    expect(screen.getByText('Todos os Funis')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Boas-vindas')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Recuperação')).toBeInTheDocument();
    expect(screen.getAllByText('1').length).toBe(2);
    expect(screen.getByText('Sem Pasta')).toBeInTheDocument();
    expect(screen.getByText('+ Nova Pasta')).toBeInTheDocument();
  });

  it('triggers onSelectFolder when clicking a folder pill or "Todos os Funis"', () => {
    const handleSelect = vi.fn();
    render(
      <FunnelFolderBar
        folders={mockFolders}
        selectedFolderId={null}
        onSelectFolder={handleSelect}
        onCreateFolderClick={vi.fn()}
        onEditFolderClick={vi.fn()}
        onDeleteFolderClick={vi.fn()}
        totalFunnelsCount={5}
        unassignedFunnelsCount={1}
      />
    );

    fireEvent.click(screen.getByText('Boas-vindas'));
    expect(handleSelect).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText('Sem Pasta'));
    expect(handleSelect).toHaveBeenCalledWith('unassigned');

    fireEvent.click(screen.getByText('Todos os Funis'));
    expect(handleSelect).toHaveBeenCalledWith(null);
  });

  it('triggers edit and delete actions on folder pills', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    render(
      <FunnelFolderBar
        folders={mockFolders}
        selectedFolderId={1}
        onSelectFolder={vi.fn()}
        onCreateFolderClick={vi.fn()}
        onEditFolderClick={handleEdit}
        onDeleteFolderClick={handleDelete}
        totalFunnelsCount={4}
        unassignedFunnelsCount={0}
      />
    );

    fireEvent.click(screen.getByTestId('edit-folder-btn-1'));
    expect(handleEdit).toHaveBeenCalledWith(mockFolders[0]);

    fireEvent.click(screen.getByTestId('delete-folder-btn-1'));
    expect(handleDelete).toHaveBeenCalledWith(mockFolders[0]);
  });

  it('triggers onCreateFolderClick when clicking "+ Nova Pasta"', () => {
    const handleCreate = vi.fn();
    render(
      <FunnelFolderBar
        folders={mockFolders}
        selectedFolderId={null}
        onSelectFolder={vi.fn()}
        onCreateFolderClick={handleCreate}
        onEditFolderClick={vi.fn()}
        onDeleteFolderClick={vi.fn()}
        totalFunnelsCount={4}
        unassignedFunnelsCount={0}
      />
    );

    fireEvent.click(screen.getByTestId('create-folder-btn'));
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });
});
