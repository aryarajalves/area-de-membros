import React from 'react';
import { Clock, ChevronRight } from 'lucide-react';
import TheaterModeToggleBtn from './TheaterModeToggleBtn';
import SuperAdminVideoOptimizerBadge from './SuperAdminVideoOptimizerBadge';
import { formatLessonDuration } from './lessonUtils';

export default function LessonPlayerHeader({
  currentTitle,
  isComingSoon,
  onCloseModule,
  courseTitle,
  moduleTitle,
  isManager,
  onEditLesson,
  lesson,
  isTheaterMode,
  handleToggleTheaterMode,
  currentVideoUrl,
  currentUser,
  isLightBg,
  borderColor,
  subTextColor,
  textColor,
  mutedColor
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0, maxWidth: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <h2
            style={{ fontSize: '26px', fontWeight: 700, color: textColor, margin: 0, letterSpacing: '-0.01em', wordBreak: 'break-word', overflowWrap: 'break-word' }}
            data-testid="active-lesson-title"
          >
            {currentTitle}
          </h2>
          {isComingSoon && (
            <span
              data-testid="active-lesson-coming-soon-badge"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: 'rgba(234, 179, 8, 0.16)',
                color: '#eab308',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                padding: '3px 10px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <TheaterModeToggleBtn
          isTheaterMode={isTheaterMode}
          onToggleTheaterMode={handleToggleTheaterMode}
          isLightBg={isLightBg}
        />
        <SuperAdminVideoOptimizerBadge
          videoUrl={currentVideoUrl}
          currentUser={currentUser}
          isLightBg={isLightBg}
        />
        {lesson?.duration && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: subTextColor,
              fontSize: '12.5px',
              backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${borderColor}`,
              padding: '5px 12px',
              borderRadius: '999px'
            }}
            data-testid="lesson-duration-badge"
          >
            <Clock size={13} />
            <span>{formatLessonDuration(lesson.duration)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
