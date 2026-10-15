import React from 'react';
import { GraduationCap, Wrench, ExternalLink, Link as LinkIcon } from 'lucide-react';

export default function CourseTypeSelector({
  itemType = 'course',
  onChangeItemType,
  toolUrl = '',
  onChangeToolUrl,
  isLightBg = false
}) {
  const isTool = itemType === 'tool';

  const cardBorder = isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)';
  const activeBorder = '#3b82f6';
  const activeBg = isLightBg ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.15)';
  const inactiveBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';

  return (
    <div className="form-group" style={{ marginBottom: '18px' }} data-testid="course-type-selector">
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '13.5px', color: textColor }}>
        Tipo do Conteúdo *
      </label>

      {/* Grid de seleção entre Curso e Ferramenta */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: isTool ? '14px' : '0' }}>
        {/* Opção 1: Curso */}
        <button
          type="button"
          onClick={() => onChangeItemType('course')}
          data-testid="item-type-course-btn"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '6px',
            padding: '12px 14px',
            borderRadius: '10px',
            border: !isTool ? `2px solid ${activeBorder}` : cardBorder,
            backgroundColor: !isTool ? activeBg : inactiveBg,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: !isTool ? '#3b82f6' : textColor }}>
            <GraduationCap size={18} />
            <span style={{ fontWeight: 700, fontSize: '13.5px' }}>Curso Completo</span>
          </div>
          <span style={{ fontSize: '11.5px', color: subTextColor, lineHeight: '1.3' }}>
            Aulas em vídeo, módulos estruturados, materiais e comentários.
          </span>
        </button>

        {/* Opção 2: Ferramenta / Aplicativo */}
        <button
          type="button"
          onClick={() => onChangeItemType('tool')}
          data-testid="item-type-tool-btn"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '6px',
            padding: '12px 14px',
            borderRadius: '10px',
            border: isTool ? `2px solid #8b5cf6` : cardBorder,
            backgroundColor: isTool ? (isLightBg ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.15)') : inactiveBg,
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isTool ? '#a78bfa' : textColor }}>
            <Wrench size={18} />
            <span style={{ fontWeight: 700, fontSize: '13.5px' }}>Ferramenta / App</span>
          </div>
          <span style={{ fontSize: '11.5px', color: subTextColor, lineHeight: '1.3' }}>
            Acesso direto a software, aplicativo web ou ferramenta externa.
          </span>
        </button>
      </div>

      {/* Campo da URL da Ferramenta quando o tipo for 'tool' */}
      {isTool && (
        <div
          data-testid="tool-url-field-container"
          style={{
            marginTop: '12px',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(139, 92, 246, 0.07)',
            border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(139, 92, 246, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label
              htmlFor="course-tool-url"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12.5px',
                fontWeight: 600,
                color: isLightBg ? '#4c1d95' : '#c4b5fd'
              }}
            >
              <LinkIcon size={14} />
              <span>Link de Acesso da Ferramenta / Aplicativo *</span>
            </label>

            {toolUrl && (
              <a
                href={toolUrl.startsWith('http') ? toolUrl : `https://${toolUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="test-tool-url-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11.5px',
                  color: '#a78bfa',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                <span>Testar Link</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          <p style={{ fontSize: '11.5px', color: subTextColor, margin: '0 0 8px 0', lineHeight: '1.3' }}>
            Ao clicar no card desta ferramenta na Área de Membros, o aluno será redirecionado diretamente para este link.
          </p>

          <input
            id="course-tool-url"
            type="url"
            required={isTool}
            placeholder="Ex: https://app.zapvoice.com.br ou https://ferramenta.seusite.com"
            value={toolUrl}
            onChange={(e) => onChangeToolUrl(e.target.value)}
            data-testid="course-tool-url-input"
            style={{
              width: '100%',
              borderColor: isTool && !toolUrl ? '#ef4444' : undefined
            }}
          />
        </div>
      )}
    </div>
  );
}
