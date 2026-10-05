import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, X, Check, FileText } from 'lucide-react';

export default function ExpandableTextarea({
  label = 'Descrição',
  value = '',
  onChange,
  placeholder = '',
  rows = 2,
  expandedRows = 8,
  minHeight = '65px',
  expandedMinHeight = '230px',
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  className = 'form-control-modern',
  testId = 'expandable-textarea',
  toggleTestId = 'toggle-expand-textarea-btn',
  fullscreenTestId = 'fullscreen-textarea-btn',
  fullscreenModalTestId = 'fullscreen-textarea-modal',
  id,
  style = {}
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fecha o popup ao pressionar a tecla Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const wordCount = (value || '').trim() ? (value || '').trim().split(/\s+/).length : 0;
  const charCount = (value || '').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px'
        }}
      >
        <label
          htmlFor={id}
          style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: textColor,
            margin: 0
          }}
        >
          {label}
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Botão de Tela Cheia / Popup Gigante */}
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            data-testid={fullscreenTestId}
            title="Abrir em popup gigante de tela cheia"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              color: '#60a5fa',
              cursor: 'pointer',
              padding: '3px 9px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
          >
            <Maximize2 size={12} />
            <span>Tela Cheia</span>
          </button>

          {/* Botão Inline Maximizar/Restaurar */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            data-testid={toggleTestId}
            title={isExpanded ? 'Restaurar tamanho normal' : 'Maximizar campo de descrição'}
            style={{
              background: isExpanded ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: isExpanded ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: isExpanded ? '#60a5fa' : subTextColor,
              cursor: 'pointer',
              padding: '3px 8px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            <span>{isExpanded ? 'Restaurar' : 'Maximizar'}</span>
          </button>
        </div>
      </div>

      <textarea
        id={id}
        rows={isExpanded ? expandedRows : rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={className}
        style={{
          resize: 'vertical',
          minHeight: isExpanded ? expandedMinHeight : minHeight,
          transition: 'min-height 0.2s ease',
          lineHeight: '1.5'
        }}
        data-testid={testId}
      />

      {/* POPUP GIGANTE DE TELA CHEIA */}
      {isFullscreen && (
        <div
          className="modal-overlay"
          data-testid={`${fullscreenModalTestId}-overlay`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => {
            // Regra UX: NÃO fechar ao clicar fora do painel central
            e.stopPropagation();
          }}
        >
          <div
            className="fullscreen-textarea-panel"
            data-testid={fullscreenModalTestId}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fullscreen-textarea-title"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '94vw',
              maxWidth: '1100px',
              height: '86vh',
              maxHeight: '920px',
              backgroundColor: '#0a0f1d',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: '16px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(37, 99, 235, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              overflow: 'hidden'
            }}
          >
            {/* Topo do Popup Gigante */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    color: '#60a5fa',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <h3
                    id="fullscreen-textarea-title"
                    data-testid="fullscreen-modal-title"
                    style={{
                      margin: 0,
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      color: '#ffffff'
                    }}
                  >
                    {label} — Modo Tela Cheia
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Área ampliada para edição confortável de conteúdo
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  data-testid="fullscreen-char-counter"
                  style={{
                    fontSize: '0.78rem',
                    color: '#64748b',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {wordCount} palavras • {charCount} caracteres
                </span>

                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  data-testid="close-fullscreen-btn"
                  title="Fechar modo tela cheia"
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#cbd5e1',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#cbd5e1';
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Textarea Gigante Central */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <textarea
                value={value}
                onChange={onChange}
                placeholder={placeholder || 'Digite o texto detalhado em tela cheia...'}
                data-testid={`${testId}-fullscreen`}
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#111827',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '15px',
                  lineHeight: '1.7',
                  padding: '20px',
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.5)'
                }}
                autoFocus
              />
            </div>

            {/* Rodapé do Popup Gigante */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                marginTop: '16px'
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Pressione <kbd style={{ padding: '2px 5px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '4px' }}>Esc</kbd> ou clique em Concluir Edição para voltar
              </span>

              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                data-testid="finish-fullscreen-btn"
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 22px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
                  transition: 'background-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
              >
                <Check size={16} />
                <span>Concluir Edição</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
