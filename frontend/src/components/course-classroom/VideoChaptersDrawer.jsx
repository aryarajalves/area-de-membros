import React from 'react';
import { Bookmark, Clock, ArrowRight } from 'lucide-react';
import { formatSecondsToTimer } from './lessonUtils';

export default function VideoChaptersDrawer({
  chapters = [],
  currentTime = 0,
  effectiveDuration = 0,
  onSeekToSeconds,
  isOpen = false,
  onClose
}) {
  if (!isOpen || !Array.isArray(chapters) || chapters.length === 0) {
    return null;
  }

  const sortedChapters = [...chapters].sort((a, b) => (a.seconds || 0) - (b.seconds || 0));

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '280px',
        maxWidth: '85%',
        backgroundColor: 'rgba(9, 13, 22, 0.94)',
        backdropFilter: 'blur(10px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
        zIndex: 25,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-8px 0 24px rgba(0, 0, 0, 0.65)',
        transition: 'transform 0.25s ease'
      }}
      data-testid="video-chapters-drawer"
    >
      {/* Cabeçalho */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f8fafc' }}>
          <Bookmark size={16} color="#3b82f6" />
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Capítulos da Aula</h4>
          <span style={{ fontSize: '11px', color: '#94a3b8', backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '2px 6px', borderRadius: '4px' }}>
            {sortedChapters.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}
          title="Fechar Capítulos"
        >
          ×
        </button>
      </div>

      {/* Lista com scroll dos capítulos */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}
      >
        {sortedChapters.map((chapter, idx) => {
          const nextChapter = sortedChapters[idx + 1];
          const startSec = Math.max(0, chapter.seconds || 0);
          const endSec = nextChapter ? Math.min(effectiveDuration, nextChapter.seconds || effectiveDuration) : effectiveDuration;
          const isActive = currentTime >= startSec && currentTime < endSec;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (onSeekToSeconds) {
                  onSeekToSeconds(startSec);
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                marginBottom: '4px',
                borderRadius: '8px',
                border: isActive ? '1px solid #3b82f6' : '1px solid transparent',
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                color: isActive ? '#60a5fa' : '#e2e8f0',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              data-testid={`drawer-chapter-item-${idx}`}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  backgroundColor: isActive ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  padding: '3px 6px',
                  borderRadius: '4px'
                }}
              >
                {chapter.time || formatSecondsToTimer(startSec)}
              </span>

              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: isActive ? 700 : 500,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {chapter.title}
              </span>

              {isActive && <ArrowRight size={14} color="#3b82f6" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
