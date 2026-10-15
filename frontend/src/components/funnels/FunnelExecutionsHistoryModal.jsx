import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  Filter,
  RefreshCw,
} from 'lucide-react';
import FunnelExecutionFlowProgress from './FunnelExecutionFlowProgress';

export default function FunnelExecutionsHistoryModal({
  isOpen,
  funnelId,
  funnelName = '',
  onClose,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedExecutionId, setSelectedExecutionId] = useState(null);

  const fetchExecutions = useCallback(async () => {
    if (!funnelId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/funnels/${funnelId}/executions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setSelectedExecutionId((prev) => prev || json.executions?.[0]?.id || null);
      }
    } catch {
      /* fallback silencioso */
    } finally {
      setLoading(false);
    }
  }, [funnelId]);

  useEffect(() => {
    if (isOpen) {
      fetchExecutions();
    }
  }, [isOpen, fetchExecutions]);

  if (!isOpen) return null;

  const executions = data?.executions || [];
  const filteredExecutions = executions.filter((ex) => {
    const matchesSearch =
      ex.student_name?.toLowerCase().includes(search.toLowerCase().trim()) ||
      ex.student_email?.toLowerCase().includes(search.toLowerCase().trim());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'running' && ex.status === 'running') ||
      (statusFilter === 'completed' && ex.status === 'completed');
    return matchesSearch && matchesStatus;
  });

  const selectedExecution =
    executions.find((e) => e.id === selectedExecutionId) ||
    filteredExecutions[0] ||
    null;

  const formatDateBrasilia = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '16px',
      }}
      data-testid="funnel-executions-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '84vh',
          maxHeight: '820px',
          backgroundColor: '#0d1322',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
        data-testid="funnel-executions-modal"
      >
        {/* Top Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0a0f1d',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <History size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                Histórico de Execuções do Funil
              </h2>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Funil: <strong style={{ color: '#e9d5ff' }}>{funnelName || data?.funnel_name}</strong>
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                }}
              >
                {data?.total_executions || 0} execuções
              </span>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                {data?.running_count || 0} rodando agora
              </span>
            </div>

            <button
              type="button"
              onClick={fetchExecutions}
              title="Atualizar"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
              }}
              data-testid="refresh-executions-btn"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Fechar"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
              }}
              data-testid="close-executions-modal-btn"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body com Master-Detail */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          {/* Lado Esquerdo: Lista de Execuções e Filtros */}
          <div
            style={{
              width: '38%',
              minWidth: '290px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#0a0d18',
            }}
          >
            {/* Filtros de Busca */}
            <div style={{ padding: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar contato (nome, e-mail)..."
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '7px 10px 7px 30px',
                    borderRadius: '6px',
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    fontSize: '0.78rem',
                    outline: 'none',
                  }}
                  data-testid="search-executions-input"
                />
                <Search
                  size={14}
                  style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}
                />
              </div>

              {/* Filtro Rápido por Status */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'running', label: 'Rodando Agora' },
                  { id: 'completed', label: 'Concluídos' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusFilter(st.id)}
                    style={{
                      flex: 1,
                      padding: '4px 6px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border:
                        statusFilter === st.id
                          ? '1px solid #8b5cf6'
                          : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor:
                        statusFilter === st.id ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                      color: statusFilter === st.id ? '#c084fc' : '#94a3b8',
                    }}
                    data-testid={`filter-status-${st.id}`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista com Scroll */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {loading && executions.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                  Carregando histórico...
                </div>
              ) : filteredExecutions.length === 0 ? (
                <div style={{ padding: '30px 16px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                  Nenhuma execução encontrada para os filtros aplicados.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {filteredExecutions.map((item) => {
                    const isSelected = selectedExecution?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedExecutionId(item.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : '#0f172a',
                          border: isSelected
                            ? '1px solid #8b5cf6'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                          transition: 'all 0.15s ease',
                        }}
                        data-testid={`execution-item-${item.id}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: isSelected ? '#e9d5ff' : '#f8fafc' }}>
                            {item.student_name}
                          </span>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: item.status === 'running' ? '#fbbf24' : '#34d399',
                            }}
                          >
                            {item.status === 'running' ? 'Rodando' : 'Concluído'}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {formatDateBrasilia(item.started_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Visualização do Progresso e Rastreamento */}
          <div style={{ flex: 1, padding: '20px', minHeight: 0, backgroundColor: '#090d17' }}>
            <FunnelExecutionFlowProgress
              execution={selectedExecution}
              flowNodes={data?.flow_nodes || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
