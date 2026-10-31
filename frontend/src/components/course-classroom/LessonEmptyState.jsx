import React from 'react';
import { Layers, PlayCircle, Plus } from 'lucide-react';

export default function LessonEmptyState({
  hasLessons = true,
  isManager = false,
  onOpenCreateLesson,
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  borderColor = 'rgba(255, 255, 255, 0.1)',
  rightSidebar = null
}) {
  if (!hasLessons) {
    return (
      <div
        className="classroom-layout-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: rightSidebar ? 'minmax(0, 1fr) 310px' : '1fr',
          gap: '48px',
          alignItems: 'start'
        }}
      >
        <div
          data-testid="empty-module-container"
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: subTextColor,
            borderRadius: '14px',
            border: `1px dashed ${borderColor}`,
            backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
            minHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: isLightBg ? '#fef9c3' : 'rgba(234, 179, 8, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px'
            }}
          >
            <Layers size={32} color="#eab308" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: textColor, marginBottom: '8px' }}>
            Não possuímos aulas cadastradas nesse módulo
          </h3>
          <p style={{ fontSize: '14px', maxWidth: '440px', margin: '0 auto', color: subTextColor, lineHeight: 1.5 }}>
            Ainda não há aulas disponíveis neste módulo. O conteúdo será disponibilizado em breve.
          </p>
          {isManager && onOpenCreateLesson && (
            <button
              type="button"
              data-testid="btn-create-first-lesson"
              onClick={onOpenCreateLesson}
              style={{
                marginTop: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                backgroundColor: '#eab308',
                color: '#0f172a',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease'
              }}
            >
              <Plus size={16} />
              Criar primeira aula
            </button>
          )}
        </div>
        {rightSidebar && <div>{rightSidebar}</div>}
      </div>
    );
  }

  return (
    <div
      className="classroom-layout-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: rightSidebar ? 'minmax(0, 1fr) 310px' : '1fr',
        gap: '48px',
        alignItems: 'start'
      }}
    >
      <div
        style={{
          textAlign: 'center',
          padding: '80px 20px',
          color: subTextColor,
          borderRadius: '14px',
          border: `1px dashed ${borderColor}`,
          backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.02)',
          minHeight: '320px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <PlayCircle size={42} color="#eab308" style={{ marginBottom: '14px' }} />
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: textColor, marginBottom: '8px' }}>
          Selecione uma aula para assistir
        </h3>
        <p style={{ fontSize: '14px', maxWidth: '420px', margin: '0 auto', color: subTextColor }}>
          Escolha uma das aulas na linha do tempo ao lado para reproduzir o conteúdo.
        </p>
      </div>
      {rightSidebar && <div>{rightSidebar}</div>}
    </div>
  );
}
