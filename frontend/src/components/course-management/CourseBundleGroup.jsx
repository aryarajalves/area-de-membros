import React from 'react';
import { Package, Layers, Wrench, CheckCircle2, Lock } from 'lucide-react';
import CourseCard from './CourseCard';

/**
 * Componente que renderiza um conjunto de produtos (cursos e ferramentas)
 * pertencentes ao mesmo Pacote/Combo envolvidos em um container visual destacado ("caixa").
 */
export default function CourseBundleGroup({
  bundle,
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
}) {
  const coursesCount = bundle.courses.filter((c) => c.item_type !== 'tool').length;
  const toolsCount = bundle.courses.filter((c) => c.item_type === 'tool').length;
  const hasAccess = bundle.hasAccess !== false;

  const bundleBg = isLightBg
    ? 'rgba(236, 253, 245, 0.7)'
    : 'rgba(16, 185, 129, 0.04)';
  const bundleBorder = isLightBg
    ? '1.5px solid rgba(16, 185, 129, 0.5)'
    : '1.5px solid rgba(16, 185, 129, 0.35)';
  const innerCardBg = isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.75)';
  const innerCardBorder = isLightBg
    ? '1px solid rgba(16, 185, 129, 0.25)'
    : '1px solid rgba(255, 255, 255, 0.12)';

  return (
    <div
      className="course-bundle-group"
      data-testid={`bundle-box-${bundle.bundleId}`}
      style={{
        gridColumn: '1 / -1',
        width: '100%',
        boxSizing: 'border-box',
        borderRadius: '20px',
        padding: '24px',
        backgroundColor: bundleBg,
        border: bundleBorder,
        boxShadow: isLightBg
          ? '0 10px 30px -5px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)'
          : '0 10px 32px -4px rgba(0, 0, 0, 0.4), 0 0 25px -4px rgba(16, 185, 129, 0.18)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        marginBottom: '10px',
      }}
    >
      {/* Detalhe de iluminação Neon no topo esquerdo da caixa */}
      <div
        style={{
          position: 'absolute',
          top: '-60px',
          left: '-60px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Cabeçalho do Pacote / Combo */}
      <div
        className="bundle-group-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              border: '1.5px solid rgba(16, 185, 129, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 14px rgba(16, 185, 129, 0.3)',
              flexShrink: 0,
            }}
          >
            <Package size={24} color="#10b981" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  color: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                }}
              >
                Pacote / Combo
              </span>
            </div>

            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: textColor,
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>{bundle.title}</span>
            </h3>

            <p style={{ fontSize: '13px', color: subTextColor, margin: '4px 0 0 0' }}>
              Estes produtos fazem parte do mesmo pacote e são liberados em conjunto.
            </p>
          </div>
        </div>

        {/* Badges de estatísticas e acesso do combo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '20px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 600,
              color: isLightBg ? '#047857' : '#34d399',
            }}
          >
            <Package size={14} color="#10b981" />
            <span>{bundle.totalItems} Produtos Inclusos</span>
          </div>

          {coursesCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.35)',
                borderRadius: '20px',
                padding: '5px 11px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#60a5fa',
              }}
            >
              <Layers size={13} />
              <span>{coursesCount} {coursesCount === 1 ? 'Curso' : 'Cursos'}</span>
            </div>
          )}

          {toolsCount > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid rgba(167, 139, 250, 0.35)',
                borderRadius: '20px',
                padding: '5px 11px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#c084fc',
              }}
            >
              <Wrench size={13} />
              <span>{toolsCount} {toolsCount === 1 ? 'Ferramenta' : 'Ferramentas'}</span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              backgroundColor: hasAccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.12)',
              border: hasAccess ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '20px',
              padding: '5px 11px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: hasAccess ? '#10b981' : '#f87171',
            }}
          >
            {hasAccess ? <CheckCircle2 size={13} /> : <Lock size={13} />}
            <span>{hasAccess ? 'Acesso Liberado' : 'Combo Bloqueado'}</span>
          </div>
        </div>
      </div>

      {/* Linha divisória de gradiente neon sutil */}
      <div
        style={{
          height: '1px',
          background: isLightBg
            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.45) 0%, rgba(16, 185, 129, 0.1) 80%, transparent 100%)'
            : 'linear-gradient(90deg, rgba(16, 185, 129, 0.5) 0%, rgba(16, 185, 129, 0.15) 70%, transparent 100%)',
          margin: '18px 0 20px 0',
        }}
      />

      {/* Grid de Cards dos Produtos Inclusos no Pacote */}
      <div
        className="bundle-cards-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {bundle.courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            isManager={isManager}
            isLightBg={isLightBg}
            textColor={textColor}
            subTextColor={subTextColor}
            cardBg={innerCardBg}
            cardBorder={innerCardBorder}
            onSelectCourse={onSelectCourse}
            onOpenEditModal={onOpenEditModal}
            onPromptDelete={onPromptDelete}
            onOpenSalesHistoryModal={onOpenSalesHistoryModal}
            onShowInfoToast={onShowInfoToast}
            inBundleGroup={true}
          />
        ))}
      </div>
    </div>
  );
}
