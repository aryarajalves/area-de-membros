import React from 'react';

export default function KnowledgeBaseMetricsCards({
  metrics = {},
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)',
  textColor = '#f8fafc',
  subTextColor = '#94a3b8'
}) {
  return (
    <div
      data-testid="kb-metrics-cards"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '14px'
      }}
    >
      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: cardBg, border: cardBorder }}>
        <span style={{ fontSize: '11px', color: subTextColor, textTransform: 'uppercase', fontWeight: 600 }}>Total de Aulas</span>
        <div style={{ fontSize: '22px', fontWeight: 700, color: textColor, marginTop: '4px' }}>{metrics.total_lessons ?? 0}</div>
        <span style={{ fontSize: '11.5px', color: subTextColor }}>no catálogo completo</span>
      </div>

      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: cardBg, border: cardBorder }}>
        <span style={{ fontSize: '11px', color: subTextColor, textTransform: 'uppercase', fontWeight: 600 }}>Transcrições IA</span>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>{metrics.total_transcriptions ?? 0}</div>
        <span style={{ fontSize: '11.5px', color: subTextColor }}>aulas com texto gerado</span>
      </div>

      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: cardBg, border: cardBorder }}>
        <span style={{ fontSize: '11px', color: subTextColor, textTransform: 'uppercase', fontWeight: 600 }}>Aulas no RAG Vetorial</span>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>{metrics.indexed_lessons ?? 0}</div>
        <span style={{ fontSize: '11.5px', color: subTextColor }}>indexadas para busca</span>
      </div>

      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: cardBg, border: cardBorder }}>
        <span style={{ fontSize: '11px', color: subTextColor, textTransform: 'uppercase', fontWeight: 600 }}>Total de Fragmentos (Chunks)</span>
        <div style={{ fontSize: '22px', fontWeight: 700, color: '#a855f7', marginTop: '4px' }}>{metrics.total_chunks ?? 0}</div>
        <span style={{ fontSize: '11.5px', color: subTextColor }}>vetores e perguntas Q&A</span>
      </div>
    </div>
  );
}
