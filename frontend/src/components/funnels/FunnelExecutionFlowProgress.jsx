import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  User,
  Activity,
} from 'lucide-react';

export default function FunnelExecutionFlowProgress({
  execution,
  flowNodes = [],
  onSelectAnotherExecution,
}) {
  const [activeFunnelsForContact, setActiveFunnelsForContact] = useState([]);
  const [loadingActiveFunnels, setLoadingActiveFunnels] = useState(false);

  useEffect(() => {
    if (!execution?.user_id) return;
    let isMounted = true;
    const fetchActiveFunnels = async () => {
      setLoadingActiveFunnels(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`/api/v1/funnels/contacts/${execution.user_id}/active-funnels`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const list = await res.json();
          if (isMounted) setActiveFunnelsForContact(Array.isArray(list) ? list : []);
        }
      } catch {
        /* fallback silencioso */
      } finally {
        if (isMounted) setLoadingActiveFunnels(false);
      }
    };
    fetchActiveFunnels();
    return () => {
      isMounted = false;
    };
  }, [execution?.user_id]);

  if (!execution) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: '#64748b',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}
        data-testid="no-execution-selected"
      >
        <Layers size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Selecione uma execução à esquerda para visualizar até onde o contato avançou no fluxo.
        </p>
      </div>
    );
  }

  const visitedSet = new Set(execution.visited_nodes || []);
  const currentNodeId = execution.current_node_id;

  const formatDateBrasilia = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    } catch {
      return dateStr;
    }
  };

  const getNodeTypeName = (type) => {
    switch (type) {
      case 'trigger':
      case 'trigger_course_interest':
        return 'Gatilho Inicial';
      case 'message':
        return 'Mensagem';
      case 'delay':
        return 'Tempo de Espera (Delay)';
      case 'tag':
        return 'Atribuir Tag';
      case 'audio':
        return 'Áudio';
      case 'media':
        return 'Mídia / Imagem';
      default:
        return 'Passo do Fluxo';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: '100%',
        overflowY: 'auto',
        paddingRight: '6px',
      }}
      data-testid="funnel-execution-flow-progress"
    >
      {/* Card do Contato Selecionado */}
      <div
        style={{
          padding: '14px 16px',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              fontWeight: 700,
              border: '1px solid rgba(139, 92, 246, 0.4)',
            }}
          >
            {execution.student_avatar ? (
              <img
                src={execution.student_avatar}
                alt=""
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <User size={18} />
            )}
          </div>
          <div>
            <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
              {execution.student_name}
            </div>
            {execution.student_email && (
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {execution.student_email}
              </div>
            )}
          </div>
        </div>

        {/* Badge de Status da Execução */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              backgroundColor:
                execution.status === 'running'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : execution.status === 'failed'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(16, 185, 129, 0.15)',
              color:
                execution.status === 'running'
                  ? '#fbbf24'
                  : execution.status === 'failed'
                  ? '#f87171'
                  : '#34d399',
              border: `1px solid ${
                execution.status === 'running'
                  ? 'rgba(245, 158, 11, 0.35)'
                  : execution.status === 'failed'
                  ? 'rgba(239, 68, 68, 0.35)'
                  : 'rgba(16, 185, 129, 0.35)'
              }`,
            }}
            data-testid="execution-status-badge"
          >
            {execution.status === 'running' ? (
              <>
                <Clock size={12} />
                <span>Ativo Agora</span>
              </>
            ) : execution.status === 'failed' ? (
              <>
                <AlertCircle size={12} />
                <span>Falha</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={12} />
                <span>Concluído</span>
              </>
            )}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            Início: {formatDateBrasilia(execution.started_at)}
          </span>
        </div>
      </div>

      {/* Renderização da Esteira do Funil (Até onde o contato foi) */}
      <div>
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#c084fc',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px',
          }}
        >
          <Activity size={15} />
          <span>Progresso do Contato no Funil</span>
        </div>

        {flowNodes.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.8rem' }}>Nenhum nó configurado neste funil.</p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              backgroundColor: '#0a0514',
              border: '1px solid rgba(168, 85, 247, 0.25)',
              borderRadius: '12px',
              padding: '16px',
            }}
            data-testid="funnel-progress-pipeline"
          >
            {flowNodes.map((node, index) => {
              const isVisited = visitedSet.has(node.id);
              const isCurrent = currentNodeId === node.id;
              const isPending = !isVisited && !isCurrent;

              let borderColor = 'rgba(255, 255, 255, 0.1)';
              let bgColor = '#0f172a';
              let badgeColor = '#64748b';
              let badgeBg = 'rgba(255, 255, 255, 0.05)';
              let statusLabel = 'Aguardando';

              if (isCurrent && execution.status === 'running') {
                borderColor = '#f59e0b';
                bgColor = 'rgba(245, 158, 11, 0.08)';
                badgeColor = '#fbbf24';
                badgeBg = 'rgba(245, 158, 11, 0.2)';
                statusLabel = 'Nó Ativo Agora';
              } else if (isVisited) {
                borderColor = '#10b981';
                bgColor = 'rgba(16, 185, 129, 0.06)';
                badgeColor = '#34d399';
                badgeBg = 'rgba(16, 185, 129, 0.15)';
                statusLabel = 'Percorrido';
              }

              return (
                <div key={node.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: bgColor,
                      border: `1px solid ${borderColor}`,
                      opacity: isPending ? 0.55 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    data-testid={`progress-node-${node.id}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          backgroundColor: badgeBg,
                          color: badgeColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {isVisited ? (
                          <CheckCircle2 size={15} color="#34d399" />
                        ) : isCurrent && execution.status === 'running' ? (
                          <Clock size={15} color="#fbbf24" />
                        ) : (
                          index + 1
                        )}
                      </div>

                      <div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                          {getNodeTypeName(node.type)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          {node.data?.text
                            ? `"${node.data.text.slice(0, 45)}${node.data.text.length > 45 ? '...' : ''}"`
                            : node.data?.delay_seconds
                            ? `Espera de ${node.data.delay_seconds} segundos`
                            : node.data?.tag_name
                            ? `Tag: ${node.data.tag_name}`
                            : `ID: ${node.id}`}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        border: `1px solid ${borderColor}`,
                      }}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  {index < flowNodes.length - 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', margin: '3px 0' }}>
                      <div
                        style={{
                          width: '2px',
                          height: '10px',
                          backgroundColor: isVisited ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seção: Outros Funis em Andamento para este Contato */}
      <div
        style={{
          marginTop: '6px',
          padding: '14px',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
        data-testid="active-funnels-for-contact-section"
      >
        <div
          style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#a78bfa',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '8px',
          }}
        >
          <Zap size={14} color="#f59e0b" />
          <span>Funis ativos e histórico recente deste contato ({activeFunnelsForContact.length})</span>
        </div>

        {loadingActiveFunnels ? (
          <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>Carregando funis do contato...</p>
        ) : activeFunnelsForContact.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.75rem', margin: 0 }}>
            Nenhum outro funil em andamento para este aluno.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {activeFunnelsForContact.map((af) => (
              <div
                key={af.execution_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: af.status === 'running' ? '#f59e0b' : '#10b981',
                    }}
                  />
                  <span style={{ fontWeight: 600, color: '#f8fafc' }}>{af.funnel_name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: '#94a3b8' }}>
                    Progresso: {af.progress_percentage}% ({af.visited_nodes_count}/{af.total_nodes_count} nós)
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: af.status === 'running' ? '#fbbf24' : '#34d399',
                    }}
                  >
                    {af.status === 'running' ? 'Em andamento' : 'Concluído'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logs Textuais da Execução */}
      {execution.logs && (
        <div
          style={{
            padding: '12px 14px',
            backgroundColor: '#070b14',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            fontSize: '0.72rem',
            color: '#94a3b8',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            maxHeight: '120px',
            overflowY: 'auto',
          }}
          data-testid="execution-logs"
        >
          <div style={{ fontWeight: 700, color: '#cbd5e1', marginBottom: '4px' }}>
            Logs da Execução:
          </div>
          {execution.logs}
        </div>
      )}
    </div>
  );
}
