import React, { useState, useRef } from 'react';
import { Download, FileText, FileSpreadsheet, FileArchive, File, ExternalLink, Paperclip, Upload, Trash2, Loader2, Plus } from 'lucide-react';
import { formatFileSize, getFileIcon } from './LessonAttachmentsManager';
import { UploadProgressModal, FileDeleteConfirmModal } from '../common/FeedbackModals';
import { useToast } from '../../context/ToastContext';

export default function LessonAttachmentsList({
  attachments = [],
  isLightBg = false,
  courseId,
  moduleId,
  lessonId,
  isManager = false,
  onAttachmentAdded,
  onAttachmentDeleted
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, item: null });
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  const iconBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)';
  const titleColor = isLightBg ? '#1e293b' : '#f8fafc';
  const descColor = isLightBg ? '#475569' : '#cbd5e1';
  const tagBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)';
  const tagColor = isLightBg ? '#64748b' : '#94a3b8';

  const handleFileUpload = async (e) => {
    const fileList = Array.from(e.target.files || []);
    if (fileList.length === 0) return;

    // Filtra arquivos que excedem 100 MB
    const validFiles = [];
    for (const f of fileList) {
      if (f.size > 100 * 1024 * 1024) {
        addToast(`O documento "${f.name}" excede o tamanho máximo de 100 MB.`, 'error');
      } else {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress({ current: 0, total: validFiles.length });
    const token = localStorage.getItem('auth_token');
    let successCount = 0;
    let lastError = null;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      setUploadFileName(file.name);
      setUploadProgress({ current: i + 1, total: validFiles.length });

      try {
        // 1. Upload do arquivo para o storage
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/v1/courses/upload-attachment', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.detail || `Erro ao enviar "${file.name}".`);
        }

        const uploadData = await uploadRes.json();
        const resolvedFileUrl = uploadData.file_url || uploadData.attachment_url;
        if (!resolvedFileUrl) {
          throw new Error(`Servidor não retornou a URL para "${file.name}".`);
        }

        // 2. Vincular o anexo à aula via API
        if (courseId && moduleId && lessonId) {
          const payload = {
            title: uploadData.title || uploadData.file_name || file.name,
            description: null,
            file_url: resolvedFileUrl,
            file_type: uploadData.file_type || file.name.split('.').pop() || '',
            file_size_bytes: uploadData.file_size_bytes || uploadData.file_size || file.size
          };

          const attachRes = await fetch(
            `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/attachments`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(payload)
            }
          );

          if (!attachRes.ok) {
            const err = await attachRes.json().catch(() => ({}));
            throw new Error(err.detail || `Falha ao vincular "${file.name}" à aula.`);
          }

          const createdAtt = await attachRes.json();
          if (onAttachmentAdded) {
            onAttachmentAdded(createdAtt);
          }
        }

        successCount++;
      } catch (err) {
        lastError = err.message;
      }
    }

    if (successCount === 1) {
      addToast('Documento anexado com sucesso!', 'success');
    } else if (successCount > 1) {
      addToast(`${successCount} documentos anexados com sucesso!`, 'success');
    }

    if (lastError && successCount < validFiles.length) {
      addToast(lastError, 'error');
    }

    setUploading(false);
    setUploadFileName('');
    setUploadProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmDelete = async () => {
    const item = confirmDelete.item;
    if (!item) return;

    setDeleting(true);
    const token = localStorage.getItem('auth_token');
    try {
      if (courseId && moduleId && lessonId && item.id) {
        const res = await fetch(
          `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/attachments/${item.id}`,
          {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Erro ao excluir anexo.');
        }
      }

      if (onAttachmentDeleted) {
        onAttachmentDeleted(item.id);
      }
      addToast('Documento excluído com sucesso.', 'success');
      setConfirmDelete({ isOpen: false, item: null });
    } catch (err) {
      addToast(err.message || 'Falha ao excluir documento.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }} data-testid="lesson-attachments-list">
      {/* Barra de Ações para Gestores (Upload Direto da Aula) */}
      {isManager && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '14px 18px',
            borderRadius: '10px',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
            border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '4px'
          }}
          data-testid="manager-attachments-toolbar"
        >
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: titleColor }}>
              Materiais Complementares da Aula
            </div>
            <div style={{ fontSize: '12px', color: tagColor, marginTop: '2px' }}>
              Faça upload de apostilas, PDFs, planilhas ou arquivos complementares para os alunos.
            </div>
          </div>

          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              style={{ display: 'none' }}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.csv,.png,.jpg,.jpeg,.webp"
              data-testid="direct-attachment-file-input"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="primary-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '12.5px',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
              data-testid="direct-upload-attachment-btn"
            >
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>
                    {uploadProgress.total > 1
                      ? `Enviando (${uploadProgress.current}/${uploadProgress.total})...`
                      : 'Enviando...'}
                  </span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>+ Anexar Arquivos do PC</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {(!attachments || attachments.length === 0) ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 16px',
          backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
          borderRadius: '8px',
          border: isLightBg ? '1px dashed #cbd5e1' : '1px dashed rgba(255, 255, 255, 0.12)',
          color: isLightBg ? '#64748b' : '#94a3b8'
        }} data-testid="empty-attachments-state">
          <Paperclip size={32} color={isLightBg ? '#94a3b8' : '#64748b'} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
          <p style={{ fontSize: '13.5px', fontWeight: 600, color: isLightBg ? '#334155' : '#f8fafc', margin: '0 0 4px 0' }}>
            Nenhum material complementar anexado
          </p>
          <p style={{ fontSize: '12.5px', margin: '0 0 16px 0' }}>
            Esta aula não possui documentos ou arquivos complementares para download.
          </p>

          {isManager && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="secondary-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                padding: '7px 16px',
                cursor: 'pointer'
              }}
              data-testid="empty-state-upload-attachment-btn"
            >
              <Upload size={14} />
              <span>Fazer Upload do Primeiro Arquivo</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {attachments.map((att, idx) => (
            <div
              key={att.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                backgroundColor: cardBg,
                border: cardBorder,
                borderRadius: '8px',
                backdropFilter: isLightBg ? 'none' : 'blur(8px)',
                transition: 'all 0.15s ease'
              }}
              data-testid={`attachment-item-${att.id || idx}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '8px',
                  backgroundColor: iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {getFileIcon(att.file_type)}
                </div>

                <div style={{ minWidth: 0 }}>
                  <h4 style={{
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: titleColor,
                    margin: 0,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {att.title || 'Documento Anexo'}
                  </h4>
                  {att.description && (
                    <p style={{
                      fontSize: '12px',
                      color: descColor,
                      margin: '3px 0 0 0',
                      lineHeight: 1.4,
                      whiteSpace: 'pre-wrap'
                    }} data-testid={`attachment-description-${att.id || idx}`}>
                      {att.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: tagColor,
                      backgroundColor: tagBg,
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}>
                      {att.file_type || 'Arquivo'}
                    </span>
                    {att.file_size_bytes > 0 && (
                      <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                        {formatFileSize(att.file_size_bytes)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <a
                  href={att.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.title || 'documento'}
                  className="primary-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    padding: '7px 14px',
                    textDecoration: 'none'
                  }}
                  data-testid={`access-attachment-btn-${att.id || idx}`}
                >
                  <ExternalLink size={14} />
                  <span>Acessar</span>
                </a>

                {isManager && att.id && (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete({ isOpen: true, item: att })}
                    className="secondary-btn"
                    style={{
                      padding: '7px 10px',
                      fontSize: '12px',
                      color: '#ef4444',
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)'
                    }}
                    title="Excluir documento anexo"
                    data-testid={`delete-attachment-btn-${att.id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Progresso durante Upload */}
      <UploadProgressModal
        isOpen={uploading}
        title="Enviando Material da Aula..."
        subtitle={`Enviando "${uploadFileName}" para o Backblaze B2. Aguarde...`}
      />

      {/* Modal de Confirmação de Exclusão do Anexo */}
      <FileDeleteConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Excluir Documento da Aula?"
        message={`Tem certeza que deseja excluir "${confirmDelete.item?.title || 'este documento'}"? Esta ação removerá o arquivo desta aula.`}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setConfirmDelete({ isOpen: false, item: null })}
      />
    </div>
  );
}
