import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, HelpCircle, Calendar, Sparkles, User, Award, Flame, History } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import PodiumCard from './PodiumCard';
import RankingTable from './RankingTable';
import GamificationRulesModal from './GamificationRulesModal';
import ClosedPeriodSelector from './ClosedPeriodSelector';

export default function GamificationRanking({ user }) {
  const { addToast } = useToast();
  const isAluno = user?.role === 'aluno';

  const [period, setPeriod] = useState('monthly'); // 'monthly' | 'all_time' | 'closed_month' | 'closed_year'
  const [rankingData, setRankingData] = useState(null);
  const [completedPeriods, setCompletedPeriods] = useState(null);
  const [selectedClosedKey, setSelectedClosedKey] = useState('');
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  const fetchCompletedPeriods = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/gamification/completed-periods', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setCompletedPeriods(data);
        return data;
      }
    } catch (err) {
      console.error('Erro ao buscar períodos finalizados:', err);
    }
    return null;
  }, []);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    try {
      if (period === 'monthly' || period === 'all_time') {
        const res = await fetch(`/api/v1/gamification/ranking?period=${period}`, {
          headers: getHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setRankingData(data);
        }
      } else if (period === 'closed_month' || period === 'closed_year') {
        const pType = period === 'closed_month' ? 'month' : 'year';
        let key = selectedClosedKey;

        // Se ainda não tiver chave selecionada, busca a primeira disponível
        if (!key) {
          let periods = completedPeriods;
          if (!periods) {
            periods = await fetchCompletedPeriods();
          }
          const list = pType === 'month' ? periods?.completed_months : periods?.completed_years;
          if (list && list.length > 0) {
            key = list[0].key;
            setSelectedClosedKey(key);
          }
        }

        if (key) {
          const res = await fetch(
            `/api/v1/gamification/closed-ranking?period_type=${pType}&period_key=${key}`,
            { headers: getHeaders() }
          );
          if (res.ok) {
            const data = await res.json();
            // Normaliza a resposta para a estrutura esperada pelo pódio e tabela
            setRankingData({
              period,
              month_name: data.period_label,
              ranking: data.top_students || [],
              my_position: data.my_position,
              total_participants: data.total_participants || 0,
              is_closed: true,
            });
          } else {
            const errJson = await res.json().catch(() => ({}));
            addToast(errJson.detail || 'Erro ao carregar histórico finalizado.', 'error');
          }
        } else {
          setRankingData({
            period,
            month_name: period === 'closed_month' ? 'Mês Anterior' : 'Ano Anterior',
            ranking: [],
            my_position: null,
            total_participants: 0,
            is_closed: true,
          });
        }
      }
    } catch (err) {
      console.error('Erro ao buscar ranking:', err);
      addToast('Erro ao carregar o ranking da comunidade.', 'error');
    } finally {
      setLoading(false);
    }
  }, [period, selectedClosedKey, completedPeriods, fetchCompletedPeriods, addToast]);

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/v1/gamification/rules', {
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setRules(data);
      }
    } catch (err) {
      console.error('Erro ao buscar regras:', err);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchCompletedPeriods();
  }, [fetchCompletedPeriods]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  const handleSelectPeriodMode = (newMode) => {
    if (newMode === period) return;
    setPeriod(newMode);
    setSelectedClosedKey(''); // Redefine para carregar o primeiro do modo
  };

  const ranking = rankingData?.ranking || [];
  const top1 = ranking.find((s) => s.rank === 1);
  const top2 = ranking.find((s) => s.rank === 2);
  const top3 = ranking.find((s) => s.rank === 3);
  const myPosition = rankingData?.my_position;
  const isClosedPeriod = period === 'closed_month' || period === 'closed_year';


  return (
    <div
      className="gamification-ranking-page"
      style={{
        padding: '28px 24px',
        maxWidth: '1280px',
        margin: '0 auto',
        color: '#f8fafc'
      }}
      data-testid="gamification-ranking-page"
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(217, 119, 6, 0.15))',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              padding: '12px',
              borderRadius: '16px',
              color: '#facc15'
            }}
          >
            <Trophy size={30} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Ranking da Comunidade</span>
              <span style={{ fontSize: '0.8rem', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#facc15', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                {rankingData?.month_name || 'Mensal'}
              </span>
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>
              Reconhecimento aos alunos mais engajados que ajudam colegas, respondem dúvidas e concluem aulas.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Seletor de Período */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '4px',
              display: 'flex',
              gap: '4px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => handleSelectPeriodMode('monthly')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: period === 'monthly' ? '#3b82f6' : 'transparent',
                color: period === 'monthly' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              data-testid="tab-period-monthly"
            >
              Ranking Mensal
            </button>
            <button
              type="button"
              onClick={() => handleSelectPeriodMode('all_time')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: period === 'all_time' ? '#3b82f6' : 'transparent',
                color: period === 'all_time' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              data-testid="tab-period-alltime"
            >
              Histórico Geral
            </button>
            <button
              type="button"
              onClick={() => handleSelectPeriodMode('closed_month')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: period === 'closed_month' ? '#3b82f6' : 'transparent',
                color: period === 'closed_month' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              data-testid="tab-period-closed-months"
            >
              Meses Anteriores (Top 10)
            </button>
            <button
              type="button"
              onClick={() => handleSelectPeriodMode('closed_year')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: period === 'closed_year' ? '#3b82f6' : 'transparent',
                color: period === 'closed_year' ? '#fff' : '#94a3b8',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              data-testid="tab-period-closed-years"
            >
              Anos Anteriores (Top 10)
            </button>
          </div>

          {/* Botão de Regras */}
          <button
            type="button"
            onClick={() => setIsRulesModalOpen(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              padding: '10px 16px',
              borderRadius: '12px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            data-testid="open-rules-modal-btn"
          >
            <HelpCircle size={16} />
            <span>Como Pontuar?</span>
          </button>
        </div>
      </div>

      {/* Banner / Seletor de Período Finalizado (Meses e Anos Fechados) */}
      {isClosedPeriod && (
        <ClosedPeriodSelector
          periodMode={period}
          completedPeriods={completedPeriods}
          selectedKey={selectedClosedKey}
          onChangeKey={(newKey) => setSelectedClosedKey(newKey)}
          periodLabel={rankingData?.month_name}
        />
      )}

      {/* Card "Sua Posição" se for Aluno */}
      {isAluno && myPosition && (
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15), rgba(15, 23, 42, 0.8))',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '16px',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.15)'
          }}
          data-testid="my-position-card"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: '#2563eb',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.3rem',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              #{myPosition.rank}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                {isClosedPeriod ? 'Seu Resultado Final no Período' : 'Sua Posição no Ranking'}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{myPosition.name}</span>
                <span style={{ fontSize: '0.8rem', color: '#facc15', fontWeight: 600 }}>
                  ({myPosition.badge})
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#facc15' }} data-testid="my-points-val">
                {myPosition.points.toLocaleString('pt-BR')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pontos</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#4ade80' }}>
                {myPosition.solutions_count}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Melhores Soluções</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#60a5fa' }}>
                {myPosition.lessons_completed_count}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Aulas Concluídas</div>
            </div>
          </div>
        </div>
      )}

      {/* Pódio dos Top 3 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          Carregando classificação do ranking...
        </div>
      ) : ranking.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            marginBottom: '32px'
          }}
          data-testid="empty-ranking"
        >
          <Trophy size={48} style={{ color: '#64748b', marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px 0', color: '#f8fafc', fontSize: '1.2rem' }}>
            {isClosedPeriod
              ? 'Nenhum aluno pontuou no período finalizado selecionado'
              : 'Nenhum ponto registrado ainda neste mês'}
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '0.9rem' }}>
            {isClosedPeriod
              ? 'O Top 10 fica congelado com as pontuações conquistadas até o encerramento do período.'
              : 'Comece a responder dúvidas no suporte ou assistir às suas aulas para inaugurar o pódio!'}
          </p>
        </div>
      ) : (
        <>
          <div
            className="podium-container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: '20px',
              flexWrap: 'wrap',
              marginBottom: '40px',
              paddingTop: '20px'
            }}
            data-testid="podium-section"
          >
            {top2 && <PodiumCard student={top2} position={2} />}
            {top1 && <PodiumCard student={top1} position={1} />}
            {top3 && <PodiumCard student={top3} position={3} />}
          </div>

          {/* Tabela com a lista completa */}
          <div style={{ marginTop: '20px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>
                {isClosedPeriod ? 'Classificação Final (Top 10 Campeões)' : 'Tabela Geral de Classificação'}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>
                ({ranking.length} alunos {isClosedPeriod ? 'no Top 10' : 'pontuando'})
              </span>
            </h2>
            <RankingTable students={ranking} />
          </div>
        </>
      )}

      {/* Modal de Regras */}
      <GamificationRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        rules={rules}
      />
    </div>
  );
}
