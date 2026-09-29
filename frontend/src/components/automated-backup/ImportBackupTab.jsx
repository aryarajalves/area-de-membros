import React from 'react';
import { UploadCloud } from 'lucide-react';

export default function ImportBackupTab({
  dragActive,
  uploadingFile,
  fileInputRef,
  onDrag,
  onDrop,
  onUploadFile,
}) {
  return (
    <div className="dropzone-card" data-testid="import-tab-content">
      <div className="dropzone-header">
        <h3>Importar Backup Externo</h3>
        <p>
          Envie arquivos de dump gerados fora do sistema ou migrados de outro ambiente diretamente para o Backblaze B2.
        </p>
      </div>

      <div
        className={`dropzone-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={onDrag}
        onDragLeave={onDrag}
        onDragOver={onDrag}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        data-testid="dropzone-upload-area"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".dump,.gz,.sql"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onUploadFile(e.target.files[0]);
            }
          }}
          data-testid="backup-file-input"
        />
        <div className="dropzone-icon-circle">
          <UploadCloud size={28} />
        </div>
        <span className="dropzone-title">
          {uploadingFile
            ? 'Enviando arquivo para o S3...'
            : 'Arraste e solte o arquivo de backup aqui'}
        </span>
        <span className="dropzone-subtitle">ou clique para navegar no seu computador</span>
        <span className="dropzone-formats-badge">Formatos aceitos: .dump, .dump.gz, .sql (PostgreSQL)</span>
      </div>

      {/* Observações Importantes */}
      <div className="dropzone-notes-card">
        <h4 className="dropzone-notes-title">Observações Importantes:</h4>
        <ul className="dropzone-notes-list">
          <li>O arquivo será enviado e armazenado diretamente no bucket do Backblaze B2.</li>
          <li>Após o upload, o dump aparecerá imediatamente na aba "Backups no S3" com a tag <strong>Importado</strong>.</li>
          <li>Você poderá baixá-lo ou restaurá-lo diretamente a qualquer momento através da tabela de backups.</li>
        </ul>
      </div>
    </div>
  );
}
