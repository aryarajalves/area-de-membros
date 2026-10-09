import React, { useEffect } from 'react';
import { BookOpen, X } from 'lucide-react';

export default function CourseDescriptionModal({
  isOpen,
  onClose,
  title = 'Sobre o Curso',
  description = '',
  isLightBg = false
}) {
  // Fecha ao pressionar Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalBg = isLightBg ? '#ffffff' : '#0a0f1d';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#475569' : '#cbd5e1';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(234, 179, 8, 0.28)';

  // Divide o texto em parágrafos preservando quebras de linha
  const paragraphs = (description || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div
      className="custom-modal-overlay"
      data-testid="course-description-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '16px'
      }}
      onClick={(e) => {
        // Regra UX: NÃO deve fechar ao clicar fora do painel central
        e.stopPropagation();
      }}
    >
      <div
        className="table-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-description-modal-title"
        data-testid="course-description-modal"
        style={{
          width: '94%',
          maxWidth: '640px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '16px',
          backgroundColor: modalBg,
          border: `1px solid ${borderColor}`,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(234, 179, 8, 0.14)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo do Modal */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: isLightBg ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                color: '#facc15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <BookOpen size={20} />
            </div>
            <div>
              <h3
                id="course-description-modal-title"
                data-testid="course-description-modal-title"
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: textColor,
                  margin: 0,
                  lineHeight: 1.3
                }}
              >
                {title}
              </h3>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Descrição Detalhada do Treinamento
              </span>
            </div>
          </div>

          <button
            type="button"
            className="close-modal-btn"
            onClick={onClose}
            data-testid="close-course-description-modal-btn"
            aria-label="Fechar modal"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
              color: textColor,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              transition: 'background-color 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com Scroll Suave */}
        <div
          data-testid="course-description-modal-content"
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            color: subTextColor,
            fontSize: '14.5px',
            lineHeight: 1.7
          }}
        >
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p
                key={index}
                style={{
                  margin: '0 0 16px 0',
                  textAlign: 'justify',
                  whiteSpace: 'pre-line'
                }}
              >
                {paragraph}
              </p>
            ))
          ) : (
            <p style={{ margin: 0, fontStyle: 'italic', color: '#94a3b8' }}>
              {description || 'Nenhuma descrição detalhada informada para este curso.'}
            </p>
          )}
        </div>

        {/* Rodapé com 1 Botão de Ação */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '16px 24px',
            borderTop: isLightBg ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: isLightBg ? '#fafafa' : 'rgba(0, 0, 0, 0.25)'
          }}
        >
          <button
            type="button"
            className="primary-btn"
            onClick={onClose}
            data-testid="confirm-close-course-description-modal-btn"
            style={{
              backgroundColor: '#eab308',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '13px',
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
