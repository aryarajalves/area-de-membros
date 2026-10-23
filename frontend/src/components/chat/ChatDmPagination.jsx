import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ChatDmPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  startIndex = 0,
  itemsPerPage = 20,
  onPageChange,
}) {
  if (totalItems === 0) return null;

  const endItem = Math.min(startIndex + itemsPerPage, totalItems);
  const startItem = totalItems > 0 ? startIndex + 1 : 0;

  const buttonStyle = (isDisabled) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: isDisabled ? 'rgba(255, 255, 255, 0.03)' : 'rgba(56, 189, 248, 0.12)',
    border: '1px solid',
    borderColor: isDisabled ? 'rgba(255, 255, 255, 0.06)' : 'rgba(56, 189, 248, 0.35)',
    color: isDisabled ? '#64748b' : '#38bdf8',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
  });

  return (
    <div
      data-testid="dm-pagination-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0c1322',
        flexWrap: 'wrap',
        gap: '8px',
      }}
    >
      <span
        data-testid="dm-pagination-info"
        style={{ fontSize: '0.75rem', color: '#94a3b8' }}
      >
        Exibindo {startItem}–{endItem} de {totalItems} {totalItems === 1 ? 'DM' : 'DMs'}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          data-testid="dm-pagination-prev-btn"
          style={buttonStyle(currentPage <= 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={14} />
          <span>Anterior</span>
        </button>

        <span
          data-testid="dm-pagination-indicator"
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#f8fafc',
            padding: '0 4px',
          }}
        >
          {currentPage} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          data-testid="dm-pagination-next-btn"
          style={buttonStyle(currentPage >= totalPages)}
          aria-label="Próxima página"
        >
          <span>Próxima</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
