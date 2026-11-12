import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function LessonReportsPagination({
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 20,
  onPageChange,
  isLightBg = false
}) {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  if (totalItems === 0) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Gera a lista de páginas
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const textColor = isLightBg ? '#475569' : '#94a3b8';
  const activeBg = '#2563eb';
  const btnBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.05)';
  const btnBorder = isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.1)';

  return (
    <div
      className="lesson-reports-pagination"
      data-testid="lesson-reports-pagination"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginTop: '20px',
        padding: '12px 16px',
        borderRadius: '10px',
        backgroundColor: isLightBg ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)',
        border: btnBorder
      }}
    >
      <div style={{ fontSize: '13px', color: textColor }} data-testid="pagination-summary">
        Exibindo <strong style={{ color: isLightBg ? '#0f172a' : '#f8fafc' }}>{startItem}–{endItem}</strong> de{' '}
        <strong style={{ color: isLightBg ? '#0f172a' : '#f8fafc' }}>{totalItems}</strong> relatos (20 por página)
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            opacity: currentPage <= 1 ? 0.4 : 1,
            backgroundColor: btnBg,
            border: btnBorder,
            color: isLightBg ? '#1e293b' : '#f8fafc'
          }}
          data-testid="pagination-prev-btn"
        >
          <ChevronLeft size={15} />
          <span>Anterior</span>
        </button>

        {getPageNumbers().map((num) => {
          const isActive = num === currentPage;
          return (
            <button
              key={num}
              type="button"
              onClick={() => onPageChange(num)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                fontSize: '12.5px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                backgroundColor: isActive ? activeBg : btnBg,
                border: isActive ? '1px solid #3b82f6' : btnBorder,
                color: isActive ? '#ffffff' : (isLightBg ? '#1e293b' : '#cbd5e1')
              }}
              data-testid={`pagination-page-btn-${num}`}
            >
              {num}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12.5px',
            fontWeight: 500,
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage >= totalPages ? 0.4 : 1,
            backgroundColor: btnBg,
            border: btnBorder,
            color: isLightBg ? '#1e293b' : '#f8fafc'
          }}
          data-testid="pagination-next-btn"
        >
          <span>Próxima</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
