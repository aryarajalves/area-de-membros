import React from 'react';
import { DollarSign, Calendar, MessageSquare, Zap } from 'lucide-react';

export default function TutorFinancialMetricsCards({
  financialSummary,
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)'
}) {
  const summary = financialSummary || {
    total_spent_brl: 0.0,
    total_spent_this_month_brl: 0.0,
    total_questions: 0,
    avg_cost_per_question: 0.0,
    top_spenders: []
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 4 Cards de Métricas Financeiras */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}
      >
        <div
          data-testid="card-financial-total"
          style={{
            backgroundColor: cardBg,
            border: cardBorder,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: subTextColor, fontWeight: 600 }}>Custo Total Acumulado</span>
            <DollarSign size={16} color="#10b981" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>
            R$ {summary.total_spent_brl.toFixed(4).replace('.', ',')}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Total gasto em API desde o início</span>
        </div>

        <div
          data-testid="card-financial-month"
          style={{
            backgroundColor: cardBg,
            border: cardBorder,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: subTextColor, fontWeight: 600 }}>Gasto Este Mês</span>
            <Calendar size={16} color="#3b82f6" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#3b82f6' }}>
            R$ {summary.total_spent_this_month_brl.toFixed(4).replace('.', ',')}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Consumo no ciclo mensal corrente</span>
        </div>

        <div
          data-testid="card-financial-questions"
          style={{
            backgroundColor: cardBg,
            border: cardBorder,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: subTextColor, fontWeight: 600 }}>Total de Perguntas</span>
            <MessageSquare size={16} color="#a855f7" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#a855f7' }}>
            {summary.total_questions}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Dúvidas enviadas por alunos</span>
        </div>

        <div
          data-testid="card-financial-avg"
          style={{
            backgroundColor: cardBg,
            border: cardBorder,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: subTextColor, fontWeight: 600 }}>Custo Médio / Pergunta</span>
            <Zap size={16} color="#f59e0b" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: '#f59e0b' }}>
            R$ {summary.avg_cost_per_question.toFixed(4).replace('.', ',')}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Média por resposta gerada</span>
        </div>
      </div>

      {/* Top Alunos com Maior Consumo */}
      {summary.top_spenders && summary.top_spenders.length > 0 && (
        <div
          data-testid="tutor-top-spenders-box"
          style={{
            backgroundColor: cardBg,
            border: cardBorder,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 700, color: textColor }}>
            🏆 Top Alunos com Maior Consumo de IA:
          </span>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {summary.top_spenders.map((s, idx) => (
              <div
                key={s.student_id}
                style={{
                  minWidth: '180px',
                  backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.06)'}`,
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#a855f7' }}>#{idx + 1}</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: textColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.student_name}
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: subTextColor, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.student_email}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px' }}>
                  <span style={{ color: subTextColor }}>{s.total_messages} msgs</span>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>R$ {s.total_cost_brl.toFixed(4)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
