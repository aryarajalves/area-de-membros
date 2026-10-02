import React, { useState } from 'react';
import {
  FileText, CheckCircle2, ChevronLeft, ChevronRight,
  BookOpen, Paperclip, Download, MessageSquare, Clock
} from 'lucide-react';
import LessonComments from './LessonComments';
import LessonAttachmentsList from './LessonAttachmentsList';
import LessonActionToolbar from './LessonActionToolbar';
import LessonNotes from './LessonNotes';
import { useToast } from '../../context/ToastContext';

export default function LessonTextViewer({
  lesson,
  courseTitle,
  moduleTitle,
  courseId,
  moduleId,
  currentUser,
  prevLesson,
  nextLesson,
  onSelectLesson,
  isCompleted = false,
  onToggleComplete,
  isLightBg = false,
  onCloseModule,
  onEditLesson,
  rightSidebar
}) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('content');
  const [togglingProgress, setTogglingProgress] = useState(false);

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#475569' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.03)';

  if (!lesson) return null;

  const contentText = lesson.text_content || lesson.description || '';
  const attachments = Array.isArray(lesson.attachments) ? lesson.attachments : [];

  // Alterna status de aula assistida com persistência no backend
  const handleToggleComplete = async () => {
    if (togglingProgress) return;
    setTogglingProgress(true);
    try {
      const nextStatus = !isCompleted;
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/courses/${courseId}/lessons/${lesson.id}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ is_completed: nextStatus })
      });

      if (res.ok) {
        if (onToggleComplete) onToggleComplete(lesson.id, nextStatus);
        addToast(
          nextStatus ? 'Aula marcada como concluída! Parabéns!' : 'Aula marcada como não assistida.',
          'success'
        );
      } else {
        addToast('Não foi possível atualizar o progresso da aula.', 'error');
      }
    } catch (err) {
      console.error('Erro ao alternar progresso:', err);
      addToast('Erro ao atualizar o progresso.', 'error');
    } finally {
      setTogglingProgress(false);
    }
  };

  // Renderiza conteúdo do artigo com suporte a imagens ![alt](url), títulos e formatação
  const renderArticleContent = (text) => {
    if (!text || !text.trim()) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: subTextColor }}>
          <FileText size={36} color={subTextColor} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>Nenhum conteúdo em texto cadastrado para esta aula ainda.</p>
        </div>
      );
    }

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmedLine = line.trim();
      const imgMatch = trimmedLine.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+|\/api\/[^\s)]+)\)$/);
      if (imgMatch) {
        const alt = imgMatch[1];
        const src = imgMatch[2];
        return (
          <div key={`article-img-${idx}`} style={{ margin: '24px 0', textAlign: 'center' }}>
            <img
              src={src}
              alt={alt}
              style={{
                maxWidth: '100%',
                maxHeight: '520px',
                borderRadius: '12px',
                border: `1px solid ${borderColor}`,
                objectFit: 'contain',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)'
              }}
            />
            {alt && (
              <span style={{ display: 'block', fontSize: '12.5px', color: subTextColor, marginTop: '8px', fontStyle: 'italic' }}>
                {alt}
              </span>
            )}
          </div>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={`h2-${idx}`} style={{ fontSize: '20px', fontWeight: 700, color: textColor, margin: '22px 0 10px 0' }}>
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h1 key={`h1-${idx}`} style={{ fontSize: '24px', fontWeight: 800, color: textColor, margin: '26px 0 12px 0' }}>
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={`li-${idx}`} style={{ marginLeft: '22px', marginBottom: '6px', color: textColor, lineHeight: 1.7 }}>
            {line.substring(2)}
          </li>
        );
      }
      if (line.trim() === '---') {
        return <hr key={`hr-${idx}`} style={{ border: 'none', borderTop: `1px solid ${borderColor}`, margin: '28px 0' }} />;
      }
      if (line.trim() === '') {
        return <div key={`empty-${idx}`} style={{ height: '12px' }} />;
      }
      return (
        <p key={`p-${idx}`} style={{ margin: '0 0 12px 0', color: textColor, lineHeight: 1.8, fontSize: '15px' }}>
          {line}
        </p>
      );
    });
  };

  return (
    <div data-testid="lesson-text-viewer-container" style={{ width: '100%' }}>
      {/* Banner Superior do Artigo / Aula de Leitura */}
      <div
        style={{
          maxWidth: '1080px',
          margin: '0 auto 32px auto',
          borderRadius: '16px',
          padding: '36px 32px',
          background: isLightBg
            ? 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)'
            : 'linear-gradient(135deg, rgba(234, 179, 8, 0.08) 0%, rgba(15, 23, 42, 0.85) 100%)',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              border: '1px solid rgba(234, 179, 8, 0.35)',
              color: '#facc15',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.6px'
            }}
          >
            <BookOpen size={13} />
            <span>Aula de Leitura & Artigo</span>
          </div>

          {lesson.duration && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
                color: subTextColor,
                fontSize: '11.5px',
                fontWeight: 600
              }}
            >
              <Clock size={12} />
              <span>{lesson.duration}</span>
            </div>
          )}
        </div>

        <h1
          data-testid="text-lesson-title"
          style={{
            fontSize: '26px',
            fontWeight: 800,
            color: textColor,
            margin: '0 0 14px 0',
            lineHeight: 1.3
          }}
        >
          {lesson.title}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginTop: '18px', paddingTop: '18px', borderTop: `1px solid ${borderColor}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: subTextColor }}>
            <span>Curso: <strong style={{ color: textColor }}>{courseTitle}</strong></span>
            <span>•</span>
            <span>Módulo: <strong style={{ color: textColor }}>{moduleTitle}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onToggleComplete && (
              <button
                type="button"
                onClick={handleToggleComplete}
                disabled={togglingProgress}
                data-testid="toggle-text-lesson-complete-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: togglingProgress ? 'wait' : 'pointer',
                  border: isCompleted ? '1px solid #10b981' : '1px solid #eab308',
                  backgroundColor: isCompleted ? 'rgba(16, 185, 129, 0.15)' : '#eab308',
                  color: isCompleted ? '#34d399' : '#0f172a',
                  transition: 'all 0.2s ease',
                  opacity: togglingProgress ? 0.7 : 1
                }}
              >
                <CheckCircle2 size={16} />
                <span>{isCompleted ? 'Aula Concluída ✓' : 'Marcar como Concluída'}</span>
              </button>
            )}

            {currentUser?.role in { admin: 1, superadmin: 1 } && onEditLesson && (
              <button
                type="button"
                onClick={() => onEditLesson(lesson)}
                className="secondary-btn"
                style={{ fontSize: '12.5px', padding: '8px 14px' }}
              >
                Editar Aula
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Principal com Sidebar Opcional */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: rightSidebar ? 'minmax(0, 1fr) 320px' : '1fr',
          gap: '40px',
          alignItems: 'start'
        }}
      >
        <div style={{ minWidth: 0 }}>
          {/* Abas de Navegação Inferiores */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              borderBottom: `1px solid ${borderColor}`,
              marginBottom: '24px',
              overflowX: 'auto'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '13.5px',
                fontWeight: activeTab === 'content' ? 700 : 500,
                color: activeTab === 'content' ? '#eab308' : subTextColor,
                borderBottom: activeTab === 'content' ? '2px solid #eab308' : '2px solid transparent'
              }}
              data-testid="tab-content-btn"
            >
              <FileText size={16} />
              <span>Conteúdo da Aula</span>
            </button>

            {attachments.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('attachments')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontSize: '13.5px',
                  fontWeight: activeTab === 'attachments' ? 700 : 500,
                  color: activeTab === 'attachments' ? '#eab308' : subTextColor,
                  borderBottom: activeTab === 'attachments' ? '2px solid #eab308' : '2px solid transparent'
                }}
                data-testid="tab-attachments-btn"
              >
                <Paperclip size={16} />
                <span>Materiais Complementares ({attachments.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '13.5px',
                fontWeight: activeTab === 'comments' ? 700 : 500,
                color: activeTab === 'comments' ? '#eab308' : subTextColor,
                borderBottom: activeTab === 'comments' ? '2px solid #eab308' : '2px solid transparent'
              }}
              data-testid="tab-comments-btn"
            >
              <MessageSquare size={16} />
              <span>Dúvidas e Comentários</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notes')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: '13.5px',
                fontWeight: activeTab === 'notes' ? 700 : 500,
                color: activeTab === 'notes' ? '#eab308' : subTextColor,
                borderBottom: activeTab === 'notes' ? '2px solid #eab308' : '2px solid transparent'
              }}
              data-testid="tab-notes-btn"
            >
              <BookOpen size={16} />
              <span>Anotações Pessoais</span>
            </button>
          </div>

          {/* Conteúdo da Aba Ativa */}
          {activeTab === 'content' && (
            <div
              data-testid="lesson-text-body"
              style={{
                backgroundColor: cardBg,
                borderRadius: '14px',
                border: `1px solid ${borderColor}`,
                padding: '30px',
                color: textColor,
                fontSize: '15px',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {renderArticleContent(contentText)}

              {/* Seção rápida de anexos caso existam */}
              {attachments.length > 0 && (
                <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: `1px solid ${borderColor}` }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 700, color: textColor, margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Paperclip size={16} color="#eab308" />
                    <span>Materiais e Documentos para Download:</span>
                  </h4>
                  <LessonAttachmentsList attachments={attachments} isLightBg={isLightBg} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div style={{ backgroundColor: cardBg, borderRadius: '14px', border: `1px solid ${borderColor}`, padding: '24px' }}>
              <LessonAttachmentsList attachments={attachments} isLightBg={isLightBg} />
            </div>
          )}

          {activeTab === 'comments' && (
            <LessonComments
              courseId={courseId}
              moduleId={moduleId}
              lessonId={lesson.id}
              currentUser={currentUser}
              isLightBg={isLightBg}
            />
          )}

          {activeTab === 'notes' && (
            <LessonNotes
              courseId={courseId}
              lessonId={lesson.id}
              isLightBg={isLightBg}
            />
          )}

          {/* Barra de Ações da Aula (Avaliação, Relatar Problema, Marcar como Assistida) */}
          <LessonActionToolbar
            courseId={courseId}
            lessonId={lesson.id}
            isCompleted={isCompleted}
            onToggleComplete={onToggleComplete}
            currentUser={currentUser}
          />

          {/* Navegação Entre Aulas (Anterior / Próxima) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '40px',
              paddingTop: '24px',
              borderTop: `1px solid ${borderColor}`
            }}
          >
            {prevLesson ? (
              <button
                type="button"
                onClick={() => onSelectLesson(prevLesson)}
                className="secondary-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                data-testid="prev-lesson-btn"
              >
                <ChevronLeft size={16} />
                <span>Aula Anterior: {prevLesson.title}</span>
              </button>
            ) : <div />}

            {nextLesson && (
              <button
                type="button"
                onClick={() => onSelectLesson(nextLesson)}
                className="primary-btn"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                data-testid="next-lesson-btn"
              >
                <span>Próxima Aula: {nextLesson.title}</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>

        {rightSidebar && <div>{rightSidebar}</div>}
      </div>
    </div>
  );
}
