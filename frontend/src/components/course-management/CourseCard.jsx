import React from 'react';
import { Layers, PlayCircle, ExternalLink, Lock, Edit2, Trash2, Wrench, Package, History } from 'lucide-react';
import ChainedLockOverlay from './ChainedLockOverlay';
import { recordCourseSalesClick } from './courseSalesApi';

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
  onOpenSalesHistoryModal,
  onShowInfoToast,
  inBundleGroup = false
}) {
  const hasAccess = isManager || course.has_access !== false;
  const isTool = course.item_type === 'tool';
  const bundledCount = course.bundled_items_count || (course.bundled_courses ? course.bundled_courses.length : 0);

  const handleCardClick = () => {
    if (hasAccess) {
      if (isTool) {
        if (course.tool_url) {
          window.open(course.tool_url, '_blank', 'noopener,noreferrer');
        } else if (onShowInfoToast) {
          onShowInfoToast('O link desta ferramenta ainda não foi configurado pelo administrador.');
        }
      } else {
        onSelectCourse(course);
      }
    } else {
      // Registra o clique do usuário que ainda não possui acesso ao produto
      recordCourseSalesClick(course.id);
      if (course.sales_page_url) {
        window.open(course.sales_page_url, '_blank', 'noopener,noreferrer');
      } else if (onShowInfoToast) {
        onShowInfoToast(isTool ? 'A página de compra desta ferramenta estará disponível em breve.' : 'A página de informações deste curso estará disponível em breve.');
      }
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
      {/* Badges no topo esquerdo do card */}
      <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {!hasAccess && (
          <div
            data-testid={`course-unpurchased-badge-${course.id}`}
            style={{
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

        {isTool && (
          <div
            data-testid={`course-tool-badge-${course.id}`}
            style={{
              backgroundColor: 'rgba(139, 92, 246, 0.88)',
              backdropFilter: 'blur(6px)',
              color: '#ffffff',
              border: '1px solid rgba(196, 181, 253, 0.5)',
              borderRadius: '20px',
              padding: '3px 9px',
              fontSize: '10.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              width: 'fit-content'
            }}
          >
            <Wrench size={11} />
            <span>Ferramenta / App</span>
          </div>
        )}

        {(bundledCount > 0 || inBundleGroup) && (
          <div
            data-testid={`course-bundle-badge-${course.id}`}
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.88)',
              backdropFilter: 'blur(6px)',
              color: '#ffffff',
              border: '1px solid rgba(110, 231, 183, 0.5)',
              borderRadius: '20px',
              padding: '3px 9px',
              fontSize: '10.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              width: 'fit-content'
            }}
          >
            <Package size={11} />
            <span>{inBundleGroup ? 'Item do Combo' : `Combo (+${bundledCount})`}</span>
          </div>
        )}
      </div>

      {/* Thumbnail do Curso ou Ferramenta */}
      <div
        className="course-card-thumb"
        onClick={handleCardClick}
        style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
        title={hasAccess ? (isTool ? 'Clique para acessar a ferramenta' : 'Clique para acessar o curso') : 'Produto fechado - Clique para ver mais informações'}
      >
        {course.thumbnail_url || course.cover_image_url ? (
          <img src={course.thumbnail_url || course.cover_image_url} alt={course.title} />
        ) : (
          <div className="course-card-placeholder">
            {isTool ? (
              <Wrench size={40} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
            ) : (
              <Layers size={40} style={{ margin: '0 auto 8px', opacity: 0.7 }} />
            )}
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{isTool ? 'Ferramenta' : 'Área de Membros'}</span>
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
            isTool ? (
              <button
                type="button"
                className="primary-btn"
                onClick={handleCardClick}
                data-testid={`access-tool-btn-${course.id}`}
                style={{
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  gap: '6px',
                  backgroundColor: '#7c3aed',
                  borderColor: '#6d28d9'
                }}
              >
                <ExternalLink size={14} />
                <span>Acessar Ferramenta</span>
              </button>
            ) : (
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
            )
          ) : (
            <button
              type="button"
              className="primary-btn"
              onClick={handleCardClick}
              data-testid={`more-info-course-btn-${course.id}`}
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                gap: '6px',
                backgroundColor: '#2563eb',
                borderColor: '#1d4ed8'
              }}
            >
              <ExternalLink size={14} />
              <span>Ver Mais Informações</span>
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isManager && (
              <>
                <button
                  type="button"
                  className="table-action-btn"
                  title="Histórico de interesse na página de vendas"
                  onClick={() => onOpenSalesHistoryModal && onOpenSalesHistoryModal(course)}
                  data-testid={`sales-history-btn-${course.id}`}
                  style={{
                    color: isLightBg ? undefined : '#38bdf8',
                    borderColor: isLightBg ? undefined : 'rgba(56, 189, 248, 0.25)',
                    backgroundColor: isLightBg ? undefined : 'rgba(56, 189, 248, 0.08)'
                  }}
                >
                  <History size={15} />
                </button>
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
