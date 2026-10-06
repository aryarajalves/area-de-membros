import React from 'react';
import { Calendar, History, Award, CheckCircle2 } from 'lucide-react';

export default function ClosedPeriodSelector({
  periodMode,
  completedPeriods,
  selectedKey,
  onChangeKey,
  periodLabel,
}) {
  const isMonth = periodMode === 'closed_month';
  const options = isMonth
    ? completedPeriods?.completed_months || []
    : completedPeriods?.completed_years || [];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        padding: '14px 20px',
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(234, 179, 8, 0.25)',
        borderRadius: '14px',
        marginBottom: '24px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
      }}
      data-testid="closed-period-selector-banner"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(234, 179, 8, 0.15)',
            color: '#facc15',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(234, 179, 8, 0.3)',
          }}
        >
          <Award size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#f8fafc' }}>
              Top 10 Finalizado • {periodLabel || (isMonth ? 'Mês Anterior' : 'Ano Anterior')}
            </span>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <CheckCircle2 size={11} />
              Encerrado
            </span>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8' }}>
            {isMonth
              ? 'Exibindo a classificação final congelada dos 10 melhores alunos do mês selecionado.'
              : 'Exibindo a classificação final congelada dos 10 melhores alunos do ano selecionado.'}
          </p>
        </div>
      </div>

      {/* Dropdown de Seleção de Período Fechado */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label
          htmlFor="closed-period-select"
          style={{ fontSize: '12.5px', fontWeight: 600, color: '#cbd5e1' }}
        >
          {isMonth ? 'Mês:' : 'Ano:'}
        </label>
        <select
          id="closed-period-select"
          value={selectedKey || ''}
          onChange={(e) => onChangeKey(e.target.value)}
          style={{
            padding: '8px 14px',
            backgroundColor: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '10px',
            color: '#f8fafc',
            fontSize: '13px',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
          }}
          data-testid="closed-period-select"
        >
          {options.length === 0 ? (
            <option value="">Nenhum período encerrado</option>
          ) : (
            options.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))
          )}
        </select>
      </div>
    </div>
  );
}
