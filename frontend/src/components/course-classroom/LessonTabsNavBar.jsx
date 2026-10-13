import React from 'react';
import {
  FileText,
  Sparkles,
  Paperclip,
  BookOpen,
  MessageSquare
} from 'lucide-react';

const TABS = [
  {
    id: 'overview',
    label: 'Visão Geral',
    shortLabel: 'Visão Geral',
    icon: FileText,
    testId: 'tab-lesson-overview'
  },
  {
    id: 'transcription',
    label: 'Transcrição & Resumo IA',
    shortLabel: 'Transcrição IA',
    icon: Sparkles,
    testId: 'tab-lesson-transcription'
  },
  {
    id: 'attachments',
    label: 'Materiais Complementares',
    shortLabel: 'Materiais',
    icon: Paperclip,
    testId: 'tab-lesson-attachments',
    hasCount: true
  },
  {
    id: 'notes',
    label: 'Minhas Anotações',
    shortLabel: 'Anotações',
    icon: BookOpen,
    testId: 'tab-lesson-notes'
  },
  {
    id: 'comments',
    label: 'Comentários',
    shortLabel: 'Comentários',
    icon: MessageSquare,
    testId: 'tab-lesson-comments'
  }
];

export default function LessonTabsNavBar({
  activeTab,
  onTabChange,
  attachmentsCount = 0,
  borderColor = 'rgba(255, 255, 255, 0.08)',
  subTextColor = '#94a3b8'
}) {
  return (
    <div
      className="lesson-tabs-nav-bar"
      data-testid="lesson-tabs-nav-bar"
      role="tablist"
      style={{
        display: 'flex',
        gap: '8px',
        marginTop: '24px',
        borderBottom: `1px solid ${borderColor}`,
        paddingBottom: '2px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-x'
      }}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isTabActive = activeTab === tab.id;
        const count = tab.hasCount ? attachmentsCount : 0;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isTabActive}
            onClick={() => onTabChange(tab.id)}
            className={`lesson-tab-btn ${isTabActive ? 'active' : ''}`}
            data-testid={tab.testId}
            style={{
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
              color: isTabActive ? '#eab308' : subTextColor,
              borderBottom: isTabActive ? '2px solid #eab308' : '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'color 0.15s ease, border-color 0.15s ease'
            }}
          >
            <Icon size={14} style={{ flexShrink: 0 }} />
            <span className="tab-label-full">{tab.label}</span>
            <span className="tab-label-mobile">{tab.shortLabel}</span>
            {count > 0 && (
              <span
                data-testid={`badge-count-${tab.id}`}
                style={{
                  fontSize: '11px',
                  backgroundColor: isTabActive
                    ? 'rgba(234, 179, 8, 0.2)'
                    : 'rgba(255, 255, 255, 0.08)',
                  color: isTabActive ? '#eab308' : subTextColor,
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  marginLeft: '2px'
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
