import React from 'react';
import { FileText, Image, Globe, Sparkles, Megaphone } from 'lucide-react';

export const COURSE_TABS = [
  { id: 'info', label: 'Dados Gerais', icon: FileText, testId: 'course-tab-info' },
  { id: 'media', label: 'Capas & Mídia', icon: Image, testId: 'course-tab-media' },
  { id: 'sales_access', label: 'Vendas & Acesso', icon: Globe, testId: 'course-tab-sales' },
  { id: 'upsell', label: 'Anúncios & Upsell', icon: Megaphone, testId: 'course-tab-upsell' },
  { id: 'ai', label: 'IA & Assistente', icon: Sparkles, testId: 'course-tab-ai' }
];

export default function CourseModalTabs({
  activeTab,
  onTabChange,
  isLightBg = false
}) {
  const activeColor = '#3b82f6';
  const inactiveColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';

  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: '6px',
        borderBottom: `1px solid ${borderColor}`,
        marginBottom: '18px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}
      data-testid="course-modal-tabs"
    >
      {COURSE_TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            data-testid={tab.testId}
            style={{
              padding: '8px 12px',
              fontSize: '12.5px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? activeColor : inactiveColor,
              borderBottom: isActive ? `2px solid ${activeColor}` : '2px solid transparent',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
