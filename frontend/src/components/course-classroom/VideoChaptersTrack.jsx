import React from 'react';
import { formatSecondsToTimer } from './lessonUtils';

export default function VideoChaptersTrack({
  chapters = [],
  effectiveDuration = 0,
  currentTime = 0,
  onSeekToSeconds,
  hoveredChapter,
  setHoveredChapter
}) {
  if (!Array.isArray(chapters) || chapters.length === 0 || effectiveDuration <= 0) {
    return null;
  }

  // Ordena os capítulos por tempo
  const sortedChapters = [...chapters].sort((a, b) => (a.seconds || 0) - (b.seconds || 0));

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        gap: '2.5px', // Espaço característico entre capítulos estilo YouTube
        pointerEvents: 'none',
        zIndex: 3
      }}
      data-testid="video-chapters-track"
    >
      {sortedChapters.map((chapter, idx) => {
        const nextChapter = sortedChapters[idx + 1];
        const startSec = Math.max(0, chapter.seconds || 0);
        const endSec = nextChapter ? Math.min(effectiveDuration, nextChapter.seconds || effectiveDuration) : effectiveDuration;
        const segmentDuration = Math.max(0.1, endSec - startSec);
        const segmentWidthPct = (segmentDuration / effectiveDuration) * 100;

        // Progresso dentro deste capítulo
        let chapterFilledPct = 0;
        if (currentTime >= endSec) {
          chapterFilledPct = 100;
        } else if (currentTime > startSec) {
          chapterFilledPct = ((currentTime - startSec) / segmentDuration) * 100;
        }

        const isCurrentActive = currentTime >= startSec && currentTime < endSec;
        const isHovered = hoveredChapter?.idx === idx;

        return (
          <div
            key={idx}
            onMouseEnter={() => setHoveredChapter && setHoveredChapter({ ...chapter, idx, startSec, endSec })}
            onMouseLeave={() => setHoveredChapter && setHoveredChapter(null)}
            onClick={(e) => {
              e.stopPropagation();
              if (onSeekToSeconds) {
                onSeekToSeconds(startSec);
              }
            }}
            style={{
              position: 'relative',
              flex: `${segmentWidthPct} 0 0%`,
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.16)',
              borderRadius: idx === 0 ? '999px 0 0 999px' : (idx === sortedChapters.length - 1 ? '0 999px 999px 0' : '0'),
              overflow: 'hidden',
              cursor: 'pointer',
              pointerEvents: 'auto',
              transition: 'transform 0.15s ease, background-color 0.15s ease',
              transform: isHovered ? 'scaleY(1.4)' : 'scaleY(1)'
            }}
            title={`${chapter.time || formatSecondsToTimer(startSec)} - ${chapter.title}`}
            data-testid={`video-chapter-segment-${idx}`}
          >
            {/* Preenchimento de progresso neste capítulo */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: `${Math.min(100, Math.max(0, chapterFilledPct))}%`,
                backgroundColor: '#3b82f6',
                borderRadius: 'inherit',
                transition: 'width 0.1s linear'
              }}
              data-testid={`video-chapter-filled-${idx}`}
            />
          </div>
        );
      })}
    </div>
  );
}
