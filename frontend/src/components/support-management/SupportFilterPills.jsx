import React from 'react';
import { Sparkles, Flame, Clock, CheckCircle2, User, Pin } from 'lucide-react';

export const PILL_FILTERS = [
  { id: 'all', label: 'Todas as Dúvidas', icon: Sparkles },
  { id: 'pinned', label: 'Fixadas por Mim', icon: Pin },
  { id: 'popular', label: 'Mais Populares', icon: Flame },
  { id: 'unanswered', label: 'Aguardando Resposta', icon: Clock },
  { id: 'resolved', label: 'Resolvidas', icon: CheckCircle2 },
  { id: 'my_topics', label: 'Minhas Dúvidas', icon: User },
];

export default function SupportFilterPills({ activeFilter, onSelectFilter, isLightBg }) {
  const activeBg = isLightBg ? '#0284c7' : '#0284c7';
  const activeColor = '#ffffff';
  const inactiveBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)';
  const inactiveBorder = isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)';
  const inactiveColor = isLightBg ? '#475569' : '#94a3b8';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        scrollbarWidth: 'none',
      }}
      data-testid="support-filter-pills"
    >
      {PILL_FILTERS.map((pill) => {
        const isActive = activeFilter === pill.id;
        const Icon = pill.icon;
        return (
          <button
            key={pill.id}
            type="button"
            onClick={() => onSelectFilter(pill.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '999px',
              fontSize: '0.82rem',
              fontWeight: isActive ? 600 : 500,
              backgroundColor: isActive ? activeBg : inactiveBg,
              color: isActive ? activeColor : inactiveColor,
              border: isActive ? '1px solid transparent' : inactiveBorder,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              boxShadow: isActive ? '0 2px 10px rgba(2, 132, 199, 0.35)' : 'none',
            }}
            data-testid={`support-pill-${pill.id}`}
          >
            <Icon size={14} />
            <span>{pill.label}</span>
          </button>
        );
      })}
    </div>
  );
}
