import React, { useState, useEffect } from 'react';
import {
  X, Video, FileText, Image as ImageIcon, Paperclip,
  Clock, CheckCircle2, HelpCircle, BookOpen
} from 'lucide-react';
import LessonVideoManager from './LessonVideoManager';
import LessonAttachmentsManager from './LessonAttachmentsManager';
import LessonThumbnailManager from './LessonThumbnailManager';
import LessonQuizEditor from './LessonQuizEditor';
import LessonArticleEditor from './LessonArticleEditor';
import { normalizeLessonDuration } from './lessonUtils';

export default function LessonModal({
  isOpen,
  onClose,
  onSave,
  onUploadVideo,
  onUploadThumbnail,
  editingLesson,
  moduleTitle,
  courseId,
  loading,
  bgColor = '#090d16'
}) {
  const [contentType, setContentType] = useState('video'); // 'video', 'text', 'quiz'
  const [activeTab, setActiveTab] = useState('info');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [textContent, setTextContent] = useState('');
  const [duration, setDuration] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [passingScorePct, setPassingScorePct] = useState(70);

  useEffect(() => {
    setActiveTab('info');
    if (editingLesson) {
      setContentType(editingLesson.content_type || 'video');
      setTitle(editingLesson.title || '');
      setDescription(editingLesson.description || '');
      setTextContent(editingLesson.text_content || '');
      setDuration(editingLesson.duration || '');
      setOrderIndex(editingLesson.order_index || 0);
      setAvailabilityStatus(editingLesson.availability_status || 'available');
      setThumbnailUrl(editingLesson.thumbnail_url || '');
      setAttachments(editingLesson.attachments || []);
      setPassingScorePct(editingLesson.passing_score_pct !== undefined && editingLesson.passing_score_pct !== null ? editingLesson.passing_score_pct : 70);

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
        setVideos([{ language: 'pt', language_label: 'Português', video_url: '', video_type: 'upload' }]);
      }

      // Se a aula for quiz e tiver id, busca as perguntas existentes com token autenticado
      if (editingLesson.content_type === 'quiz' && editingLesson.id && courseId) {
        const token = localStorage.getItem('auth_token');
        fetch(`/api/v1/courses/${courseId}/lessons/${editingLesson.id}/quiz`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.questions && data.questions.length > 0) setQuizQuestions(data.questions);
            else setQuizQuestions([]);
            if (data?.passing_score_pct !== undefined && data.passing_score_pct !== null) {
              setPassingScorePct(data.passing_score_pct);
            }
          })
          .catch(() => {});
      }
    } else {
      setContentType('video');
      setTitle('');
      setDescription('');
      setTextContent('');
      setDuration('');
      setOrderIndex(0);
      setAvailabilityStatus('available');
      setThumbnailUrl('');
      setAttachments([]);
      setQuizQuestions([]);
      setPassingScorePct(70);
      setVideos([{ language: 'pt', language_label: 'Português', video_url: '', video_type: 'upload' }]);
    }
  }, [editingLesson, isOpen, courseId]);

  if (!isOpen) return null;

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const modalBg = isLightBg ? '#ffffff' : (bgColor === '#000000' ? '#0f172a' : bgColor);
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)';

  // Definir as abas dinâmicas conforme o contentType
  const tabs = [
    { id: 'info', label: 'Dados Gerais', icon: FileText }
  ];

  if (contentType === 'video') {
    tabs.push({ id: 'videos', label: 'Vídeos e Idiomas', icon: Video });
  } else if (contentType === 'text') {
    tabs.push({ id: 'text_body', label: 'Texto do Artigo', icon: BookOpen });
  } else if (contentType === 'quiz') {
    tabs.push({ id: 'quiz', label: 'Perguntas do Quiz', icon: HelpCircle });
  }

  tabs.push({ id: 'thumbnail', label: 'Capa da Aula', icon: ImageIcon });

  if (contentType !== 'quiz') {
    tabs.push({ id: 'attachments', label: 'Materiais', icon: Paperclip });
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setActiveTab('info');
      return;
    }

    const validVideos = videos
      .filter((v) => v.video_url && v.video_url.trim())
      .map((v) => ({
        language: v.language || 'pt',
        language_label: v.language_label || 'Português',
        title: v.title ? v.title.trim() : null,
        description: v.description ? v.description.trim() : null,
        video_url: v.video_url.trim(),
        video_type: v.video_type || 'upload'
      }));

    const validAttachments = attachments
      .filter((att) => att.file_url && att.file_url.trim())
      .map((att) => ({
        title: att.title ? att.title.trim() : 'Documento',
        description: att.description ? att.description.trim() : null,
        file_url: att.file_url.trim(),
        file_type: att.file_type || null,
        file_size_bytes: att.file_size_bytes || null
      }));

    onSave({
      title: title.trim(),
      description: description.trim() || null,
      content_type: contentType,
      text_content: contentType === 'text' ? (textContent.trim() || null) : null,
      duration: normalizeLessonDuration(duration),
      order_index: parseInt(orderIndex, 10) || 0,
      availability_status: availabilityStatus,
      thumbnail_url: thumbnailUrl.trim() || null,
      videos: contentType === 'video' ? validVideos : [],
      attachments: validAttachments,
      quiz_questions: contentType === 'quiz' ? quizQuestions : [],
      passing_score_pct: contentType === 'quiz' ? (parseInt(passingScorePct, 10) || 70) : 70
    });
  };

  return (
    <div className="custom-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="table-card" style={{ maxWidth: '780px', width: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px', borderRadius: '14px', backgroundColor: modalBg, border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.14)', color: textColor, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        
        {/* Topo do Modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 2px 0', color: textColor }}>
              {editingLesson ? 'Editar Aula' : 'Nova Aula'}
            </h2>
            <span style={{ fontSize: '12px', color: subTextColor }}>
              Módulo: <strong>{moduleTitle}</strong>
            </span>
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

        {/* Seletor de Tipo de Aula */}
        <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '10px', backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255,255,255,0.03)', border: `1px solid ${borderColor}` }}>
          <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: subTextColor, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Tipo de Aula:
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => { setContentType('video'); setActiveTab('info'); }}
              data-testid="type-video-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: contentType === 'video' ? 700 : 500,
                cursor: 'pointer',
                border: contentType === 'video' ? '1.5px solid #eab308' : `1px solid ${borderColor}`,
                backgroundColor: contentType === 'video' ? (isLightBg ? '#fefce8' : 'rgba(234, 179, 8, 0.16)') : 'transparent',
                color: contentType === 'video' ? '#eab308' : subTextColor
              }}
            >
              <Video size={15} />
              <span>Vídeo-aula</span>
            </button>

            <button
              type="button"
              onClick={() => { setContentType('text'); setActiveTab('info'); }}
              data-testid="type-text-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: contentType === 'text' ? 700 : 500,
                cursor: 'pointer',
                border: contentType === 'text' ? '1.5px solid #38bdf8' : `1px solid ${borderColor}`,
                backgroundColor: contentType === 'text' ? (isLightBg ? '#f0f9ff' : 'rgba(56, 189, 248, 0.16)') : 'transparent',
                color: contentType === 'text' ? '#38bdf8' : subTextColor
              }}
            >
              <BookOpen size={15} />
              <span>Apenas Texto / Artigo</span>
            </button>

            <button
              type="button"
              onClick={() => { setContentType('quiz'); setActiveTab('info'); }}
              data-testid="type-quiz-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: contentType === 'quiz' ? 700 : 500,
                cursor: 'pointer',
                border: contentType === 'quiz' ? '1.5px solid #a855f7' : `1px solid ${borderColor}`,
                backgroundColor: contentType === 'quiz' ? (isLightBg ? '#faf5ff' : 'rgba(168, 85, 247, 0.16)') : 'transparent',
                color: contentType === 'quiz' ? '#a855f7' : subTextColor
              }}
            >
              <HelpCircle size={15} />
              <span>Quiz Interativo</span>
            </button>
          </div>
        </div>

        {/* Abas */}
        <div data-testid="lesson-modal-tabs" style={{ display: 'flex', gap: '6px', borderBottom: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)', marginBottom: '18px', overflowX: 'auto' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                data-testid={`lesson-modal-tab-${tab.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#eab308' : subTextColor,
                  borderBottom: isActive ? '2px solid #eab308' : '2px solid transparent',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Conteúdo do Formulário */}
        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
          <div data-testid="lesson-modal-panel-info" style={{ display: activeTab === 'info' ? 'block' : 'none', display: activeTab === 'info' ? 'flex' : 'none', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
                Título da Aula *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Introdução ao Módulo"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="form-control-modern"
                data-testid="lesson-title-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
                Breve Resumo ou Descrição da Aula
              </label>
              <textarea
                rows={2}
                placeholder="Explicação do objetivo ou resumo do conteúdo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-control-modern"
                style={{ resize: 'vertical' }}
                data-testid="lesson-description-input"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
                  Duração Estimada (em minutos)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 20 min ou 15:30"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="form-control-modern"
                  data-testid="lesson-duration-input"
                />
                <span style={{ fontSize: '11px', color: subTextColor, marginTop: '4px', display: 'block' }}>
                  Tempo em minutos (ex: <strong>20 min</strong> ou <strong>15:30</strong>)
                </span>
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
                  data-testid="lesson-order-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
                Status de Liberação da Aula
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setAvailabilityStatus('available')}
                  data-testid="lesson-status-available-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: availabilityStatus === 'available' ? 700 : 500,
                    cursor: 'pointer',
                    border: availabilityStatus === 'available' ? '1.5px solid #22c55e' : (isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.12)'),
                    backgroundColor: availabilityStatus === 'available' ? (isLightBg ? '#f0fdf4' : 'rgba(34, 197, 94, 0.16)') : (isLightBg ? '#ffffff' : 'rgba(255,255,255,0.03)'),
                    color: availabilityStatus === 'available' ? '#22c55e' : subTextColor
                  }}
                >
                  <CheckCircle2 size={15} color={availabilityStatus === 'available' ? '#22c55e' : subTextColor} />
                  <span>Disponível para os Alunos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAvailabilityStatus('coming_soon')}
                  data-testid="lesson-status-coming-soon-btn"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: availabilityStatus === 'coming_soon' ? 700 : 500,
                    cursor: 'pointer',
                    border: availabilityStatus === 'coming_soon' ? '1.5px solid #eab308' : (isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.12)'),
                    backgroundColor: availabilityStatus === 'coming_soon' ? (isLightBg ? '#fefce8' : 'rgba(234, 179, 8, 0.16)') : (isLightBg ? '#ffffff' : 'rgba(255,255,255,0.03)'),
                    color: availabilityStatus === 'coming_soon' ? '#eab308' : subTextColor
                  }}
                >
                  <Clock size={15} color={availabilityStatus === 'coming_soon' ? '#eab308' : subTextColor} />
                  <span>Em Breve</span>
                </button>
              </div>
            </div>
          </div>

          {contentType === 'video' && (
            <div data-testid="lesson-modal-panel-videos" style={{ display: activeTab === 'videos' ? 'block' : 'none' }}>
              <LessonVideoManager
                videos={videos}
                onChange={setVideos}
                onUploadVideo={onUploadVideo}
                uploading={uploading}
                setUploading={setUploading}
                isLightBg={isLightBg}
              />
            </div>
          )}

          {contentType === 'text' && (
            <div data-testid="lesson-modal-panel-text_body" style={{ display: activeTab === 'text_body' ? 'block' : 'none' }}>
              <LessonArticleEditor
                textContent={textContent}
                onChange={setTextContent}
                onUploadImage={onUploadThumbnail}
                isLightBg={isLightBg}
              />
            </div>
          )}

          {contentType === 'quiz' && (
            <div data-testid="lesson-modal-panel-quiz" style={{ display: activeTab === 'quiz' ? 'block' : 'none' }}>
              <LessonQuizEditor
                questions={quizQuestions}
                onChangeQuestions={setQuizQuestions}
                passingScorePct={passingScorePct}
                onChangePassingScorePct={setPassingScorePct}
                isLightBg={isLightBg}
              />
            </div>
          )}

          <div data-testid="lesson-modal-panel-thumbnail" style={{ display: activeTab === 'thumbnail' ? 'block' : 'none' }}>
            <LessonThumbnailManager
              thumbnailUrl={thumbnailUrl}
              onChange={setThumbnailUrl}
              onUploadThumbnail={onUploadThumbnail}
              isLightBg={isLightBg}
            />
          </div>

          {contentType !== 'quiz' && (
            <div data-testid="lesson-modal-panel-attachments" style={{ display: activeTab === 'attachments' ? 'block' : 'none' }}>
              <LessonAttachmentsManager
                attachments={attachments}
                onChange={setAttachments}
                isLightBg={isLightBg}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)' }}>
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
