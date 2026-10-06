import React from 'react';

/**
 * Componente unificado de paginação para modais e listagens de histórico.
 * Exibe no padrão de 20 por página, com contador de itens, botões Anterior/Próxima e números de páginas navegáveis.
 */
export default function HistoryPaginationBar({
  currentPage,
  totalItems,
  pageSize = 20,
  onPageChange,
  itemName = 'itens',
  isLightBg = false,
  testIdPrefix = 'history',
}) {
  if (!totalItems || totalItems <= pageSize) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderCol = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';
  const btnBorder = isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 2px 4px 2px',
        borderTop: borderCol,
        marginTop: '12px',
        fontSize: '0.82rem',
        color: subTextColor,
        flexWrap: 'wrap',
        gap: '10px',
      }}
      data-testid={`${testIdPrefix}-pagination-bar`}
    >
      <div>
        Exibindo <strong style={{ color: textColor }}>{startItem}–{endItem}</strong> de{' '}
        <strong style={{ color: textColor }}>{totalItems}</strong> {itemName}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            border: btnBorder,
            backgroundColor: 'transparent',
            color: textColor,
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.35 : 1,
            fontSize: '0.78rem',
            fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
          data-testid={`${testIdPrefix}-prev-page-btn`}
        >
          Anterior
        </button>

        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                style={{ padding: '0 4px', color: subTextColor, fontSize: '0.8rem' }}
              >
                ...
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange(p)}
              style={{
                minWidth: '28px',
                height: '28px',
                padding: '0 6px',
                borderRadius: '6px',
                border: isActive ? '1px solid #8b5cf6' : btnBorder,
                backgroundColor: isActive ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
                color: isActive ? '#c4b5fd' : textColor,
                fontSize: '0.78rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              data-testid={`${testIdPrefix}-page-${p}-btn`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          style={{
            padding: '5px 10px',
            borderRadius: '6px',
            border: btnBorder,
            backgroundColor: 'transparent',
            color: textColor,
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage >= totalPages ? 0.35 : 1,
            fontSize: '0.78rem',
            fontWeight: 500,
            transition: 'all 0.15s ease',
          }}
          data-testid={`${testIdPrefix}-next-page-btn`}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
