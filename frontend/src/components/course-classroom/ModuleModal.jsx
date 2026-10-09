import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import LessonThumbnailManager from './LessonThumbnailManager';
import ExpandableTextarea from '../common/ExpandableTextarea';
import { useToast } from '../../context/ToastContext';
import ConfirmGenerateAiMetadataModal from './ConfirmGenerateAiMetadataModal';

export default function ModuleModal({
  isOpen,
  onClose,
  onSave,
  onUploadThumbnail,
  editingModule,
  courseId,
  onModuleUpdated,
  loading,
  bgColor = '#090d16'
}) {
  const { addToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiConfirmOpen, setAiConfirmOpen] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    if (editingModule) {
      setTitle(editingModule.title || '');
      setDescription(editingModule.description || '');
      setImageUrl(editingModule.image_url || '');
      setOrderIndex(editingModule.order_index || 0);
    } else {
      setTitle('');
      setDescription('');
      setImageUrl('');
      setOrderIndex(0);
    }
  }, [editingModule, isOpen]);

  if (!isOpen) return null;

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const modalBg = isLightBg ? '#ffffff' : (bgColor === '#000000' ? '#0f172a' : bgColor);
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';

  const handleGenerateAiOverview = async () => {
    if (!courseId || !editingModule?.id) return;
    try {
      setAiLoading(true);
      const res = await fetch(`/api/v1/courses/${courseId}/modules/${editingModule.id}/generate-ai-overview`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Falha ao gerar título e descrição do módulo com IA.');
      }
      const data = await res.json();
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      addToast('Título e descrição do módulo gerados com sucesso com base nas transcrições das aulas!', 'success');
      setAiConfirmOpen(false);
      onModuleUpdated?.(data);
    } catch (err) {
      console.error('Erro ao gerar visão do módulo com IA:', err);
      addToast(err.message || 'Erro ao gerar conteúdo com IA.', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      order_index: parseInt(orderIndex, 10) || 0
    });
  };

  return (
    <div className="custom-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="table-card" style={{ maxWidth: '520px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '14px', backgroundColor: modalBg, border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.14)', color: textColor, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: textColor }}>
            {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="table-action-btn"
            style={{ border: 'none', background: 'transparent', color: textColor }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: textColor, margin: 0 }}>
                Título do Módulo *
              </label>
              {editingModule && (
                <button
                  type="button"
                  onClick={() => setAiConfirmOpen(true)}
                  disabled={aiLoading || loading}
                  className="table-action-btn"
                  data-testid="btn-generate-module-ai-overview"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '7px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.25) 100%)',
                    color: '#c084fc',
                    border: '1px solid rgba(168, 85, 247, 0.45)',
                    cursor: (aiLoading || loading) ? 'not-allowed' : 'pointer',
                    opacity: (aiLoading || loading) ? 0.7 : 1
                  }}
                  title="Gerar título e descrição com base nas transcrições de todas as aulas deste módulo"
                >
                  {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  <span>{aiLoading ? 'Gerando com IA...' : 'Gerar com IA'}</span>
                </button>
              )}
            </div>
            <input
              type="text"
              required
              placeholder="Ex: Módulo 1 - Fundamentos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control-modern"
              data-testid="module-title-input"
            />
          </div>

          <ExpandableTextarea
            label="Descrição (Opcional)"
            placeholder="O que o aluno aprenderá neste módulo..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            textColor={textColor}
            subTextColor={isLightBg ? '#64748b' : '#94a3b8'}
            testId="module-description-input"
          />

          {onUploadThumbnail && (
            <div>
              <LessonThumbnailManager
                title="Imagem de Capa / Pôster do Módulo (Estilo Netflix - Opcional)"
                thumbnailUrl={imageUrl}
                onChange={setImageUrl}
                onUploadThumbnail={onUploadThumbnail}
                isLightBg={isLightBg}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Ordem de Exibição
            </label>
            <input
              type="number"
              min={0}
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              className="form-control-modern"
              data-testid="module-order-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="primary-btn" disabled={loading} data-testid="save-module-btn">
              {loading ? 'Salvando...' : (editingModule ? 'Salvar Alterações' : 'Criar Módulo')}
            </button>
          </div>
        </form>
      </div>

      <ConfirmGenerateAiMetadataModal
        isOpen={aiConfirmOpen}
        loading={aiLoading}
        isLightBg={isLightBg}
        title="Gerar Título e Descrição do Módulo com IA?"
        message="A Inteligência Artificial analisará as transcrições e conteúdos de todas as aulas cadastradas neste módulo para criar um título atrativo e uma descrição pedagógica completa. O título e a descrição atuais serão substituídos pelo conteúdo gerado. Deseja continuar?"
        onConfirm={handleGenerateAiOverview}
        onClose={() => {
          if (!aiLoading) setAiConfirmOpen(false);
        }}
      />
    </div>
  );
}
