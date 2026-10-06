import React from 'react';
import { Clock, Calendar, HardDrive, Cloud } from 'lucide-react';
import { formatBrasiliaBackupDateTime } from './backupDateUtils';

export default function BackupMetricsCards({ stats }) {
  return (
    <div className="backup-metrics-grid">
      {/* Card 1: Último Backup */}
      <div className="backup-metric-card" data-testid="metric-last-backup">
        <div className="backup-metric-icon metric-blue">
          <Clock size={22} />
        </div>
        <div className="backup-metric-info">
          <span className="metric-label">Último Backup</span>
          <span className="metric-value">
            {formatBrasiliaBackupDateTime(stats.last_backup_date) || 'Nenhum'}
          </span>
          <span className="metric-subtext">
            {stats.last_backup_filename || 'Aguardando execução'}
          </span>
        </div>
      </div>

      {/* Card 2: Próximo Backup */}
      <div className="backup-metric-card" data-testid="metric-next-backup">
        <div className="backup-metric-icon metric-amber">
          <Calendar size={22} />
        </div>
        <div className="backup-metric-info">
          <span className="metric-label">Próximo Backup</span>
          <span className="metric-value">
            {formatBrasiliaBackupDateTime(stats.next_backup_date) || 'Desativado'}
          </span>
          <span className="metric-subtext">{stats.frequency_label}</span>
        </div>
      </div>

      {/* Card 3: Retenção no S3 / B2 */}
      <div className="backup-metric-card" data-testid="metric-retention">
        <div className="backup-metric-icon metric-emerald">
          <HardDrive size={22} />
        </div>
        <div className="backup-metric-info">
          <span className="metric-label">Retenção no S3 / B2</span>
          <span className="metric-value">
            {stats.current_count} / máx {stats.retention_max}
          </span>
          <span className="metric-subtext">{stats.total_size_formatted}</span>
        </div>
      </div>

      {/* Card 4: Backblaze B2 (Nuvem) */}
      <div className="backup-metric-card" data-testid="metric-b2-status">
        <div
          className={`backup-metric-icon ${
            stats.b2_connected ? 'metric-green' : 'metric-red'
          }`}
        >
          <Cloud size={22} />
        </div>
        <div className="backup-metric-info">
          <span className="metric-label">Backblaze B2 (Nuvem)</span>
          <span
            className={`metric-value ${
              stats.b2_connected ? 'text-connected' : 'text-disconnected'
            }`}
          >
            {stats.b2_status}
          </span>
          <span className="metric-subtext">
            {stats.b2_connected ? 'Sincronização em nuvem ativa' : 'Bucket: ' + stats.b2_bucket}
          </span>
        </div>
      </div>
    </div>
  );
}
