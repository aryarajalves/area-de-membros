import React from 'react';
import { Info, AlertTriangle, AlertCircle, Globe, ListFilter } from 'lucide-react';

export default function LogTypeFilter({ currentFilter, onSelectFilter, counts }) {
  const filterOptions = [
    { id: 'all', label: 'Todos', icon: ListFilter, count: counts.all, color: '#64748b' },
    { id: 'info', label: 'Info', icon: Info, count: counts.info, color: '#38bdf8' },
    { id: 'warning', label: 'Avisos', icon: AlertTriangle, count: counts.warning, color: '#f59e0b' },
    { id: 'error', label: 'Erros', icon: AlertCircle, count: counts.error, color: '#ef4444' },
    { id: 'http', label: 'HTTP', icon: Globe, count: counts.http, color: '#10b981' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        padding: '10px 14px',
        backgroundColor: '#1e293b',
        borderRadius: '8px',
        border: '1px solid #334155',
        marginBottom: '12px',
      }}
      data-testid="log-type-filter-bar"
    >
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginRight: '4px' }}>
        Separar por tipo:
      </span>
      {filterOptions.map((opt) => {
        const IconComponent = opt.icon;
        const isActive = currentFilter === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectFilter(opt.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              border: isActive ? `1px solid ${opt.color}` : '1px solid transparent',
              backgroundColor: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              color: isActive ? '#f8fafc' : '#94a3b8',
            }}
            data-testid={`filter-btn-${opt.id}`}
          >
            <IconComponent size={13} color={opt.color} />
            <span>{opt.label}</span>
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: isActive ? opt.color : '#334155',
                color: isActive ? '#0f172a' : '#cbd5e1',
                fontWeight: 700,
                minWidth: '18px',
                textAlign: 'center',
              }}
            >
              {opt.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
