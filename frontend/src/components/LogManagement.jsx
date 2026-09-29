import React, { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Copy, Check, Filter, ArrowDown, ChevronRight, Activity } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function LogManagement({ currentUser }) {
  const [services, setServices] = useState([
    { id: 'backend', name: 'Backend (FastAPI)', container: 'projeto_base_backend' },
    { id: 'frontend', name: 'Frontend (Nginx / Vite)', container: 'projeto_base_frontend' },
    { id: 'db', name: 'Banco de Dados (PostgreSQL)', container: 'projeto_base_db' },
  ]);
  const [selectedService, setSelectedService] = useState('backend');
  const [tailLines, setTailLines] = useState(100);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const terminalEndRef = useRef(null);
  const { addToast } = useToast();

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/logs/${selectedService}?tail=${tailLines}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      } else {
        throw new Error(data.detail || 'Erro ao carregar logs.');
      }
    } catch (err) {
      if (!silent) {
        addToast(err.message || 'Erro ao carregar logs.', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedService, tailLines]);

  // Auto-refresh a cada 4 segundos se habilitado
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedService, tailLines]);

  const handleCopyLogs = () => {
    if (logs.length === 0) return;
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    addToast('Logs copiados para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredLogs = logs.filter((line) =>
    searchTerm ? line.toLowerCase().includes(searchTerm.toLowerCase()) : true
  );

  return (
    <div className="backup-page-container" data-testid="log-management-page">
      {/* Cabeçalho */}
      <div className="backup-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h1>Gerenciamento de logs</h1>
        </div>
        <p>Acompanhe e diagnostique em tempo real os logs dos contêineres Docker do sistema.</p>
      </div>

      {/* Seleção de Serviço / Contêiner */}
      <div className="sub-tabs-container">
        {services.map((srv) => (
          <button
            key={srv.id}
            type="button"
            className={`sub-tab-btn ${selectedService === srv.id ? 'active' : ''}`}
            onClick={() => setSelectedService(srv.id)}
            data-testid={`tab-service-${srv.id}`}
          >
            <Terminal size={16} />
            <span>{srv.name}</span>
          </button>
        ))}
      </div>

      {/* Barra de Ferramentas / Controles do Log */}
      <div className="table-card" style={{ marginBottom: '20px' }}>
        <div className="table-toolbar" style={{ flexWrap: 'wrap', gap: '12px' }}>
          {/* Busca de texto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 250px' }}>
            <Filter size={15} color="#64748b" />
            <input
              type="text"
              placeholder="Filtrar por texto nos logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
              }}
              data-testid="log-search-input"
            />
          </div>

          {/* Quantidade de Linhas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="tail-select" style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              Linhas:
            </label>
            <select
              id="tail-select"
              value={tailLines}
              onChange={(e) => setTailLines(Number(e.target.value))}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                fontWeight: 500,
              }}
              data-testid="log-tail-select"
            >
              <option value={50}>50 linhas</option>
              <option value={100}>100 linhas</option>
              <option value={200}>200 linhas</option>
              <option value={500}>500 linhas</option>
            </select>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="pagination-btn"
            style={autoRefresh ? { backgroundColor: '#dcfce7', borderColor: '#86efac', color: '#166534' } : {}}
            data-testid="toggle-autorefresh-btn"
            title="Atualização automática a cada 4s"
          >
            <Activity size={15} className={autoRefresh ? 'pulse-icon' : ''} />
            <span>{autoRefresh ? 'Auto (Ligado)' : 'Auto (Desligado)'}</span>
          </button>

          {/* Botão Atualizar Manual */}
          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="pagination-btn"
            data-testid="refresh-logs-btn"
          >
            <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
            <span>Atualizar</span>
          </button>

          {/* Botão Copiar */}
          <button
            type="button"
            onClick={handleCopyLogs}
            disabled={logs.length === 0}
            className="pagination-btn"
            data-testid="copy-logs-btn"
          >
            {copied ? <Check size={15} color="#16a34a" /> : <Copy size={15} />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          {/* Botão Rolar para o fim */}
          <button
            type="button"
            onClick={scrollToBottom}
            className="pagination-btn"
            data-testid="scroll-bottom-btn"
            title="Rolar para o final do terminal"
          >
            <ArrowDown size={15} />
            <span>Fim</span>
          </button>
        </div>
      </div>

      {/* Terminal View Container */}
      <div
        className="terminal-view-card"
        data-testid="terminal-container"
        style={{
          backgroundColor: '#0f172a',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Terminal Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid #334155',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, marginLeft: '8px' }}>
              docker logs --tail {tailLines} {services.find((s) => s.id === selectedService)?.container}
            </span>
          </div>
          <span style={{ color: '#64748b', fontSize: '12px' }}>
            {filteredLogs.length} linha(s) {searchTerm && `(filtrado de ${logs.length})`}
          </span>
        </div>

        {/* Terminal Body */}
        <div
          style={{
            padding: '16px',
            maxHeight: '520px',
            minHeight: '320px',
            overflowY: 'auto',
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#e2e8f0',
          }}
          data-testid="terminal-logs-body"
        >
          {loading && logs.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>
              Carregando logs do contêiner...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>
              {searchTerm ? 'Nenhuma linha encontrada para o filtro informado.' : 'Nenhum log registrado para este contêiner.'}
            </div>
          ) : (
            filteredLogs.map((line, index) => {
              // Destaques de cores por severidade
              let lineStyle = { color: '#cbd5e1' };
              const lower = line.toLowerCase();
              if (lower.includes('error') || lower.includes('erro') || lower.includes('failed') || lower.includes('exception')) {
                lineStyle = { color: '#f87171', fontWeight: 600 };
              } else if (lower.includes('warn') || lower.includes('aviso')) {
                lineStyle = { color: '#fbbf24' };
              } else if (lower.includes('success') || lower.includes('sucesso') || lower.includes('healthy') || lower.includes('started')) {
                lineStyle = { color: '#4ade80' };
              }

              return (
                <div key={index} style={{ display: 'flex', gap: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  <span style={{ color: '#475569', userSelect: 'none', minWidth: '35px', textAlign: 'right' }}>
                    {index + 1}
                  </span>
                  <span style={lineStyle}>{line}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
