import React from 'react';

export default function StudentPaginationBar({
  page,
  limit,
  setPage,
  setLimit,
  totalStudents,
  totalPages,
  isLightBg,
  textColor,
  subTextColor
}) {
  if (totalStudents <= 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '28px',
        paddingTop: '16px',
        borderTop: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
        flexWrap: 'wrap',
        gap: '16px',
        fontSize: '0.85rem',
        color: subTextColor,
      }}
      data-testid="students-pagination-bar"
    >
      <div>
        Exibindo <strong>{(page - 1) * limit + 1}–{Math.min(page * limit, totalStudents)}</strong> de{' '}
        <strong>{totalStudents}</strong> {totalStudents === 1 ? 'aluno' : 'alunos'}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label htmlFor="students-per-page-select" style={{ fontSize: '0.82rem', color: subTextColor }}>
            Exibir:
          </label>
          <select
            id="students-per-page-select"
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.06)',
              color: textColor,
              border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.84rem',
              cursor: 'pointer',
              outline: 'none',
            }}
            data-testid="students-per-page-select"
          >
            <option value={20} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>20 por vez</option>
            <option value={50} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>50 por vez</option>
            <option value={100} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>100 por vez</option>
            <option value={200} style={{ backgroundColor: '#090d16', color: '#f8fafc' }}>200 por vez</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: textColor,
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              opacity: page <= 1 ? 0.35 : 1,
              transition: 'all 0.2s ease',
            }}
            data-testid="prev-students-page-btn"
          >
            Anterior
          </button>
          <span style={{ fontSize: '0.84rem', color: subTextColor, padding: '0 4px' }}>
            Página <strong>{page}</strong> de <strong>{totalPages}</strong>
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: textColor,
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              opacity: page >= totalPages ? 0.35 : 1,
              transition: 'all 0.2s ease',
            }}
            data-testid="next-students-page-btn"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
}
