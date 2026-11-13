import React, { useState, useEffect } from 'react';
import {
  PlayCircle, Clock, ChevronLeft, ChevronRight, Video, AlertCircle,
  ExternalLink, FileText, MessageSquare, Globe, Paperclip, BookOpen, Sparkles, Layers, Plus
} from 'lucide-react';
import LessonComments from './LessonComments';
import LessonAttachmentsList from './LessonAttachmentsList';
import LessonActionToolbar from './LessonActionToolbar';
import LessonNotes from './LessonNotes';
import LessonAiTranscriptionTab from './LessonAiTranscriptionTab';
import TutorChatTab from '../tutor-ia/TutorChatTab';
import LessonOverviewTab from './LessonOverviewTab';
import LessonTabsNavBar from './LessonTabsNavBar';
import { useTutorVisibility } from '../../hooks/useTutorVisibility';
import LessonNavigationBar from './LessonNavigationBar';
import CustomVideoPlayer from './CustomVideoPlayer';
import LessonComingSoonScreen from './LessonComingSoonScreen';
import LessonEmptyState from './LessonEmptyState';
import LessonPlayerHeader from './LessonPlayerHeader';
import TheaterModeToggleBtn from './TheaterModeToggleBtn';
import SuperAdminVideoOptimizerBadge from './SuperAdminVideoOptimizerBadge';
import LessonPartsBar from './LessonPartsBar';
import LessonSwitchingModal from './LessonSwitchingModal';
import { useLessonSwitchLoader } from './useLessonSwitchLoader';
import { formatLessonDuration, isLessonComingSoon } from './lessonUtils';

const LANG_FLAGS = {
  pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹', other: '🌐'
};

function getEmbedUrl(videoUrl) {
  if (!videoUrl) return null;
  const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export default function LessonPlayer({
  lesson,
  hasLessons = true,
  onOpenCreateLesson,
  courseTitle,
  moduleTitle,
  courseId,
  moduleId,
  watermarkEnabled = true,
  currentUser,
  prevLesson,
  nextLesson,
  onSelectLesson,
  isCompleted = false,
  onToggleComplete,
  isLightBg = false,
  onCloseModule,
  onEditLesson,
  onLessonUpdated,
  rightSidebar,
  initialTab = 'overview',
  targetCommentId = null,
  isTutorVisible: propIsTutorVisible
}) {
  const { isTutorVisible: hookIsTutorVisible } = useTutorVisibility(currentUser);
  const isTutorVisible = propIsTutorVisible !== undefined ? propIsTutorVisible : hookIsTutorVisible;
  const initialActive = initialTab || (targetCommentId ? 'comments' : 'overview');
  const [activeTab, setActiveTab] = useState(initialActive);
  const [visitedTabs, setVisitedTabs] = useState(['overview', ...(initialActive === 'comments' ? ['comments'] : [])]);
  const [autoPlayActive, setAutoPlayActive] = useState(false);
  const {
    notesCount,
    commentsCount,
    isTranscriptionCompleted,
    isSwitchingLesson
  } = useLessonSwitchLoader({ courseId, moduleId, lesson });

  useEffect(() => {
    if (!isTutorVisible && activeTab === 'tutor') setActiveTab('overview');
  }, [isTutorVisible, activeTab]);
  const isManager = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
  const [isTheaterMode, setIsTheaterMode] = useState(() => {
    try {
      return localStorage.getItem('area_de_membros_theater_mode') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleTheaterMode = () => {
    setIsTheaterMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('area_de_membros_theater_mode', String(next));
      } catch {}
      return next;
    });
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setVisitedTabs((prev) => (prev.includes(tabId) ? prev : [...prev, tabId]));
  };

  const handleAttachmentAdded = (newAtt) => {
    const list = Array.isArray(lesson?.attachments) ? lesson.attachments : [];
    if (onLessonUpdated) onLessonUpdated({ ...lesson, attachments: [...list, newAtt] });
  };
  const handleAttachmentDeleted = (delId) => {
    const list = Array.isArray(lesson?.attachments) ? lesson.attachments : [];
    if (onLessonUpdated) onLessonUpdated({ ...lesson, attachments: list.filter((a) => a.id !== delId) });
  };
  const handleAttachmentUpdated = (upAtt) => {
    const list = Array.isArray(lesson?.attachments) ? lesson.attachments : [];
    if (onLessonUpdated) onLessonUpdated({ ...lesson, attachments: list.map((a) => (a.id === upAtt.id ? upAtt : a)) });
  };

  useEffect(() => {
    const target = initialTab || (targetCommentId ? 'comments' : 'overview');
    setActiveTab(target);
    setVisitedTabs((prev) => (prev.includes(target) ? prev : [...prev, target]));
  }, [lesson?.id, initialTab, targetCommentId]);

  const videos = (lesson?.videos && lesson.videos.length > 0)
    ? lesson.videos
    : (lesson?.video_url
      ? [{ language: 'pt', language_label: 'Português', video_url: lesson.video_url, video_type: lesson.video_type || 'upload' }]
      : []);

  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [selectedLang, setSelectedLang] = useState('pt');

  useEffect(() => {
    setActiveVideoIndex(0);
  }, [lesson?.id]);

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
      <LessonEmptyState
        hasLessons={hasLessons}
        isManager={isManager}
        onOpenCreateLesson={onOpenCreateLesson}
        isLightBg={isLightBg}
        textColor={textColor}
        subTextColor={subTextColor}
        borderColor={borderColor}
        rightSidebar={rightSidebar}
      />
    );
  }

  const uniqueLanguages = [];
  const seenLangs = new Set();
  for (const v of videos) {
    const code = v.language || 'pt';
    if (!seenLangs.has(code)) {
      seenLangs.add(code);
      uniqueLanguages.push({ code, label: v.language_label || code });
    }
  }
  const currentLangVideos = videos.filter((v) => (v.language || 'pt') === selectedLang);
  const safePartIdx = activeVideoIndex < currentLangVideos.length ? activeVideoIndex : 0;
  const activeVideo = currentLangVideos[safePartIdx] || currentLangVideos[0] || videos[0] || null;
  const currentVideoUrl = activeVideo?.video_url || lesson.video_url;
  const currentVideoType = activeVideo?.video_type || lesson.video_type;
  const currentTitle = (videos.length > 1 && activeVideo?.title) ? activeVideo.title : (lesson.title || activeVideo?.title);
  const currentDescription = safePartIdx > 0
    ? (activeVideo?.description || '')
    : ((videos.length > 1 && activeVideo?.description) ? activeVideo.description : (lesson.description || activeVideo?.description));
  const isCurrentPartUntranscribed = Boolean(
    currentLangVideos.length > 1 &&
    safePartIdx > 0 &&
    activeVideo?.id &&
    activeVideo?.is_transcribed === false
  );

  const isComingSoon = isLessonComingSoon(lesson);
  const embedUrl = !isComingSoon ? getEmbedUrl(currentVideoUrl, currentVideoType) : null;
  const isDirectVideo = !isComingSoon && (
    currentVideoType === 'upload' ||
    (currentVideoUrl && currentVideoUrl.match(/\.(mp4|webm|mov|mkv)(\?.*)?$/i)) ||
    (currentVideoUrl && currentVideoUrl.startsWith('/api/v1/courses/videos/'))
  );

  return (
    <div data-testid="lesson-player-container" style={{ width: '100%' }}>
      <LessonSwitchingModal isOpen={isSwitchingLesson} lessonTitle={currentTitle} />
      {/* Topo: Seletor de Idiomas + Player de Vídeo Widescreen (Modo Normal 1080px vs Modo Teatro 100%) */}
      <div
        data-testid="lesson-player-theater-wrapper"
        style={{
          maxWidth: isTheaterMode ? '100%' : '1080px',
          margin: isTheaterMode ? '0 auto 28px auto' : '0 auto 36px auto',
          borderRadius: isTheaterMode ? '8px' : '14px',
          overflow: 'hidden',
          border: `1px solid ${borderColor}`,
          boxShadow: isTheaterMode ? '0 30px 60px -10px rgba(0, 0, 0, 0.85)' : '0 22px 45px -12px rgba(0, 0, 0, 0.65)',
          backgroundColor: '#090d16',
          transition: 'max-width 0.3s ease, margin 0.3s ease, border-radius 0.3s ease'
        }}
      >
        <div style={{ position: 'relative', width: '100%', backgroundColor: '#05080f', aspectRatio: '16 / 9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isComingSoon ? (
            <LessonComingSoonScreen
              lesson={lesson}
              currentTitle={currentTitle}
              isManager={isManager}
              onEditLesson={onEditLesson}
            />
          ) : isDirectVideo && currentVideoUrl ? (
            <CustomVideoPlayer
              src={currentVideoUrl}
              poster={lesson.thumbnail_url || undefined}
              title={currentTitle}
              lessonDuration={lesson.duration}
              isTheaterMode={isTheaterMode}
              onToggleTheaterMode={handleToggleTheaterMode}
              userPlaybackRate={currentUser?.playback_rate}
              watermarkEnabled={watermarkEnabled}
              autoplayEnabled={currentUser?.autoplay_enabled !== false}
              nextLesson={nextLesson}
              autoPlay={autoPlayActive}
              onPlayNextLesson={() => {
                if (nextLesson && onSelectLesson) {
                  setAutoPlayActive(true);
                  onSelectLesson(nextLesson);
                }
              }}
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

        {!isComingSoon && (currentLangVideos.length > 1 || uniqueLanguages.length > 1) && (
          <LessonPartsBar
            videos={currentLangVideos}
            activeIndex={safePartIdx}
            onSelectPart={(idx) => setActiveVideoIndex(idx)}
            languages={uniqueLanguages}
            selectedLang={selectedLang}
            onSelectLang={(code) => setSelectedLang(code)}
            isLightBg={false}
          />
        )}
      </div>

      {/* Área Inferior em 2 Colunas: Conteúdo Editorial à Esquerda + Timeline de Módulos/Aulas à Direita */}
      <div
        className="classroom-grid classroom-layout-grid"
        style={{
          maxWidth: isTheaterMode ? '100%' : '1080px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: (!isTheaterMode && rightSidebar) ? 'minmax(0, 1fr) 300px' : '1fr',
          gap: isTheaterMode ? '0px' : '52px',
          alignItems: 'start',
          transition: 'all 0.3s ease'
        }}
      >
        {/* Coluna Esquerda: Título, Breadcrumb, Texto da Aula, Ações, Card de Próxima Aula e Abas */}
        <div style={{ minWidth: 0, maxWidth: '100%' }}>
          {/* Cabeçalho da Aula + Duração */}
          <LessonPlayerHeader
            currentTitle={currentTitle}
            isComingSoon={isComingSoon}
            onCloseModule={onCloseModule}
            courseTitle={courseTitle}
            moduleTitle={moduleTitle}
            isManager={isManager}
            onEditLesson={onEditLesson}
            lesson={lesson}
            isTheaterMode={isTheaterMode}
            handleToggleTheaterMode={handleToggleTheaterMode}
            currentVideoUrl={currentVideoUrl}
            currentUser={currentUser}
            isLightBg={isLightBg}
            borderColor={borderColor}
            subTextColor={subTextColor}
            textColor={textColor}
            mutedColor={mutedColor}
          />

          {isComingSoon && (
            <div
              data-testid="lesson-coming-soon-notice"
              style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', padding: '10px 14px', borderRadius: '8px', backgroundColor: isLightBg ? '#fefce8' : 'rgba(234, 179, 8, 0.1)', border: isLightBg ? '1px solid #fef08a' : '1px solid rgba(234, 179, 8, 0.25)', color: isLightBg ? '#854d0e' : '#facc15', fontSize: '12.5px' }}
            >
              <Clock size={16} style={{ flexShrink: 0 }} />
              <span><strong>Aula em Breve:</strong> Esta aula já foi estruturada e o vídeo será liberado em breve.</span>
            </div>
          )}

          {/* Abas da Aula: Visão Geral vs Transcrição & Resumo IA vs Materiais Complementares vs Minhas Anotações vs Comentários */}
          <LessonTabsNavBar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            attachmentsCount={lesson.attachments?.length || 0}
            notesCount={notesCount}
            commentsCount={commentsCount}
            borderColor={borderColor}
            subTextColor={subTextColor}
            tutorVisible={isTranscriptionCompleted && isTutorVisible}
          />

          {/* Conteúdo das Abas: Altura mínima estável e preservação de componentes montados para eliminar layout shift / tela piscando */}
          <div style={{ minHeight: '280px', marginTop: '16px' }} data-testid="lesson-tabs-content-container">
            <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
              {visitedTabs.includes('overview') && (
                <LessonOverviewTab
                  lesson={lesson}
                  courseId={courseId}
                  moduleId={moduleId || lesson.module_id}
                  currentDescription={currentDescription}
                  isManager={isManager}
                  textColor={textColor}
                  subTextColor={subTextColor}
                  mutedColor={mutedColor}
                  onLessonUpdated={onLessonUpdated}
                  onSwitchToAttachments={() => handleTabChange('attachments')}
                />
              )}
            </div>
            <div style={{ display: activeTab === 'transcription' ? 'block' : 'none' }}>
              {visitedTabs.includes('transcription') && (
                <LessonAiTranscriptionTab
                  courseId={courseId}
                  moduleId={moduleId || lesson.module_id}
                  lesson={lesson}
                  currentUser={currentUser}
                  isLightBg={isLightBg}
                  selectedLang={selectedLang}
                  activePartNumber={safePartIdx + 1}
                  isCurrentPartUntranscribed={isCurrentPartUntranscribed}
                />
              )}
            </div>
            <div style={{ display: activeTab === 'tutor' && isTranscriptionCompleted && isTutorVisible ? 'block' : 'none' }}>
              {visitedTabs.includes('tutor') && isTranscriptionCompleted && isTutorVisible && (
                <TutorChatTab courseId={courseId} lessonId={lesson.id} currentUser={currentUser} isLightBg={isLightBg} onSelectLesson={onSelectLesson} />
              )}
            </div>
            <div style={{ display: activeTab === 'attachments' ? 'block' : 'none' }}>
              {visitedTabs.includes('attachments') && (
                <div style={{ marginTop: '20px' }}>
                  <LessonAttachmentsList
                    attachments={lesson.attachments || []}
                    isLightBg={isLightBg}
                    courseId={courseId}
                    moduleId={moduleId || lesson.module_id}
                    lessonId={lesson.id}
                    isManager={isManager}
                    onAttachmentAdded={handleAttachmentAdded}
                    onAttachmentDeleted={handleAttachmentDeleted}
                    onAttachmentUpdated={handleAttachmentUpdated}
                  />
                </div>
              )}
            </div>
            <div style={{ display: activeTab === 'notes' ? 'block' : 'none' }}>
              {visitedTabs.includes('notes') && (
                <LessonNotes courseId={courseId} lessonId={lesson.id} currentUser={currentUser} isLightBg={isLightBg} />
              )}
            </div>
            <div style={{ display: activeTab === 'comments' ? 'block' : 'none' }}>
              {visitedTabs.includes('comments') && (
                <LessonComments
                  courseId={courseId}
                  moduleId={moduleId || lesson.module_id}
                  lessonId={lesson.id}
                  currentUser={currentUser}
                  isLightBg={isLightBg}
                  targetCommentId={targetCommentId}
                />
              )}
            </div>
          </div>

          {/* Barra de Ações da Aula (Avaliação, Relatar Problema, Marcar como visto ✓) */}
          <LessonActionToolbar
            courseId={courseId}
            lessonId={lesson.id}
            isCompleted={isCompleted}
            onToggleComplete={onToggleComplete}
            currentUser={currentUser}
          />

          {/* Navegação entre Aulas (Aula Anterior e Próxima Aula) */}
          <LessonNavigationBar
            prevLesson={prevLesson}
            nextLesson={nextLesson}
            onSelectLesson={onSelectLesson}
            isLightBg={isLightBg}
            textColor={textColor}
            borderColor={borderColor}
          />
        </div>

        {/* Coluna Direita: Timeline de Progresso, Módulos e Aulas */}
        {(!isTheaterMode && rightSidebar) && <div style={{ minWidth: 0, maxWidth: '100%' }}>{rightSidebar}</div>}
      </div>
    </div>
  );
}

