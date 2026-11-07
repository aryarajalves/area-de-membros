import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import TutorTopLessonsList from './TutorTopLessonsList';
import TutorNegativeFeedbacksList from './TutorNegativeFeedbacksList';

export default function TutorInsightsAnalyticsCard({
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  cardBg = 'rgba(255, 255, 255, 0.04)',
  cardBorder = '1px solid rgba(255, 255, 255, 0.1)'
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    total_questions: 0,
    total_likes: 0,
    total_dislikes: 0,
    satisfaction_rate: 100.0,
    top_questioned_lessons: [],
    recent_negative_feedbacks: []
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/tutor-ia/analytics/insights', {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Erro ao carregar insights do Tutor IA:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const innerCardBg = isLightBg ? '#ffffff' : 'rgba(2, 6, 23, 0.6)';
  const innerCardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)';

  return (
    <div
      data-testid="tutor-insights-analytics-card"
      style={{
        backgroundColor: cardBg,
        border: cardBorder,
        borderRadius: '14px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        marginTop: '8px'
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
              flexShrink: 0
            }}
          >
            <BarChart3 size={22} />
          </div>
          <div>
            <h4
              style={{
                margin: 0,
                fontSize: '16px',
                fontWeight: 700,
                color: textColor,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>Painel de Dúvidas & Feedback Pedagógico</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                Inteligência da Turma
              </span>
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: subTextColor }}>
              Identifique aulas com alta concentração de dúvidas e analise motivos de feedbacks negativos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInsights}
          disabled={loading}
          data-testid="btn-refresh-tutor-insights"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)',
            border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.12)',
            color: textColor,
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Grid de KPIs / Métricas Principais */}
      <div
        data-testid="tutor-insights-kpis-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px'
        }}
      >
        {/* KPI 1: Total de Dúvidas Feitas */}
        <div
          style={{
            backgroundColor: innerCardBg,
            border: innerCardBorder,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: subTextColor }}>Total de Perguntas</span>
            <HelpCircle size={16} color="#a855f7" />
          </div>
          <span style={{ fontSize: '24px', fontWeight: 700, color: textColor }} data-testid="kpi-total-questions">
            {loading ? '...' : data.total_questions}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Perguntas enviadas por alunos</span>
        </div>

        {/* KPI 2: Taxa de Satisfação */}
        <div
          style={{
            backgroundColor: innerCardBg,
            border: innerCardBorder,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: subTextColor }}>Taxa de Satisfação</span>
            <Sparkles size={16} color="#10b981" />
          </div>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: data.satisfaction_rate >= 80 ? '#10b981' : '#f97316'
            }}
            data-testid="kpi-satisfaction-rate"
          >
            {loading ? '...' : `${data.satisfaction_rate}%`}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Aprovação nas respostas dadas</span>
        </div>

        {/* KPI 3: Avaliações Úteis (Likes) */}
        <div
          style={{
            backgroundColor: innerCardBg,
            border: innerCardBorder,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: subTextColor }}>Respostas Úteis</span>
            <ThumbsUp size={16} color="#10b981" />
          </div>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }} data-testid="kpi-total-likes">
            {loading ? '...' : data.total_likes}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Alunos avaliaram como útil</span>
        </div>

        {/* KPI 4: Pontos de Atenção (Dislikes) */}
        <div
          style={{
            backgroundColor: innerCardBg,
            border: innerCardBorder,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: subTextColor }}>Pontos de Atenção</span>
            <ThumbsDown size={16} color="#f97316" />
          </div>
          <span style={{ fontSize: '24px', fontWeight: 700, color: '#f97316' }} data-testid="kpi-total-dislikes">
            {loading ? '...' : data.total_dislikes}
          </span>
          <span style={{ fontSize: '11px', color: subTextColor }}>Avaliações negativas registradas</span>
        </div>
      </div>

      {/* Seção 1: Ranking das Aulas com Maior Número de Dúvidas */}
      <TutorTopLessonsList
        topLessons={data.top_questioned_lessons}
        textColor={textColor}
        subTextColor={subTextColor}
        innerCardBg={innerCardBg}
        innerCardBorder={innerCardBorder}
      />

      {/* Seção 2: Feedbacks Negativos dos Alunos com Motivos */}
      <TutorNegativeFeedbacksList
        feedbacks={data.recent_negative_feedbacks}
        textColor={textColor}
        subTextColor={subTextColor}
        innerCardBg={innerCardBg}
        innerCardBorder={innerCardBorder}
      />
    </div>
  );
}
