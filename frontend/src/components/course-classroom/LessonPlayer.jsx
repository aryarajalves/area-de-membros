import React, { useState, useEffect } from 'react';
import {
  PlayCircle, Clock, ChevronLeft, ChevronRight, Video, AlertCircle,
  ExternalLink, FileText, MessageSquare, Globe, Paperclip, BookOpen, Sparkles
} from 'lucide-react';
import LessonComments from './LessonComments';
import LessonAttachmentsList from './LessonAttachmentsList';
import LessonActionToolbar from './LessonActionToolbar';
import LessonNotes from './LessonNotes';
import CustomVideoPlayer from './CustomVideoPlayer';
import { formatLessonDuration, isLessonComingSoon } from './lessonUtils';

const LANG_FLAGS = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  other: '🌐'
};

function getEmbedUrl(videoUrl) {
  if (!videoUrl) return null;

  const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  }

  const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return null;
}

export default function LessonPlayer({
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
  const [activeTab, setActiveTab] = useState('overview');
  const isManager = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';

  const videos = (lesson?.videos && lesson.videos.length > 0)
    ? lesson.videos
    : (lesson?.video_url
      ? [{ language: 'pt', language_label: 'Português', video_url: lesson.video_url, video_type: lesson.video_type || 'upload' }]
      : []);

  const [selectedLang, setSelectedLang] = useState('pt');

  useEffect(() => {
    if (videos.length > 0 && !videos.some((v) => v.language === selectedLang)) {
      setSelectedLang(videos[0].language);
    }
  }, [lesson, videos, selectedLang]);

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#475569' : '#94a3b8';
  const mutedColor = isLightBg ? '#64748b' : '#64748b';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';

  if (!lesson) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: rightSidebar ? 'minmax(0, 1fr) 310px' : '1fr', gap: '48px', alignItems: 'start' }}>
        <div style={{ textAlign: 'center', padding: '80px 20px', color: subTextColor, borderRadius: '14px', border: `1px dashed ${borderColor}`, backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.02)', minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <PlayCircle size={42} color="#eab308" style={{ marginBottom: '14px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: textColor, marginBottom: '8px' }}>
            Selecione uma aula para assistir
          </h3>
          <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto', color: subTextColor }}>
            Escolha uma das aulas na linha do tempo ao lado para reproduzir o conteúdo.
          </p>
        </div>
        {rightSidebar && <div>{rightSidebar}</div>}
      </div>
    );
  }

  const activeVideo = videos.find((v) => v.language === selectedLang) || videos[0] || null;
  const currentVideoUrl = activeVideo?.video_url || lesson.video_url;
  const currentVideoType = activeVideo?.video_type || lesson.video_type;
  const currentTitle = activeVideo?.title || lesson.title;
  const currentDescription = activeVideo?.description || lesson.description;

  const isComingSoon = isLessonComingSoon(lesson);
  const embedUrl = !isComingSoon ? getEmbedUrl(currentVideoUrl, currentVideoType) : null;
  const isDirectVideo = !isComingSoon && (
    currentVideoType === 'upload' ||
    (currentVideoUrl && currentVideoUrl.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i)) ||
    (currentVideoUrl && currentVideoUrl.startsWith('/api/v1/courses/videos/'))
  );

  return (
    <div data-testid="lesson-player-container" style={{ width: '100%' }}>
      {/* Topo: Seletor de Idiomas + Player de Vídeo Widescreen */}
      <div style={{ maxWidth: '1080px', margin: '0 auto 36px auto', borderRadius: '14px', overflow: 'hidden', border: `1px solid ${borderColor}`, boxShadow: '0 22px 45px -12px rgba(0, 0, 0, 0.65)', backgroundColor: '#090d16' }}>
        {!isComingSoon && videos.length > 1 && (
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', backgroundColor: '#0f172a', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', flexWrap: 'wrap', gap: '8px' }}
            data-testid="lesson-language-selector"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Globe size={15} color="#94a3b8" />
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0' }}>Idioma da Aula:</span>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {videos.map((v) => {
                const flag = LANG_FLAGS[v.language] || '🌐';
                const isActive = v.language === selectedLang;
                return (
                  <button
                    key={v.language}
                    type="button"
                    onClick={() => setSelectedLang(v.language)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer', backgroundColor: isActive ? '#eab308' : '#1e293b', color: isActive ? '#0f172a' : '#94a3b8', transition: 'all 0.15s ease' }}
                    data-testid={`player-lang-btn-${v.language}`}
                  >
                    <span>{flag}</span>
                    <span>{v.language_label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ position: 'relative', width: '100%', backgroundColor: '#05080f', aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isComingSoon ? (
            <div
              data-testid="lesson-coming-soon-screen"
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: lesson.thumbnail_url
                  ? `linear-gradient(rgba(5, 8, 15, 0.82), rgba(5, 8, 15, 0.94)), url(${lesson.thumbnail_url})`
                  : 'radial-gradient(circle at 50% 40%, rgba(234, 179, 8, 0.14), #05080f 85%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                textAlign: 'center',
                padding: '32px 24px',
                color: '#f8fafc'
              }}
            >
              <div style={{ width: '62px', height: '62px', borderRadius: '50%', backgroundColor: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 0 24px rgba(234, 179, 8, 0.25)' }}>
                <Clock size={30} color="#eab308" />
              </div>

              <div
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(234, 179, 8, 0.18)', border: '1px solid rgba(234, 179, 8, 0.45)', color: '#facc15', padding: '4px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}
                data-testid="coming-soon-tag"
              >
                <Sparkles size={12} />
                <span>Em Breve • Aula em Produção</span>
              </div>

              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '0 0 8px 0', maxWidth: '580px' }}>
                {currentTitle}
              </h3>

              <p style={{ fontSize: '13.5px', color: '#94a3b8', maxWidth: '480px', margin: '0 0 16px 0', lineHeight: 1.6 }}>
                Esta aula já foi criada na estrutura do curso e em breve estará funcionando e liberada para você assistir!
              </p>

              {isManager && onEditLesson && (
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => onEditLesson(lesson)}
                  data-testid="coming-soon-edit-btn"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontSize: '12.5px' }}
                >
                  <Video size={14} />
                  <span>Editar Aula / Subir Vídeo</span>
                </button>
              )}
            </div>
          ) : isDirectVideo && currentVideoUrl ? (
            <CustomVideoPlayer
              src={currentVideoUrl}
              poster={lesson.thumbnail_url || undefined}
              title={currentTitle}
              lessonDuration={lesson.duration}
            />
          ) : embedUrl ? (
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={lesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : currentVideoUrl ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
              <Video size={48} style={{ margin: '0 auto 12px', opacity: 0.8 }} />
              <p style={{ fontSize: '14px', marginBottom: '12px' }}>Link de vídeo externo fornecido:</p>
              <a
                href={currentVideoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="primary-btn"
                style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '13px' }}
              >
                <span>Abrir Vídeo</span>
                <ExternalLink size={14} />
              </a>
            </div>
          ) : null}
        </div>
      </div>

      {/* Área Inferior em 2 Colunas: Conteúdo Editorial à Esquerda + Timeline de Módulos/Aulas à Direita */}
      <div
        className="classroom-grid"
        style={{ maxWidth: '1080px', margin: '0 auto', display: 'grid', gridTemplateColumns: rightSidebar ? 'minmax(0, 1fr) 300px' : '1fr', gap: '52px', alignItems: 'start' }}
      >
        {/* Coluna Esquerda: Título, Breadcrumb, Texto da Aula, Ações, Card de Próxima Aula e Abas */}
        <div>
          {/* Cabeçalho da Aula + Duração */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '26px', fontWeight: 700, color: textColor, margin: 0, letterSpacing: '-0.01em' }} data-testid="active-lesson-title">
                  {currentTitle}
                </h2>
                {isComingSoon && (
                  <span
                    data-testid="active-lesson-coming-soon-badge"
                    style={{ fontSize: '11px', fontWeight: 700, backgroundColor: 'rgba(234, 179, 8, 0.16)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.4)', padding: '3px 10px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <Clock size={12} />
                    <span>Em Breve</span>
                  </span>
                )}
              </div>

              {/* Breadcrumb estilo referência: Início > Curso > Módulo / Editar esse conteúdo */}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', fontSize: '12.5px', color: mutedColor }}>
                <span onClick={onCloseModule} style={{ cursor: onCloseModule ? 'pointer' : 'default', color: subTextColor }}>
                  Início
                </span>
                <ChevronRight size={13} />
                <span onClick={onCloseModule} style={{ cursor: onCloseModule ? 'pointer' : 'default', color: subTextColor }}>
                  {courseTitle || moduleTitle || 'Curso'}
                </span>
                {moduleTitle && (
                  <>
                    <ChevronRight size={13} />
                    <span style={{ color: subTextColor }}>{moduleTitle}</span>
                  </>
                )}
                {isManager && onEditLesson && (
                  <>
                    <ChevronRight size={13} />
                    <button
                      type="button"
                      onClick={() => onEditLesson(lesson)}
                      style={{ background: 'transparent', border: 'none', padding: 0, fontSize: '12.5px', color: '#eab308', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Editar esse conteúdo
                    </button>
                  </>
                )}
              </div>
            </div>

            {lesson.duration && (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: subTextColor, fontSize: '12.5px', backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)', border: `1px solid ${borderColor}`, padding: '5px 12px', borderRadius: '999px' }}
                data-testid="lesson-duration-badge"
              >
                <Clock size={14} />
                <span>{formatLessonDuration(lesson.duration)}</span>
              </div>
            )}
          </div>

          {isComingSoon && (
            <div
              data-testid="lesson-coming-soon-notice"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', padding: '10px 14px', borderRadius: '8px', backgroundColor: isLightBg ? '#fefce8' : 'rgba(234, 179, 8, 0.1)', border: isLightBg ? '1px solid #fef08a' : '1px solid rgba(234, 179, 8, 0.25)', color: isLightBg ? '#854d0e' : '#facc15', fontSize: '12.5px' }}
            >
              <Clock size={16} style={{ flexShrink: 0 }} />
              <span><strong>Aula em Breve:</strong> Esta aula já foi estruturada e o vídeo será liberado em breve.</span>
            </div>
          )}

          {/* Abas da Aula: Visão Geral vs Materiais Complementares vs Minhas Anotações vs Comentários */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px', borderBottom: `1px solid ${borderColor}`, paddingBottom: '0', overflowX: 'auto' }}>
            {[
              { id: 'overview', label: 'Visão Geral', icon: FileText, testId: 'tab-lesson-overview' },
              { id: 'attachments', label: 'Materiais Complementares', icon: Paperclip, testId: 'tab-lesson-attachments', count: lesson.attachments?.length || 0 },
              { id: 'notes', label: 'Minhas Anotações', icon: BookOpen, testId: 'tab-lesson-notes' },
              { id: 'comments', label: 'Comentários', icon: MessageSquare, testId: 'tab-lesson-comments' }
            ].map((tab) => {
              const Icon = tab.icon;
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 600, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: isTabActive ? '#eab308' : subTextColor, borderBottom: isTabActive ? '2px solid #eab308' : '2px solid transparent', whiteSpace: 'nowrap' }}
                  data-testid={tab.testId}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span style={{ fontSize: '11px', backgroundColor: isTabActive ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255, 255, 255, 0.08)', color: isTabActive ? '#eab308' : subTextColor, padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Conteúdo da Aba Ativa */}
          {activeTab === 'overview' && (
            <div style={{ marginTop: '22px' }}>
              {currentDescription ? (
                <div style={{ fontSize: '14.5px', color: subTextColor, lineHeight: '1.75', whiteSpace: 'pre-wrap' }} data-testid="active-lesson-description">
                  {currentDescription}
                </div>
              ) : (
                <p style={{ fontSize: '13.5px', color: mutedColor, fontStyle: 'italic', margin: 0 }}>
                  Esta aula não possui descrição textual adicional.
                </p>
              )}
            </div>
          )}

          {activeTab === 'attachments' && (
            <div style={{ marginTop: '20px' }}>
              <LessonAttachmentsList attachments={lesson.attachments || []} isLightBg={isLightBg} />
            </div>
          )}

          {activeTab === 'notes' && (
            <LessonNotes courseId={courseId} lessonId={lesson.id} currentUser={currentUser} isLightBg={isLightBg} />
          )}

          {activeTab === 'comments' && (
            <LessonComments courseId={courseId} moduleId={moduleId || lesson.module_id} lessonId={lesson.id} currentUser={currentUser} isLightBg={isLightBg} />
          )}

          {/* Barra de Ações da Aula (Avaliação, Relatar Problema, Marcar como visto ✓) */}
          <LessonActionToolbar
            courseId={courseId}
            lessonId={lesson.id}
            isCompleted={isCompleted}
            onToggleComplete={onToggleComplete}
            currentUser={currentUser}
          />

          {/* Navegação Anterior */}
          {prevLesson && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={() => onSelectLesson(prevLesson)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', fontSize: '12.5px', backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)', color: textColor, borderColor }}
                data-testid="prev-lesson-btn"
              >
                <ChevronLeft size={15} />
                <span>Aula Anterior</span>
              </button>
            </div>
          )}
        </div>

        {/* Coluna Direita: Timeline de Progresso, Módulos e Aulas */}
        {rightSidebar && <div>{rightSidebar}</div>}
      </div>
    </div>
  );
}

