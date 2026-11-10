import React, { useState, useRef } from 'react';
import { Paperclip, Upload, Loader2, Brain } from 'lucide-react';
import { UploadProgressModal, FileDeleteConfirmModal } from '../common/FeedbackModals';
import RenameAttachmentModal from './RenameAttachmentModal';
import AttachmentCardItem from './AttachmentCardItem';
import { useToast } from '../../context/ToastContext';

export default function LessonAttachmentsList({
  attachments = [],
  isLightBg = false,
  courseId,
  moduleId,
  lessonId,
  isManager = false,
  onAttachmentAdded,
  onAttachmentDeleted,
  onAttachmentUpdated
}) {
  const [uploading, setUploading] = useState(false);
  const [generatingMindmap, setGeneratingMindmap] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, item: null });
  const [renameModal, setRenameModal] = useState({ isOpen: false, item: null });
  const [renaming, setRenaming] = useState(false);
  const fileInputRef = useRef(null);
  const { addToast } = useToast();

  const handleGenerateMindmap = async () => {
    if (!courseId || !moduleId || !lessonId || generatingMindmap) return;
    setGeneratingMindmap(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/mindmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.detail || 'Não foi possível gerar o mapa mental com IA.');
      if (data.attachment && onAttachmentAdded) onAttachmentAdded(data.attachment);
      addToast(data.message || 'Mapa Mental gerado com sucesso com IA!', 'success');
    } catch (err) {
      addToast(err.message || 'Falha ao gerar mapa mental.', 'error');
    } finally {
      setGeneratingMindmap(false);
    }
  };

  const titleColor = isLightBg ? '#1e293b' : '#f8fafc';
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
        if (!resolvedFileUrl) throw new Error(`Servidor não retornou a URL para "${file.name}".`);

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
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify(payload)
            }
          );

          if (!attachRes.ok) {
            const err = await attachRes.json().catch(() => ({}));
            throw new Error(err.detail || `Falha ao vincular "${file.name}" à aula.`);
          }
          const createdAtt = await attachRes.json();
          if (onAttachmentAdded) onAttachmentAdded(createdAtt);
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

  const handleConfirmRename = async (newTitle) => {
    const item = renameModal.item;
    if (!item || !newTitle) return;
    setRenaming(true);
    const token = localStorage.getItem('auth_token');
    try {
      if (courseId && moduleId && lessonId && item.id) {
        const res = await fetch(
          `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/attachments/${item.id}`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ title: newTitle })
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Erro ao renomear anexo.');
        }
        const updated = await res.json();
        if (onAttachmentUpdated) onAttachmentUpdated(updated);
      } else if (onAttachmentUpdated) {
        onAttachmentUpdated({ ...item, title: newTitle });
      }
      addToast('Nome do material complementar atualizado!', 'success');
      setRenameModal({ isOpen: false, item: null });
    } catch (err) {
      addToast(err.message || 'Falha ao renomear documento.', 'error');
    } finally {
      setRenaming(false);
    }
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleGenerateMindmap}
              disabled={generatingMindmap || uploading}
              className="secondary-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                fontSize: '12.5px',
                padding: '8px 14px',
                borderRadius: '8px',
                cursor: generatingMindmap ? 'not-allowed' : 'pointer',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0.15) 100%)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                color: '#c084fc'
              }}
              data-testid="generate-mindmap-btn"
              title="Gera automaticamente um mapa mental interativo a partir da transcrição desta aula"
            >
              {generatingMindmap ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Gerando Mapa...</span>
                </>
              ) : (
                <>
                  <Brain size={14} />
                  <span>🧠 Gerar Mapa Mental (IA)</span>
                </>
              )}
            </button>

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
              disabled={uploading || generatingMindmap}
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
                  <span>+ Anexar Arquivos</span>
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
            <AttachmentCardItem
              key={att.id || idx}
              attachment={att}
              index={idx}
              isLightBg={isLightBg}
              isManager={isManager}
              onRename={(item) => setRenameModal({ isOpen: true, item })}
              onDelete={(item) => setConfirmDelete({ isOpen: true, item })}
            />
          ))}
        </div>
      )}

      {/* Modal de Renomear Material Complementar */}
      <RenameAttachmentModal
        isOpen={renameModal.isOpen}
        attachment={renameModal.item}
        loading={renaming}
        onConfirm={handleConfirmRename}
        onCancel={() => !renaming && setRenameModal({ isOpen: false, item: null })}
      />

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
