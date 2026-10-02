import React from 'react';
import { MessageSquare, HelpCircle, CheckCircle2, Users, Sparkles } from 'lucide-react';

export default function SupportStatsCards({ stats, isLightBg }) {
  if (!stats) return null;

  const cardBg = isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.65)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';

  const items = [
    {
      label: 'Total de Dúvidas',
      value: stats.total_topics || 0,
      icon: MessageSquare,
      color: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.12)',
      borderColor: 'rgba(56, 189, 248, 0.25)',
    },
    {
      label: 'Aguardando Resposta',
      value: stats.unanswered_count || 0,
      icon: HelpCircle,
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.12)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    {
      label: 'Taxa de Resolução',
      value: `${stats.resolution_rate_pct ?? 100}%`,
      icon: CheckCircle2,
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.12)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
    },
    {
      label: 'Membros Ativos',
      value: stats.active_members_count || 0,
      icon: Users,
      color: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.12)',
      borderColor: 'rgba(168, 85, 247, 0.25)',
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '14px',
        marginBottom: '24px',
      }}
      data-testid="support-stats-cards"
    >
      {items.map((item, idx) => {
        const IconComponent = item.icon;
        return (
          <div
            key={idx}
            style={{
              backgroundColor: cardBg,
              border: cardBorder,
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = item.color;
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              <span style={{ fontSize: '0.78rem', color: subTextColor, fontWeight: 500, display: 'block', marginBottom: '4px' }}>
                {item.label}
              </span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: textColor, letterSpacing: '-0.02em' }}>
                {item.value}
              </span>
            </div>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: item.bgGlow,
                border: `1px solid ${item.borderColor}`,
                color: item.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconComponent size={22} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
