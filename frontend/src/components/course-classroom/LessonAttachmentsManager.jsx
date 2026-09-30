import React, { useState, useRef } from 'react';
import { Paperclip, Upload, Trash2, FileText, FileSpreadsheet, FileArchive, File, ExternalLink, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { UploadProgressModal, FileDeleteConfirmModal } from '../common/FeedbackModals';

export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getFileIcon(fileType = '') {
  const type = fileType.toLowerCase().replace('.', '');
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(type)) {
    return <FileText size={18} color="#ef4444" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(type)) {
    return <FileSpreadsheet size={18} color="#10b981" />;
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) {
    return <FileArchive size={18} color="#f59e0b" />;
  }
  return <File size={18} color="#6366f1" />;
}

export default function LessonAttachmentsManager({
  attachments = [],
  onChange,
  isLightBg = false
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, index: null, title: '' });
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const textColor = isLightBg ? '#1e293b' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const rowBg = isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.55)';
  const rowBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      addToast('O documento excede o tamanho máximo de 100 MB.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadFileName(file.name);
    setUploading(true);
    const token = localStorage.getItem('auth_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/courses/upload-attachment', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao enviar anexo.');
      }

      const data = await res.json();
      const newAttachment = {
        title: data.title || file.name,
        description: '',
        file_url: data.file_url,
        file_type: data.file_type || file.name.split('.').pop() || '',
        file_size_bytes: data.file_size_bytes || file.size
      };

      onChange([...attachments, newAttachment]);
      addToast('Documento anexado com sucesso!', 'success');
    } catch (err) {
      addToast(err.message || 'Falha ao enviar arquivo.', 'error');
    } finally {
      setUploading(false);
      setUploadFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePromptDelete = (index) => {
    const att = attachments[index];
    setConfirmDelete({
      isOpen: true,
      index,
      title: att?.title || 'este anexo'
    });
  };

  const handleConfirmDeleteAttachment = () => {
    if (confirmDelete.index !== null) {
      const updated = attachments.filter((_, idx) => idx !== confirmDelete.index);
      onChange(updated);
      addToast('Anexo removido da aula.', 'success');
    }
    setConfirmDelete({ isOpen: false, index: null, title: '' });
  };

  const handleUpdateTitle = (index, newTitle) => {
    const updated = attachments.map((att, idx) => (idx === index ? { ...att, title: newTitle } : att));
    onChange(updated);
  };

  const handleUpdateDescription = (index, newDescription) => {
    const updated = attachments.map((att, idx) => (idx === index ? { ...att, description: newDescription } : att));
    onChange(updated);
  };

  return (
    <div style={{
      backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
      border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '10px',
      padding: '14px'
    }} data-testid="lesson-attachments-manager">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Paperclip size={16} color="#38bdf8" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
            Materiais Complementares e Anexos
          </span>
          <span style={{
            fontSize: '11px',
            backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
            color: textColor,
            padding: '1px 6px',
            borderRadius: '10px',
            fontWeight: 600
          }}>
            {attachments.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="secondary-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            padding: '5px 10px',
            cursor: uploading ? 'not-allowed' : 'pointer'
          }}
          data-testid="upload-attachment-btn"
        >
          {uploading ? (
            <>
              <Loader2 size={13} className="spin-animation" />
              <span>Enviando...</span>
            </>
          ) : (
            <>
              <Upload size={13} />
              <span>+ Anexar do PC</span>
            </>
          )}
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv,.png,.jpg,.jpeg,.webp"
          data-testid="attachment-file-input"
        />
      </div>

      <p style={{ fontSize: '11.5px', color: subTextColor, margin: '0 0 10px 0' }}>
        Anexe apostilas em PDF, planilhas, apresentações ou arquivos compactados (até 100 MB no Backblaze B2).
      </p>

      {attachments.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '18px 8px',
          backgroundColor: rowBg,
          borderRadius: '6px',
          border: isLightBg ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.16)',
          color: subTextColor,
          fontSize: '12px'
        }}>
          Nenhum documento anexado a esta aula.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {attachments.map((att, idx) => (
            <div
              key={att.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                backgroundColor: rowBg,
                border: rowBorder,
                borderRadius: '6px'
              }}
              data-testid={`attachment-row-${idx}`}
            >
              <div style={{ flexShrink: 0 }}>
                {getFileIcon(att.file_type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  type="text"
                  value={att.title}
                  onChange={(e) => handleUpdateTitle(idx, e.target.value)}
                  placeholder="Nome do arquivo para o aluno"
                  style={{
                    width: '100%',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: textColor,
                    border: '1px solid transparent',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    backgroundColor: 'transparent'
                  }}
                  title="Clique para editar o nome exibido"
                  data-testid={`attachment-title-input-${idx}`}
                />
                <input
                  type="text"
                  value={att.description || ''}
                  onChange={(e) => handleUpdateDescription(idx, e.target.value)}
                  placeholder="Descrição do documento (opcional)..."
                  style={{
                    width: '100%',
                    fontSize: '11.5px',
                    color: subTextColor,
                    border: '1px solid transparent',
                    borderRadius: '4px',
                    padding: '4px 6px',
                    backgroundColor: 'transparent',
                    marginTop: '2px'
                  }}
                  title="Clique para editar a descrição do documento"
                  data-testid={`attachment-description-input-${idx}`}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px', marginTop: '2px' }}>
                  <span style={{ fontSize: '10.5px', textTransform: 'uppercase', color: subTextColor, fontWeight: 600 }}>
                    {att.file_type || 'ARQUIVO'}
                  </span>
                  {att.file_size_bytes > 0 && (
                    <>
                      <span style={{ fontSize: '10.5px', color: subTextColor }}>•</span>
                      <span style={{ fontSize: '10.5px', color: subTextColor }}>
                        {formatFileSize(att.file_size_bytes)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {att.file_url && (
                  <a
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="table-action-btn"
                    title="Visualizar arquivo"
                    style={{ padding: '4px', color: subTextColor }}
                    data-testid={`preview-attachment-${idx}`}
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handlePromptDelete(idx)}
                  className="table-action-btn btn-danger"
                  title="Remover anexo"
                  style={{ padding: '4px' }}
                  data-testid={`remove-attachment-${idx}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Progresso de Upload */}
      <UploadProgressModal
        isOpen={uploading}
        title="Enviando Documento..."
        message={`Aguarde enquanto o arquivo "${uploadFileName || 'documento'}" está sendo transferido e salvo no Backblaze B2.`}
      />

      {/* Modal de Confirmação de Exclusão de Anexo */}
      <FileDeleteConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Excluir Anexo da Aula?"
        message={`Deseja realmente remover o anexo "${confirmDelete.title}" desta aula? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDeleteAttachment}
        onCancel={() => setConfirmDelete({ isOpen: false, index: null, title: '' })}
      />
    </div>
  );
}
