import React from 'react';
import { Database, Clock, Server, Layers, HardDrive } from 'lucide-react';

export default function InfrastructureDatabaseTab({ database }) {
  if (!database) return null;

  const getStatusBadge = (status) => {
    if (status === 'Crítico') {
      return { bg: 'rgba(239, 68, 68, 0.2)', text: '#f87171', border: 'rgba(239, 68, 68, 0.4)' };
    }
    if (status === 'Atenção') {
      return { bg: 'rgba(245, 158, 11, 0.2)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.4)' };
    }
    return { bg: 'rgba(16, 185, 129, 0.2)', text: '#34d399', border: 'rgba(16, 185, 129, 0.4)' };
  };

  const poolBadge = getStatusBadge(database.status);

  // Cálculos consolidados do projeto
  const projectActive = database.project_active_connections ?? database.active_connections;
  const projectIdle = database.project_idle_connections ?? database.idle_connections;
  const projectTotal = database.project_total_open ?? (projectActive + projectIdle);
  const projectMax = database.project_max_connections ?? database.pool_capacity;
  const workers = database.workers_count || 4;
  const basePerWorker = database.pool_base_per_worker || database.pool_base || 30;
  const overflowPerWorker = database.overflow_per_worker || database.overflow_reserve || 20;

  return (
    <div className="infra-tab-content" data-testid="infra-database-tab" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Grade de 3 Cards Superiores com Glassmorphism (Foco no Projeto) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Card 1: Conexões em Uso Agora */}
        <div
          className="infra-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Database size={18} color="#60a5fa" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Conexões em Uso Agora</span>
              </div>
              <span
                style={{
                  background: poolBadge.bg,
                  color: poolBadge.text,
                  border: `1px solid ${poolBadge.border}`,
                  padding: '3px 11px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                }}
              >
                ● {database.status}
              </span>
            </div>

            <div style={{ fontSize: '25px', fontWeight: 800, color: '#f8fafc', marginBottom: '14px' }}>
              {projectActive}{' '}
              <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 500 }}>/ {projectMax}</span>{' '}
              <span style={{ fontSize: '16px', color: '#38bdf8', fontWeight: 700 }}>({database.occupancy_pct}%)</span>
            </div>

            {/* Barra de Progresso */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <div
                style={{
                  width: `${Math.min(100, database.occupancy_pct)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563eb, #38bdf8)',
                  borderRadius: '10px',
                  boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '12px' }}>
            <span>{projectIdle} conexões em standby no pool ({projectTotal} abertas no projeto).</span>
          </div>
        </div>

        {/* Card 2: Maior Pico Registrado Hoje */}
        <div
          className="infra-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Clock size={18} color="#34d399" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Maior Pico Registrado Hoje</span>
              </div>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  padding: '3px 11px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                }}
              >
                ✓ Pico Seguro
              </span>
            </div>

            <div style={{ fontSize: '25px', fontWeight: 800, color: '#f8fafc', marginBottom: '14px' }}>
              {database.peak_connections_today}{' '}
              <span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 500 }}>/ {projectMax}</span>{' '}
              <span style={{ fontSize: '16px', color: '#34d399', fontWeight: 700 }}>({database.peak_pct_today}%)</span>
            </div>

            {/* Barra de Progresso */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden', marginBottom: '14px' }}>
              <div
                style={{
                  width: `${Math.min(100, database.peak_pct_today)}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #059669, #34d399)',
                  borderRadius: '10px',
                  boxShadow: '0 0 10px rgba(52, 211, 153, 0.4)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '12px' }}>
            <span>Horário do pico: <strong style={{ color: '#f8fafc' }}>{database.peak_time_today}</strong></span>
          </div>
        </div>

        {/* Card 3: Capacidade do Projeto */}
        <div
          className="infra-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '16px' }}>
            <Server size={18} color="#94a3b8" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Capacidade do Projeto (Pool)</span>
          </div>

          <div>
            <div style={{ fontSize: '25px', fontWeight: 800, color: '#f8fafc', marginBottom: '10px' }}>
              {projectMax}{' '}
              <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>conexões simultâneas máx</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
              <div>• Workers Uvicorn: <strong style={{ color: '#f8fafc' }}>{workers} workers ativos</strong></div>
              <div>• Pool Base: <strong style={{ color: '#f8fafc' }}>{basePerWorker * workers} conexões ({basePerWorker}/worker)</strong></div>
              <div>• Overflow Reserva: <strong style={{ color: '#f8fafc' }}>+{overflowPerWorker * workers} temporárias (+{overflowPerWorker}/worker)</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção Inferior: Servidor PostgreSQL Global & Armazenamento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Card Conexões Globais do PostgreSQL */}
        <div
          className="infra-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <Layers size={18} color="#a78bfa" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Conexões Globais do PostgreSQL</span>
              </div>
              <span
                style={{
                  background: 'rgba(167, 139, 250, 0.2)',
                  color: '#c4b5fd',
                  border: '1px solid rgba(167, 139, 250, 0.35)',
                  padding: '3px 11px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                }}
              >
                Todos os Serviços
              </span>
            </div>

            <div style={{ fontSize: '25px', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
              {database.global_connections_total ?? projectTotal}{' '}
              <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>conexões abertas no servidor</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
              <div>• Ativas executando queries: <strong style={{ color: '#38bdf8' }}>{database.global_active_connections ?? projectActive} conexões</strong></div>
              <div>• Ociosas em standby: <strong style={{ color: '#94a3b8' }}>{database.global_idle_connections ?? projectIdle} conexões</strong></div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '12px', marginTop: '14px' }}>
            <span>Soma de todos os serviços conectados ao PostgreSQL. Teto configurado na stack: <strong style={{ color: '#f8fafc' }}>{database.postgres_max_connections || 500} conexões</strong>.</span>
          </div>
        </div>

        {/* Card Armazenamento e Tamanho do Banco no Disco */}
        <div
          className="infra-card"
          style={{
            background: 'rgba(15, 23, 42, 0.75)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.09)',
            padding: '22px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <HardDrive size={18} color="#f59e0b" />
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#cbd5e1' }}>Tamanho do Banco no Disco</span>
              </div>
              <span
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  padding: '3px 11px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                }}
              >
                Armazenamento
              </span>
            </div>

            <div style={{ fontSize: '25px', fontWeight: 800, color: '#f8fafc', marginBottom: '12px' }}>
              {database.database_size_pretty || 'N/A'}{' '}
              <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 500 }}>(Área de Membros)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#cbd5e1' }}>
              <div>• Banco deste projeto: <strong style={{ color: '#f8fafc' }}>{database.database_size_pretty || 'N/A'}</strong></div>
              <div>• Total do Cluster (Todos os Bancos): <strong style={{ color: '#f59e0b' }}>{database.cluster_size_pretty || database.database_size_pretty || 'N/A'}</strong></div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.07)', paddingTop: '12px', marginTop: '14px' }}>
            <span>Espaço em disco ocupado pelas tabelas, índices e dados gravados no volume persistente do banco.</span>
          </div>
        </div>
      </div>

      {/* Histórico de Picos por Hora */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          padding: '22px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <Clock size={18} color="#60a5fa" />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>Histórico de Picos por Hora (Horário de Brasília)</h4>
          </div>
          <span style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>
            Últimas 24 Horas
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Período / Hora (Brasília)</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Pico de Conexões</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Ocupação (%)</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {database.history_24h && database.history_24h.length > 0 ? (
                database.history_24h.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', color: '#f8fafc' }}>
                    <td style={{ padding: '13px 14px', fontWeight: 500 }}>{item.period}</td>
                    <td style={{ padding: '13px 14px', color: '#cbd5e1' }}>{item.peak_connections} ativas</td>
                    <td style={{ padding: '13px 14px', fontWeight: 700, color: '#38bdf8' }}>{item.occupancy_pct}%</td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{ color: '#34d399', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 10px', borderRadius: '6px', fontSize: '11.5px' }}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Nenhum histórico registrado até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
