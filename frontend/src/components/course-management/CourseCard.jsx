import React from 'react';
import { Layers, PlayCircle, ExternalLink, Lock, Edit2, Trash2, HelpCircle } from 'lucide-react';
import ChainedLockOverlay from './ChainedLockOverlay';

export default function CourseCard({
  course,
  isManager,
  isLightBg,
  textColor,
  subTextColor,
  cardBg,
  cardBorder,
  onSelectCourse,
  onOpenEditModal,
  onPromptDelete,
  onShowInfoToast,
  onContactSupport
}) {
  const hasAccess = isManager || course.has_access !== false;

  const handleCardClick = () => {
    if (hasAccess) {
      onSelectCourse(course);
    } else if (course.sales_page_url) {
      window.open(course.sales_page_url, '_blank', 'noopener,noreferrer');
    } else if (onShowInfoToast) {
      onShowInfoToast('A página de informações deste curso estará disponível em breve.');
    }
  };

  return (
    <div
      className="table-card"
      style={{
        padding: '0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '12px',
        backgroundColor: cardBg,
        border: cardBorder,
        position: 'relative'
      }}
      data-testid={`course-card-${course.id}`}
    >
      {/* Badge para curso não adquirido */}
      {!hasAccess && (
        <div
          data-testid={`course-unpurchased-badge-${course.id}`}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 2,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            color: '#38bdf8',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '20px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Lock size={12} />
          <span>Disponível para Compra</span>
        </div>
      )}

      {/* Thumbnail do Curso */}
      <div
        className="course-card-thumb"
        onClick={handleCardClick}
        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        title={hasAccess ? 'Clique para acessar o curso' : 'Produto fechado - Clique para ver mais informações'}
      >
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt={course.title} />
        ) : (
          <div className="course-card-placeholder">
            <Layers size={40} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Área de Membros</span>
          </div>
        )}

        {/* Overlay de Cadeado com Correntes para produto fechado */}
        {!hasAccess && <ChainedLockOverlay isLightBg={isLightBg} />}
      </div>

      {/* Informações do Curso */}
      <div className="course-card-body">
        <h3
          onClick={handleCardClick}
          style={{ fontSize: '16px', fontWeight: 700, color: textColor, margin: 0, cursor: 'pointer' }}
        >
          {course.title}
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: subTextColor,
            lineHeight: '1.5',
            margin: 0,
            flex: 1,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {course.description || 'Nenhuma descrição fornecida.'}
        </p>

        {/* Ações do Card */}
        <div className="course-card-footer" style={{ borderTop: cardBorder }}>
          {hasAccess ? (
            <button
              type="button"
              className="primary-btn"
              onClick={() => onSelectCourse(course)}
              data-testid={`access-course-btn-${course.id}`}
              style={{ padding: '6px 12px', fontSize: '12.5px', gap: '6px' }}
            >
              <PlayCircle size={14} />
              <span>Acessar Curso</span>
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="primary-btn"
                onClick={handleCardClick}
                data-testid={`more-info-course-btn-${course.id}`}
                style={{
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  gap: '6px',
                  backgroundColor: '#2563eb',
                  borderColor: '#1d4ed8'
                }}
              >
                <ExternalLink size={14} />
                <span>Ver Mais Informações</span>
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onContactSupport) {
                    onContactSupport(course);
                  }
                }}
                data-testid={`contact-support-course-btn-${course.id}`}
                style={{
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  gap: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  color: isLightBg ? '#0f172a' : '#38bdf8',
                  borderColor: isLightBg ? '#cbd5e1' : 'rgba(56, 189, 248, 0.4)',
                  backgroundColor: isLightBg ? 'rgba(0,0,0,0.05)' : 'rgba(56, 189, 248, 0.1)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <HelpCircle size={14} />
                <span>Entrar em Contato</span>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isManager && (
              <>
                <button
                  type="button"
                  className="table-action-btn"
                  title="Editar curso"
                  onClick={() => onOpenEditModal(course)}
                  data-testid={`edit-course-btn-${course.id}`}
                  style={{
                    color: isLightBg ? undefined : '#cbd5e1',
                    borderColor: isLightBg ? undefined : 'rgba(255,255,255,0.15)',
                    backgroundColor: isLightBg ? undefined : 'rgba(255,255,255,0.06)'
                  }}
                >
                  <Edit2 size={15} />
                </button>
                <button
                  type="button"
                  className="table-action-btn btn-danger"
                  title="Excluir curso"
                  onClick={() => onPromptDelete(course)}
                  data-testid={`delete-course-btn-${course.id}`}
                >
                  <Trash2 size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
