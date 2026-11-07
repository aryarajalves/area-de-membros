import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, MessageSquare, Zap, RefreshCw, TrendingUp, Users, Award } from 'lucide-react';

export default function TutorFinancialTab({
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)'
}) {
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState({
    total_spent_brl: 0.0,
    total_spent_this_month_brl: 0.0,
    total_questions: 0,
    avg_cost_per_question: 0.0,
    active_subscribers: 0,
    monthly_price_brl: 10.0,
    estimated_monthly_revenue: 0.0,
    estimated_monthly_profit: 0.0,
    top_spenders: []
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchFinancials = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/tutor-ia/admin/messages?limit=1', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        if (json.financial_summary) {
          setFinancialData(json.financial_summary);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados financeiros do Tutor IA:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  return (
    <div
      data-testid="tutor-financial-tab"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: textColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={20} color="#10b981" />
            <span>Painel Financeiro & Custos de API</span>
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: subTextColor }}>
            Controle os gastos de inteligência artificial em Reais (BRL), receita estimada e maiores consumidores.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchFinancials}
          disabled={loading}
          data-testid="btn-refresh-financial"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
            border: `1px solid ${isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)'}`,
            color: textColor,
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* 4 Cards de Métricas de Custos de API */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}
      >
        <div
          data-testid="card-fin-total-spent"
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
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#10b981' }}>
            R$ {(financialData.total_spent_brl || 0).toFixed(4).replace('.', ',')}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Total gasto em API desde a ativação</span>
        </div>

        <div
          data-testid="card-fin-month-spent"
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
            <span style={{ fontSize: '12px', color: subTextColor, fontWeight: 600 }}>Gasto no Mês Atual</span>
            <Calendar size={16} color="#3b82f6" />
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#3b82f6' }}>
            R$ {(financialData.total_spent_this_month_brl || 0).toFixed(4).replace('.', ',')}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Consumo no ciclo mensal corrente</span>
        </div>

        <div
          data-testid="card-fin-total-questions"
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
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#a855f7' }}>
            {financialData.total_questions}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Dúvidas respondidas aos alunos</span>
        </div>

        <div
          data-testid="card-fin-avg-cost"
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
          <span style={{ fontSize: '22px', fontWeight: 800, color: '#f59e0b' }}>
            R$ {(financialData.avg_cost_per_question || 0).toFixed(4).replace('.', ',')}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Média de custo por resposta gerada</span>
        </div>
      </div>

      {/* Card de Projeção de Lucratividade & Assinaturas */}
      <div
        data-testid="card-fin-profitability"
        style={{
          backgroundColor: cardBg,
          border: cardBorder,
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="#10b981" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>
            Projeção de Lucratividade & Assinaturas do Tutor IA:
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px'
          }}
        >
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)', border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)'}` }}>
            <span style={{ fontSize: '11.5px', color: subTextColor }}>Assinantes Ativos</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: textColor, marginTop: '2px' }}>
              {financialData.active_subscribers} alunos
            </div>
            <span style={{ fontSize: '10.5px', color: subTextColor }}>Preço: R$ {(financialData.monthly_price_brl || 10).toFixed(2)}/mês</span>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)', border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)'}` }}>
            <span style={{ fontSize: '11.5px', color: subTextColor }}>Receita Mensal Bruta</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
              R$ {(financialData.estimated_monthly_revenue || 0).toFixed(2).replace('.', ',')}
            </div>
            <span style={{ fontSize: '10.5px', color: subTextColor }}>Total bruto de assinaturas</span>
          </div>

          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)', border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)'}` }}>
            <span style={{ fontSize: '11.5px', color: subTextColor }}>Lucro Mensal Líquido Estimado</span>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#3b82f6', marginTop: '2px' }}>
              R$ {(financialData.estimated_monthly_profit || 0).toFixed(2).replace('.', ',')}
            </div>
            <span style={{ fontSize: '10.5px', color: subTextColor }}>Receita menos custos de API do mês</span>
          </div>
        </div>
      </div>

      {/* Ranking de Top Consumidores de IA */}
      <div
        data-testid="table-fin-top-spenders"
        style={{
          backgroundColor: cardBg,
          border: cardBorder,
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Award size={18} color="#f59e0b" />
          <span style={{ fontSize: '14px', fontWeight: 700, color: textColor }}>
            Ranking: Alunos que Mais Consumiram Custos de IA:
          </span>
        </div>

        {financialData.top_spenders && financialData.top_spenders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {financialData.top_spenders.map((s, idx) => (
              <div
                key={s.student_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#a855f7' }}>
                    #{idx + 1}
                  </span>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 700, color: textColor }}>
                      {s.student_name}
                    </div>
                    <div style={{ fontSize: '11.5px', color: subTextColor }}>
                      {s.student_email}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11.5px', color: subTextColor }}>Perguntas</div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: textColor }}>{s.total_messages}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11.5px', color: subTextColor }}>Custo Total</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>
                      R$ {s.total_cost_brl.toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: subTextColor, fontSize: '13px' }}>
            Nenhum consumo registrado ainda.
          </div>
        )}
      </div>
    </div>
  );
}
