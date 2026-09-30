import React, { useState, useEffect } from 'react';
import { History, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight, X, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function IntegrationLogsModal({ isOpen, onClose, webhook }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && webhook) {
      setLoading(true);
      setExpandedLogId(null);
      const token = localStorage.getItem('auth_token');
      fetch(`/api/v1/integrations/${webhook.id}/logs?limit=50`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((res) => {
          if (!res.ok) throw new Error('Falha ao carregar histórico de disparos.');
          return res.json();
        })
        .then((data) => setLogs(Array.isArray(data) ? data : []))
        .catch((err) => {
          addToast(err.message, 'error');
          setLogs([]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, webhook, addToast]);

  if (!isOpen || !webhook) return null;

  const toggleExpand = (id) => {
    setExpandedLogId((prev) => (prev === id ? null : id));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
      data-testid="integration-logs-modal-overlay"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          color: '#f8fafc',
          padding: '24px',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-logs-modal-title"
        data-testid="integration-logs-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Topo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <History size={20} />
          </div>
          <div>
            <h2 id="integration-logs-modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
              Histórico de Disparos
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
              Integração: <strong style={{ color: '#f8fafc' }}>{webhook.name}</strong> • {webhook.url}
            </p>
          </div>
        </div>

        {/* Lista de Logs */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '18px', paddingRight: '4px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <Loader2 size={24} className="animate-spin" style={{ marginRight: '8px' }} />
              Carregando histórico...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: '0.88rem' }}>
              Nenhum disparo registrado para este webhook ainda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const formattedDate = new Date(log.created_at).toLocaleString('pt-BR');
                return (
                  <div
                    key={log.id}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => toggleExpand(log.id)}
                    data-testid={`log-item-${log.id}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {log.success ? (
                          <CheckCircle2 size={18} style={{ color: '#34d399', flexShrink: 0 }} />
                        ) : (
                          <AlertTriangle size={18} style={{ color: '#f87171', flexShrink: 0 }} />
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontSize: '0.74rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                backgroundColor: log.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: log.success ? '#34d399' : '#f87171',
                              }}
                            >
                              {log.response_status ? `HTTP ${log.response_status}` : 'FALHA'}
                            </span>
                            <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#f8fafc' }}>
                              {log.event}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
                            {formattedDate}
                          </div>
                        </div>
                      </div>

                      <div style={{ color: '#94a3b8' }}>
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </div>
                    </div>

                    {/* Detalhes Expansíveis */}
                    {isExpanded && (
                      <div
                        style={{
                          marginTop: '12px',
                          paddingTop: '12px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '0.8rem',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {log.error_message && (
                          <div
                            style={{
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: '6px',
                              padding: '8px 10px',
                              color: '#fca5a5',
                              marginBottom: '10px',
                            }}
                          >
                            <strong>Erro:</strong> {log.error_message}
                          </div>
                        )}

                        <div style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                          Payload Enviado:
                        </div>
                        <pre
                          style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            padding: '10px',
                            borderRadius: '6px',
                            overflowX: 'auto',
                            color: '#93c5fd',
                            fontSize: '0.74rem',
                            maxHeight: '140px',
                            margin: 0,
                          }}
                        >
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>

                        {log.response_body && (
                          <div style={{ marginTop: '10px' }}>
                            <div style={{ fontWeight: 600, color: '#cbd5e1', marginBottom: '4px' }}>
                              Resposta do Servidor:
                            </div>
                            <pre
                              style={{
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                padding: '10px',
                                borderRadius: '6px',
                                overflowX: 'auto',
                                color: '#a7f3d0',
                                fontSize: '0.74rem',
                                maxHeight: '100px',
                                margin: 0,
                              }}
                            >
                              {log.response_body}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé: apenas 1 botão fechar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '9px 20px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#e2e8f0',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
            data-testid="close-logs-modal-btn"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
