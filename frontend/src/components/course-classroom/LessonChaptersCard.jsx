import React, { useState } from 'react';
import { Bookmark, Clock, Pencil } from 'lucide-react';
import EditLessonChaptersModal from './EditLessonChaptersModal';

export default function LessonChaptersCard({
  chapters = [],
  borderColor,
  cardBg,
  textColor,
  subTextColor,
  isLightBg,
  isManager = false,
  courseId,
  moduleId,
  lessonId,
  onUpdateChapters
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!chapters || chapters.length === 0) return null;

  const handleSeek = (seconds) => {
    window.dispatchEvent(new CustomEvent('video-seek-to', { detail: { seconds } }));
    const videoContainer = document.querySelector('[data-testid="lesson-player-container"]');
    if (videoContainer) {
      videoContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <div
      data-testid="ai-chapters-card"
      style={{
        padding: '16px 18px',
        borderRadius: '10px',
        border: `1px solid ${borderColor}`,
        backgroundColor: cardBg
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <Bookmark size={18} color="#3b82f6" />
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: textColor, margin: 0 }}>
          Capítulos da Aula (Minutagem)
        </h4>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '999px',
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            color: '#3b82f6',
            marginLeft: 'auto'
          }}
        >
          {chapters.length} {chapters.length === 1 ? 'capítulo' : 'capítulos'}
        </span>

        {isManager && (
          <button
            type="button"
            data-testid="btn-open-edit-chapters-modal"
            onClick={() => setIsEditModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              border: `1px solid ${borderColor}`,
              color: textColor,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Editar informações e minutagens dos capítulos"
          >
            <Pencil size={13} color="#3b82f6" />
            <span>Editar Capítulos</span>
          </button>
        )}
      </div>

      <div
        data-testid="ai-chapters-list"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {chapters.map((ch, idx) => (
          <div
            key={idx}
            data-testid={`ai-chapter-item-${idx}`}
            onClick={() => handleSeek(ch.seconds || 0)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSeek(ch.seconds || 0);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${borderColor}`,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <button
              type="button"
              data-testid={`btn-seek-chapter-${idx}`}
              onClick={(e) => {
                e.stopPropagation();
                handleSeek(ch.seconds || 0);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                fontVariantNumeric: 'tabular-nums',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
              }}
            >
              <Clock size={12} />
              <span>{ch.time || '00:00'}</span>
            </button>

            <span
              style={{
                fontSize: '13.5px',
                fontWeight: 600,
                color: textColor,
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {ch.title}
            </span>

            {isManager && (
              <button
                type="button"
                data-testid={`btn-edit-chapter-row-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditModalOpen(true);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: subTextColor,
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0.7
                }}
                title="Editar este capítulo"
              >
                <Pencil size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {isManager && (
        <EditLessonChaptersModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          chapters={chapters}
          courseId={courseId}
          moduleId={moduleId}
          lessonId={lessonId}
          isLightBg={isLightBg}
          onSaveSuccess={(updated) => {
            if (onUpdateChapters) onUpdateChapters(updated);
          }}
        />
      )}
    </div>
  );
}
