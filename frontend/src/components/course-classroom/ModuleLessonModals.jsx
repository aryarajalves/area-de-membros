import React, { useState, useEffect } from 'react';
import { X, Video, AlertTriangle, FileText, Image as ImageIcon, Paperclip, Clock, CheckCircle2 } from 'lucide-react';
import LessonVideoManager from './LessonVideoManager';
import LessonAttachmentsManager from './LessonAttachmentsManager';
import LessonThumbnailManager from './LessonThumbnailManager';
import { normalizeLessonDuration } from './lessonUtils';

export function ModuleModal({
  isOpen,
  onClose,
  onSave,
  onUploadThumbnail,
  editingModule,
  loading,
  bgColor = '#090d16'
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);

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
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Título do Módulo *
            </label>
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

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Descrição (Opcional)
            </label>
            <textarea
              rows={2}
              placeholder="O que o aluno aprenderá neste módulo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-control-modern"
              style={{ resize: 'vertical' }}
              data-testid="module-description-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Imagem de Capa / Pôster do Módulo (Estilo Netflix - Opcional)
            </label>
            <input
              type="text"
              placeholder="Cole a URL da imagem de capa ou envie do computador abaixo..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="form-control-modern"
              style={{ marginBottom: '8px' }}
              data-testid="module-image-url-input"
            />
            {onUploadThumbnail && (
              <LessonThumbnailManager
                thumbnailUrl={imageUrl}
                onChange={setImageUrl}
                onUploadThumbnail={onUploadThumbnail}
                isLightBg={isLightBg}
              />
            )}
          </div>

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
    </div>
  );
}

const LESSON_MODAL_TABS = [
  { id: 'info', label: 'Dados Gerais', icon: FileText },
  { id: 'videos', label: 'Vídeos e Idiomas', icon: Video },
  { id: 'thumbnail', label: 'Capa da Aula', icon: ImageIcon },
  { id: 'attachments', label: 'Materiais', icon: Paperclip }
];

export function LessonModal({
  isOpen,
  onClose,
  onSave,
  onUploadVideo,
  onUploadThumbnail,
  editingLesson,
  moduleTitle,
  loading,
  bgColor = '#090d16'
}) {
  const [activeTab, setActiveTab] = useState('info');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    setActiveTab('info');
    if (editingLesson) {
      setTitle(editingLesson.title || '');
      setDescription(editingLesson.description || '');
      setDuration(editingLesson.duration || '');
      setOrderIndex(editingLesson.order_index || 0);
      setAvailabilityStatus(editingLesson.availability_status || 'available');
      setThumbnailUrl(editingLesson.thumbnail_url || '');
      setAttachments(editingLesson.attachments || []);

      if (editingLesson.videos && editingLesson.videos.length > 0) {
        setVideos(editingLesson.videos);
      } else if (editingLesson.video_url) {
        setVideos([{
          language: 'pt',
          language_label: 'Português',
          video_url: editingLesson.video_url,
          video_type: editingLesson.video_type || 'upload'
        }]);
      } else {
        setVideos([{
          language: 'pt',
          language_label: 'Português',
          video_url: '',
          video_type: 'upload'
        }]);
      }
    } else {
      setTitle('');
      setDescription('');
      setDuration('');
      setOrderIndex(0);
      setAvailabilityStatus('available');
      setThumbnailUrl('');
      setAttachments([]);
      setVideos([{
        language: 'pt',
        language_label: 'Português',
        video_url: '',
        video_type: 'upload'
      }]);
    }
  }, [editingLesson, isOpen]);

  if (!isOpen) return null;

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const modalBg = isLightBg ? '#ffffff' : (bgColor === '#000000' ? '#0f172a' : bgColor);
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setActiveTab('info');
      return;
    }

    const validVideos = videos
      .filter((v) => v.video_url && v.video_url.trim())
      .map((v) => ({
        ...v,
        language_label: v.language_label?.trim() || (v.language === 'pt' ? 'Português' : (v.language === 'en' ? 'Inglês' : (v.language === 'es' ? 'Espanhol' : 'Idioma'))),
        title: v.title?.trim() || title.trim(),
        description: v.description !== undefined && v.description !== null && v.description !== ''
          ? v.description.trim()
          : (description.trim() || null)
      }));
    const primary = validVideos[0] || videos[0];

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      thumbnail_url: thumbnailUrl ? thumbnailUrl.trim() : null,
      video_type: primary?.video_type || 'upload',
      video_url: primary?.video_url || null,
      videos: validVideos,
      attachments: attachments.map((a) => ({
        title: a.title,
        description: a.description || null,
        file_url: a.file_url,
        file_type: a.file_type,
        file_size_bytes: a.file_size_bytes
      })),
      duration: normalizeLessonDuration(duration),
      order_index: parseInt(orderIndex, 10) || 0,
      availability_status: availabilityStatus
    });
  };

  return (
    <div className="custom-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="table-card" style={{ maxWidth: '600px', width: '92%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '14px', backgroundColor: modalBg, border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.14)', color: textColor, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho do Modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: textColor }}>
              {editingLesson ? 'Editar Aula' : 'Nova Aula'}
            </h2>
            {moduleTitle && (
              <span style={{ fontSize: '12px', color: subTextColor }}>No módulo: {moduleTitle}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="table-action-btn"
            style={{ border: 'none', background: 'transparent', color: textColor }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Abas para Separar as Informações */}
        <div
          data-testid="lesson-modal-tabs"
          style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '18px', paddingBottom: '12px', borderBottom: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)' }}
        >
          {LESSON_MODAL_TABS.map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeTab === tab.id;
            const badgeCount = tab.id === 'attachments' ? attachments.length : (tab.id === 'videos' ? videos.filter((v) => v.video_url).length : 0);

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-testid={`lesson-modal-tab-${tab.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontWeight: isTabActive ? 700 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: isTabActive ? (isLightBg ? '#e0f2fe' : 'rgba(56, 189, 248, 0.16)') : (isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)'),
                  color: isTabActive ? (isLightBg ? '#0284c7' : '#38bdf8') : subTextColor,
                  border: isTabActive ? (isLightBg ? '1px solid #bae6fd' : '1px solid rgba(56, 189, 248, 0.4)') : (isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)')
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {badgeCount > 0 && (
                  <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '999px', backgroundColor: isTabActive ? '#38bdf8' : 'rgba(255,255,255,0.12)', color: isTabActive ? '#0f172a' : textColor, fontWeight: 700 }}>
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* ABA 1: Dados Gerais */}
          <div data-testid="lesson-modal-panel-info" style={{ display: activeTab === 'info' ? 'flex' : 'none', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>Nome da Aula *</label>
              <input type="text" required placeholder="Ex: Aula 01 - Criando a Primeira Campanha" value={title} onChange={(e) => setTitle(e.target.value)} className="form-control-modern" data-testid="lesson-title-input" />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>Descrição da Aula</label>
              <textarea rows={4} placeholder="Explique os objetivos ou materiais complementares desta aula..." value={description} onChange={(e) => setDescription(e.target.value)} className="form-control-modern" style={{ resize: 'vertical' }} data-testid="lesson-description-input" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
                  Duração Estimada <span style={{ fontSize: '12px', fontWeight: 500, color: subTextColor }}>(em minutos)</span>
                </label>
                <input type="text" placeholder="Ex: 20 min ou 15:30" value={duration} onChange={(e) => setDuration(e.target.value)} className="form-control-modern" data-testid="lesson-duration-input" />
                <span style={{ fontSize: '11px', color: subTextColor, marginTop: '4px', display: 'block' }}>
                  Tempo em minutos (ex: <strong>20 min</strong> ou <strong>15:30</strong>)
                </span>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>Ordem da Aula</label>
                <input type="number" min={0} value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} className="form-control-modern" data-testid="lesson-order-input" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
                Status da Aula para os Alunos
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setAvailabilityStatus('available')}
                  data-testid="lesson-status-available-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: availabilityStatus === 'available' ? 700 : 500, cursor: 'pointer', border: availabilityStatus === 'available' ? '1.5px solid #22c55e' : (isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.12)'), backgroundColor: availabilityStatus === 'available' ? (isLightBg ? '#f0fdf4' : 'rgba(34, 197, 94, 0.14)') : (isLightBg ? '#ffffff' : 'rgba(255,255,255,0.03)'), color: availabilityStatus === 'available' ? '#22c55e' : subTextColor }}
                >
                  <CheckCircle2 size={15} color={availabilityStatus === 'available' ? '#22c55e' : subTextColor} />
                  <span>Disponível</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAvailabilityStatus('coming_soon')}
                  data-testid="lesson-status-coming-soon-btn"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', fontSize: '12.5px', fontWeight: availabilityStatus === 'coming_soon' ? 700 : 500, cursor: 'pointer', border: availabilityStatus === 'coming_soon' ? '1.5px solid #eab308' : (isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.12)'), backgroundColor: availabilityStatus === 'coming_soon' ? (isLightBg ? '#fefce8' : 'rgba(234, 179, 8, 0.16)') : (isLightBg ? '#ffffff' : 'rgba(255,255,255,0.03)'), color: availabilityStatus === 'coming_soon' ? '#eab308' : subTextColor }}
                >
                  <Clock size={15} color={availabilityStatus === 'coming_soon' ? '#eab308' : subTextColor} />
                  <span>Em Breve</span>
                </button>
              </div>
              <span style={{ fontSize: '11px', color: subTextColor, marginTop: '5px', display: 'block', lineHeight: 1.45 }}>
                {availabilityStatus === 'coming_soon'
                  ? 'A aula aparecerá com o selo "Em Breve" e exibirá um painel avisando que o conteúdo será liberado em breve.'
                  : 'Aula pronta para assistir. Caso nenhum vídeo seja enviado na aba "Vídeos e Idiomas", ela também entrará automaticamente como "Em Breve".'}
              </span>
            </div>
          </div>

          {/* ABA 2: Vídeos e Idiomas */}
          <div data-testid="lesson-modal-panel-videos" style={{ display: activeTab === 'videos' ? 'block' : 'none' }}>
            <LessonVideoManager videos={videos} onChange={setVideos} onUploadVideo={onUploadVideo} uploading={uploading} setUploading={setUploading} lessonTitle={title} lessonDescription={description} isLightBg={isLightBg} />
          </div>

          {/* ABA 3: Capa da Aula */}
          <div data-testid="lesson-modal-panel-thumbnail" style={{ display: activeTab === 'thumbnail' ? 'block' : 'none' }}>
            <LessonThumbnailManager thumbnailUrl={thumbnailUrl} onChange={setThumbnailUrl} onUploadThumbnail={onUploadThumbnail} isLightBg={isLightBg} />
          </div>

          {/* ABA 4: Materiais Complementares e Anexos */}
          <div data-testid="lesson-modal-panel-attachments" style={{ display: activeTab === 'attachments' ? 'block' : 'none' }}>
            <LessonAttachmentsManager attachments={attachments} onChange={setAttachments} isLightBg={isLightBg} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', paddingTop: '12px', borderTop: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading || uploading}>
              Cancelar
            </button>
            <button type="submit" className="primary-btn" disabled={loading || uploading} data-testid="save-lesson-btn">
              {loading ? 'Salvando...' : (editingLesson ? 'Salvar Alterações' : 'Criar Aula')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  bgColor = '#090d16'
}) {
  if (!isOpen) return null;

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const modalBg = isLightBg ? '#ffffff' : (bgColor === '#000000' ? '#0f172a' : bgColor);
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';

  return (
    <div className="custom-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
      <div className="table-card" style={{ maxWidth: '420px', width: '90%', padding: '26px 24px', borderRadius: '14px', backgroundColor: modalBg, border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.14)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: isLightBg ? '#fee2e2' : 'rgba(239, 68, 68, 0.16)', border: isLightBg ? 'none' : '1px solid rgba(239, 68, 68, 0.35)', color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <AlertTriangle size={26} />
        </div>
        <h3 style={{ fontSize: '17.5px', fontWeight: 700, color: textColor, marginBottom: '8px' }}>
          {title}
        </h3>
        <p style={{ fontSize: '13.5px', color: subTextColor, lineHeight: '1.5', marginBottom: '22px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <button
            type="button"
            className="secondary-btn"
            style={!isLightBg ? { backgroundColor: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc', border: '1px solid rgba(255, 255, 255, 0.16)' } : undefined}
            onClick={onCancel}
            disabled={loading}
            data-testid="cancel-delete-btn"
          >
            Cancelar
          </button>
          <button
            type="button"
            className="primary-btn"
            style={{ backgroundColor: '#ef4444' }}
            onClick={onConfirm}
            disabled={loading}
            data-testid="confirm-delete-btn"
          >
            {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </div>
  );
}
