import React from 'react';
import { Search, X, CheckCircle2, Circle } from 'lucide-react';

export default function StudentLessonSearchBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isLightBg = false,
  counts = { all: 0, pending: 0, completed: 0 }
}) {
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)';
  const inputBg = isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.65)';

  const FILTERS = [
    { key: 'all', label: 'Todas', count: counts.all },
    { key: 'pending', label: 'Não Assistidas', count: counts.pending, icon: Circle },
    { key: 'completed', label: 'Concluídas', count: counts.completed, icon: CheckCircle2 }
  ];

  return (
    <div
      data-testid="student-lesson-search-bar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        paddingBottom: '6px'
      }}
    >
      {/* Campo de Busca Rápida com Ícone e Botão Limpar */}
      <div style={{ position: 'relative', width: '100%' }}>
        <Search
          size={14}
          color={subTextColor}
          style={{
            position: 'absolute',
            left: '11px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar aula ou tema..."
          data-testid="student-lesson-search-input"
          style={{
            width: '100%',
            padding: '7px 30px 7px 32px',
            fontSize: '12.5px',
            borderRadius: '9px',
            border: `1px solid ${borderColor}`,
            backgroundColor: inputBg,
            color: textColor,
            outline: 'none',
            transition: 'border-color 0.15s ease'
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            data-testid="student-lesson-search-clear-btn"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: subTextColor,
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Limpar busca"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Pílulas de Filtro Rápido (Todas | Não Assistidas | Concluídas) */}
      <div
        data-testid="student-lesson-filter-pills"
        style={{
          display: 'flex',
          gap: '5px',
          alignItems: 'center'
        }}
      >
        {FILTERS.map((f) => {
          const isActive = statusFilter === f.key;
          const Icon = f.icon;

          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onStatusFilterChange(f.key)}
              data-testid={`student-filter-btn-${f.key}`}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: '4px 6px',
                borderRadius: '7px',
                fontSize: '11px',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                backgroundColor: isActive
                  ? (isLightBg ? '#eab308' : 'rgba(234, 179, 8, 0.22)')
                  : (isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)'),
                color: isActive
                  ? (isLightBg ? '#0f172a' : '#facc15')
                  : subTextColor,
                border: isActive
                  ? '1px solid rgba(234, 179, 8, 0.55)'
                  : `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {Icon && <Icon size={11} style={{ flexShrink: 0 }} />}
              <span>{f.label}</span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  opacity: 0.85
                }}
              >
                &nbsp;({f.count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
