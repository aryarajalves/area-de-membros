import React from 'react';
import { Layers, PlayCircle, Clock, Globe } from 'lucide-react';

const LANG_FLAGS = {
  pt: '🇧🇷', en: '🇺🇸', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹', other: '🌐'
};

/**
 * Barra unificada no topo do Player:
 * - À esquerda: Partes da Aula (Parte 1, Parte 2, Parte 3...)
 * - À direita: Seletor de Idioma (quando houver mais de 1 idioma cadastrado)
 */
export default function LessonPartsBar({
  videos = [],
  activeIndex = 0,
  onSelectPart,
  languages = [],
  selectedLang = 'pt',
  onSelectLang,
  isLightBg = false
}) {
  const hasMultipleParts = Array.isArray(videos) && videos.length > 1;
  const hasMultipleLangs = Array.isArray(languages) && languages.length > 1;

  if (!hasMultipleParts && !hasMultipleLangs) {
    return null;
  }

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const barBg = isLightBg ? '#f1f5f9' : '#0b1120';
  const borderTop = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';

  return (
    <div
      data-testid="lesson-parts-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        backgroundColor: barBg,
        borderTop,
        flexWrap: 'wrap',
        gap: '12px',
        userSelect: 'none'
      }}
    >
      {/* Lado Esquerdo: Pílulas das Partes da Aula */}
      {hasMultipleParts ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '26px', height: '26px', borderRadius: '6px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Layers size={14} color="#38bdf8" />
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: textColor }}>
              Partes da Aula
            </span>
            <span style={{ fontSize: '11px', color: subTextColor }}>
              ({videos.length} vídeos)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            {videos.map((vid, idx) => {
              const isActive = idx === activeIndex;
              const partLabel = `Parte ${idx + 1}`;
              const titleSnippet = vid.title && vid.title.toLowerCase() !== partLabel.toLowerCase() ? vid.title : null;
              const duration = vid.duration || null;

              return (
                <button
                  key={vid.id || `part-${idx}`}
                  type="button"
                  onClick={() => onSelectPart && onSelectPart(idx, vid)}
                  data-testid={`lesson-part-btn-${idx}`}
                  title={titleSnippet ? `${partLabel}: ${titleSnippet}` : partLabel}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px',
                    borderRadius: '8px', fontSize: '12px', fontWeight: isActive ? 700 : 500, cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: isActive ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                    color: isActive ? '#ffffff' : textColor,
                    boxShadow: isActive ? '0 0 14px rgba(56, 189, 248, 0.35)' : 'none'
                  }}
                >
                  <PlayCircle size={13} color={isActive ? '#38bdf8' : subTextColor} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap' }}>{partLabel}</span>
                  {titleSnippet && (
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.85, fontSize: '11px' }}>
                      · {titleSnippet}
                    </span>
                  )}
                  {duration && (
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px',
                      padding: '2px 5px', borderRadius: '4px',
                      backgroundColor: isActive ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.08)',
                      color: isActive ? '#ffffff' : subTextColor
                    }}>
                      <Clock size={10} />
                      {duration}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Globe size={15} color="#94a3b8" />
          <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#e2e8f0' }}>Idioma da Aula:</span>
        </div>
      )}

      {/* Lado Direito: Seletor de Idioma (quando houver múltiplos idiomas) */}
      {hasMultipleLangs && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }} data-testid="lesson-language-selector">
          {hasMultipleParts && (
            <span style={{ fontSize: '11.5px', color: subTextColor, marginRight: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Globe size={13} /> Idioma:
            </span>
          )}
          {languages.map((lang) => {
            const flag = LANG_FLAGS[lang.code] || '🌐';
            const isActive = lang.code === selectedLang;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => onSelectLang && onSelectLang(lang.code)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px',
                  borderRadius: '6px', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
                  backgroundColor: isActive ? '#eab308' : '#1e293b',
                  color: isActive ? '#0f172a' : '#94a3b8',
                  transition: 'all 0.15s ease'
                }}
                data-testid={`player-lang-btn-${lang.code}`}
              >
                <span>{flag}</span>
                <span>{lang.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
