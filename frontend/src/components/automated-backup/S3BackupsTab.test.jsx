import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import S3BackupsTab from './S3BackupsTab';

describe('S3BackupsTab Component', () => {
  it('renders backup created_at formatted in Horário de Brasília (America/Sao_Paulo)', () => {
    // 2026-10-05T20:27:47Z deve ser renderizado como 05/10/2026, 17:27:47
    const mockBackups = [
      {
        id: 1,
        filename: 'teste_2026_10_05_17_27_47.dump.gz',
        file_size_formatted: '37.57 KB',
        file_size_bytes: 38472,
        backup_type: 'manual',
        created_at: '2026-10-05T20:27:47Z',
      },
    ];

    render(
      <S3BackupsTab
        loadingManual={false}
        onTriggerManualBackup={vi.fn()}
        backupTypeFilter="all"
        setBackupTypeFilter={vi.fn()}
        setBackupsPage={vi.fn()}
        setSelectedBackupIds={vi.fn()}
        selectedBackupIds={[]}
        handleBulkDeleteBackups={vi.fn()}
        filteredBackups={mockBackups}
        isAllPageSelected={false}
        handleToggleSelectAll={vi.fn()}
        paginatedBackups={mockBackups}
        handleToggleSelectOne={vi.fn()}
        handleDownloadBackup={vi.fn()}
        handlePromptRestore={vi.fn()}
        handleOpenRename={vi.fn()}
        loadingRestoreId={null}
        handleDeleteBackup={vi.fn()}
        backupsPage={1}
        totalBackupPages={1}
        pageSize={20}
      />
    );

    expect(screen.getByText('teste_2026_10_05_17_27_47.dump.gz')).toBeInTheDocument();
    expect(screen.getByText('05/10/2026, 17:27:47')).toBeInTheDocument();
    expect(screen.getAllByText('Manual').length).toBeGreaterThan(0);
  });
});
