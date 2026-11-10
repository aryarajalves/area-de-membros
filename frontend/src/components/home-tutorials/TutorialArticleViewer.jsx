import React from 'react';
import { BookOpen, Clock, FileText, CheckCircle2 } from 'lucide-react';

export default function TutorialArticleViewer({
  tutorial,
  titleColor = '#f8fafc',
  descColor = '#94a3b8',
  borderColor = 'rgba(255, 255, 255, 0.1)',
  cardBg = 'rgba(255, 255, 255, 0.03)'
}) {
  if (!tutorial) return null;

  const content = tutorial.text_content || tutorial.description || '';

  const renderMarkdown = (text) => {
    if (!text || !text.trim()) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: descColor }}>
          <FileText size={36} color={descColor} style={{ marginBottom: '12px', opacity: 0.5 }} />
          <p style={{ margin: 0 }}>Nenhum conteúdo em texto cadastrado para este tutorial.</p>
        </div>
      );
    }

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (line.startsWith('# ')) {
        return (
          <h1
            key={`h1-${idx}`}
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: titleColor,
              margin: '24px 0 12px 0',
              paddingBottom: '8px',
              borderBottom: `1px solid ${borderColor}`
            }}
          >
            {line.substring(2)}
          </h1>
        );
      }

      if (line.startsWith('## ')) {
        return (
          <h2
            key={`h2-${idx}`}
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: titleColor,
              margin: '20px 0 10px 0'
            }}
          >
            {line.substring(3)}
          </h2>
        );
      }

      if (line.startsWith('### ')) {
        return (
          <h3
            key={`h3-${idx}`}
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: titleColor,
              margin: '16px 0 8px 0'
            }}
          >
            {line.substring(4)}
          </h3>
        );
      }

      if (line.startsWith('> ')) {
        return (
          <div
            key={`quote-${idx}`}
            style={{
              margin: '16px 0',
              padding: '12px 18px',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              borderLeft: '4px solid #3b82f6',
              borderRadius: '0 8px 8px 0',
              color: '#93c5fd',
              fontSize: '14px',
              lineHeight: 1.6
            }}
          >
            {line.substring(2)}
          </div>
        );
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        const itemText = line.substring(2);
        const parts = itemText.split(/(\*\*.*?\*\*)/g);
        return (
          <li
            key={`li-${idx}`}
            style={{
              marginLeft: '24px',
              marginBottom: '8px',
              color: '#cbd5e1',
              lineHeight: 1.7,
              fontSize: '14.5px'
            }}
          >
            {parts.map((p, pIdx) => {
              if (p.startsWith('**') && p.endsWith('**')) {
                return <strong key={pIdx} style={{ color: titleColor, fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
              }
              return p;
            })}
          </li>
        );
      }

      if (trimmed === '---') {
        return (
          <hr
            key={`hr-${idx}`}
            style={{
              border: 'none',
              borderTop: `1px solid ${borderColor}`,
              margin: '28px 0'
            }}
          />
        );
      }

      if (trimmed === '') {
        return <div key={`empty-${idx}`} style={{ height: '10px' }} />;
      }

      // Parágrafo com suporte a negrito **texto**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p
          key={`p-${idx}`}
          style={{
            margin: '0 0 14px 0',
            color: '#cbd5e1',
            lineHeight: 1.75,
            fontSize: '14.5px'
          }}
        >
          {parts.map((p, pIdx) => {
            if (p.startsWith('**') && p.endsWith('**')) {
              return <strong key={pIdx} style={{ color: titleColor, fontWeight: 600 }}>{p.slice(2, -2)}</strong>;
            }
            return p;
          })}
        </p>
      );
    });
  };

  return (
    <div
      style={{
        borderRadius: '14px',
        overflow: 'hidden',
        border: `1px solid ${borderColor}`,
        backgroundColor: cardBg,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.5)'
      }}
      data-testid="tutorial-article-viewer"
    >
      {/* Banner Superior do Artigo */}
      <div
        style={{
          padding: '24px 28px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(15, 23, 42, 0.6) 100%)',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa'
            }}
          >
            <BookOpen size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#60a5fa',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  letterSpacing: '0.5px'
                }}
              >
                Guia em Texto
              </span>
              {tutorial.duration && (
                <span
                  style={{
                    fontSize: '12px',
                    color: descColor,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Clock size={12} />
                  {tutorial.duration}
                </span>
              )}
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: titleColor, margin: 0 }}>
              {tutorial.title}
            </h2>
          </div>
        </div>
      </div>

      {/* Corpo do Artigo em Markdown */}
      <div
        style={{
          padding: '28px',
          maxHeight: '650px',
          overflowY: 'auto'
        }}
        data-testid="tutorial-article-body"
      >
        {renderMarkdown(content)}
      </div>
    </div>
  );
}
