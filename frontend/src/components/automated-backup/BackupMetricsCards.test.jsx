import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import BackupMetricsCards from './BackupMetricsCards';

describe('BackupMetricsCards Component', () => {
  it('renders last backup date and next backup date in Horário de Brasília (America/Sao_Paulo)', () => {
    // 2026-10-05T20:27:47Z no fuso UTC é 17:27 no horário de Brasília (UTC-3)
    const mockStats = {
      last_backup_filename: 'teste_2026_10_05_17_27_47.dump.gz',
      last_backup_date: '2026-10-05T20:27:47Z',
      next_backup_date: '2026-10-06T02:27:47Z', // 02:27 UTC -> 23:27 de 05/10 em Brasília
      frequency_label: 'A cada 6 hora(s)',
      current_count: 5,
      retention_max: 30,
      total_bytes_used: 1048576,
      total_size_formatted: '1.00 MB utilizados',
      b2_connected: true,
      b2_status: 'Conectado',
      b2_bucket: 'meu-bucket',
    };

    render(<BackupMetricsCards stats={mockStats} />);

    // Valida que o card de último backup exibe 17:27 e o nome do arquivo
    const lastBackupCard = screen.getByTestId('metric-last-backup');
    expect(lastBackupCard).toHaveTextContent('05/10/2026, 17:27');
    expect(lastBackupCard).toHaveTextContent('teste_2026_10_05_17_27_47.dump.gz');

    // Valida que o card de próximo backup exibe a data convertida para Brasília
    const nextBackupCard = screen.getByTestId('metric-next-backup');
    expect(nextBackupCard).toHaveTextContent('05/10/2026, 23:27');
    expect(nextBackupCard).toHaveTextContent('A cada 6 hora(s)');

    // Valida cards de retenção e B2
    expect(screen.getByTestId('metric-retention')).toHaveTextContent('5 / máx 30');
    expect(screen.getByTestId('metric-b2-status')).toHaveTextContent('Conectado');
  });

  it('renders fallback texts when backup dates are null', () => {
    const emptyStats = {
      last_backup_filename: null,
      last_backup_date: null,
      next_backup_date: null,
      frequency_label: 'A cada 6 hora(s)',
      current_count: 0,
      retention_max: 30,
      total_bytes_used: 0,
      total_size_formatted: '0 B utilizados',
      b2_connected: false,
      b2_status: 'Não Configurado',
      b2_bucket: '—',
    };

    render(<BackupMetricsCards stats={emptyStats} />);

    expect(screen.getByTestId('metric-last-backup')).toHaveTextContent('Nenhum');
    expect(screen.getByTestId('metric-last-backup')).toHaveTextContent('Aguardando execução');
    expect(screen.getByTestId('metric-next-backup')).toHaveTextContent('Desativado');
  });
});
