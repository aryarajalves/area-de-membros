import React from 'react';

export const ENGAGEMENT_TIERS = {
  low: { label: 'Baixo', range: '0-35%', bars: 1, color: '#f97316', bg: 'rgba(249, 115, 22, 0.16)' },
  medium: { label: 'Médio', range: '36-70%', bars: 2, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.16)' },
  high: { label: 'Alto', range: '71-100%', bars: 3, color: '#10b981', bg: 'rgba(16, 185, 129, 0.16)' },
};

export function getEngagementTierFromPercent(percent = 0) {
  if (percent <= 35) return 'low';
  if (percent <= 70) return 'medium';
  return 'high';
}

export function EngagementSignalBars({
  bars = 1,
  color = '#f59e0b',
  inactiveColor = 'rgba(255, 255, 255, 0.12)',
  heights = [12, 20, 28],
  barWidth = 6,
  gap = 4,
}) {
  return (
    <span
      aria-hidden="true"
      style={{ display: 'inline-flex', alignItems: 'flex-end', gap: `${gap}px`, height: `${heights[heights.length - 1] + 2}px` }}
    >
      {heights.map((barHeight, index) => {
        const isActive = index < bars;
        return (
          <span
            key={barHeight}
            style={{
              width: `${barWidth}px`,
              height: `${barHeight}px`,
              borderRadius: '999px',
              backgroundColor: isActive ? color : inactiveColor,
              boxShadow: isActive ? `0 0 6px ${color}55` : 'none',
              transition: 'all 0.2s ease',
            }}
          />
        );
      })}
    </span>
  );
}

export default function StudentEngagementCard({
  avgProgress = 0,
  selectedCourseTitle = '',
  engagementLevel = '',
  onSelectEngagement,
  cardBg,
  cardBorder,
  textColor,
  subTextColor,
  isLightBg,
}) {
  const activeTierKey = engagementLevel && ENGAGEMENT_TIERS[engagementLevel]
    ? engagementLevel
    : getEngagementTierFromPercent(avgProgress);
  const tier = ENGAGEMENT_TIERS[activeTierKey];
  const inactiveBarColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)';

  return (
    <div
      data-testid="student-engagement-card"
      style={{
        backgroundColor: cardBg,
        border: cardBorder,
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: subTextColor }}>Engajamento</div>
          <div
            data-testid="student-engagement-label"
            style={{ fontSize: '1.35rem', fontWeight: 700, color: textColor, lineHeight: 1.2, marginTop: '2px' }}
          >
            {tier.label}
          </div>
          <div style={{ fontSize: '0.75rem', color: subTextColor, marginTop: '2px' }}>
            {selectedCourseTitle
              ? `média em ${selectedCourseTitle} (${avgProgress}%)`
              : `média dos usuários (${avgProgress}%)`}
          </div>
        </div>

        {/* Barrinhas estilo indicador de sinal (imagem de referência) */}
        <div data-testid="engagement-signal-bars" style={{ paddingBottom: '2px' }}>
          <EngagementSignalBars bars={tier.bars} color={tier.color} inactiveColor={inactiveBarColor} />
        </div>
      </div>

      {/* Filtros rápidos de engajamento */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {Object.entries(ENGAGEMENT_TIERS).map(([key, info]) => {
          const selected = engagementLevel === key;
          return (
            <button
              key={key}
              type="button"
              data-testid={`engagement-chip-${key}`}
              onClick={() => onSelectEngagement && onSelectEngagement(selected ? '' : key)}
              title={`Filtrar alunos com engajamento ${info.label} (${info.range})`}
              style={{
                padding: '3px 8px',
                borderRadius: '6px',
                border: selected ? `1px solid ${info.color}` : (isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)'),
                backgroundColor: selected ? info.bg : 'transparent',
                color: selected ? info.color : subTextColor,
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {info.label} ({info.range})
            </button>
          );
        })}
      </div>
    </div>
  );
}
