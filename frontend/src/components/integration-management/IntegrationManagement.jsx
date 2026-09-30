import React, { useState, useEffect, useCallback } from 'react';
import { Webhook, Plus, Search, RefreshCw, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import IntegrationModal from './IntegrationModal';
import IntegrationLogsModal from './IntegrationLogsModal';
import IntegrationCard from './IntegrationCard';
import DeleteIntegrationModal from './DeleteIntegrationModal';

export default function IntegrationManagement({ bgColor = '#090d16' }) {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [logsModalWebhook, setLogsModalWebhook] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const { addToast } = useToast();

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const cardBg = isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.04)';
  const cardBorder = isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.1)';

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/integrations', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Falha ao carregar integrações.');
      const data = await res.json();
      setIntegrations(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message, 'error');
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleTestWebhook = async (wh) => {
    setTestingId(wh.id);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/integrations/${wh.id}/test`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message || 'Disparo de teste realizado com sucesso!', 'success');
      } else {
        addToast(data.message || 'O servidor de destino retornou erro.', 'error');
      }
      fetchIntegrations();
    } catch (err) {
      addToast(err.message || 'Erro ao disparar webhook de teste.', 'error');
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/integrations/${deletingId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Falha ao excluir integração.');
      addToast('Integração removida com sucesso!', 'success');
      setDeletingId(null);
      fetchIntegrations();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    addToast('URL copiada para a área de transferência!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtragem
  const filtered = integrations.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (item.name || '').toLowerCase().includes(q) || (item.url || '').toLowerCase().includes(q);
  });

  const activeCount = integrations.filter((i) => i.is_active).length;
  const totalDispatches = integrations.reduce((acc, i) => acc + (i.total_dispatches || 0), 0);

  return (
    <div
      style={{
        padding: '28px 36px',
        backgroundColor: bgColor,
        minHeight: '100vh',
        color: textColor,
      }}
      data-testid="integration-management-page"
    >
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Webhook size={22} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 700 }}>Integrações e Webhooks</h1>
          </div>
          <p style={{ margin: 0, fontSize: '0.92rem', color: subTextColor }}>
            Configure webhooks para receber notificações automáticas em tempo real quando os alunos atingirem 25%, 50%, 75% ou 100% dos cursos.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingIntegration(null);
            setIsModalOpen(true);
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: '#9333ea',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 10px rgba(147, 51, 234, 0.3)',
            transition: 'all 0.2s ease',
          }}
          data-testid="open-create-integration-btn"
        >
          <Plus size={16} /> Nova Integração
        </button>
      </div>

      {/* Cards de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total de Integrações', value: integrations.length, icon: Webhook, color: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)' },
          { label: 'Integrações Ativas', value: activeCount, icon: CheckCircle, color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
          { label: 'Disparos Realizados', value: totalDispatches, icon: Send, color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)' },
        ].map((item, idx) => (
          <div key={idx} style={{ backgroundColor: cardBg, border: cardBorder, borderRadius: '12px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <item.icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: subTextColor }}>{item.label}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: textColor }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Barra de Filtro e Busca */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: subTextColor }} />
          <input
            type="text"
            placeholder="Buscar por nome ou URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: cardBg,
              border: cardBorder,
              borderRadius: '8px',
              padding: '8px 12px 8px 36px',
              color: textColor,
              fontSize: '0.86rem',
              outline: 'none',
            }}
            data-testid="search-integrations-input"
          />
        </div>

        <button
          type="button"
          onClick={fetchIntegrations}
          disabled={loading}
          style={{
            padding: '8px 14px',
            backgroundColor: 'transparent',
            border: cardBorder,
            borderRadius: '8px',
            color: textColor,
            fontSize: '0.84rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          data-testid="refresh-integrations-btn"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Lista de Integrações */}
      {loading && integrations.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0', color: subTextColor }}>
          <Loader2 size={32} className="animate-spin" style={{ marginRight: '10px' }} />
          Carregando integrações...
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            backgroundColor: cardBg,
            border: cardBorder,
            borderRadius: '12px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
          data-testid="no-integrations-state"
        >
          <Webhook size={40} style={{ color: subTextColor, margin: '0 auto 12px', opacity: 0.5 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 6px', color: textColor }}>
            Nenhuma integração encontrada
          </h3>
          <p style={{ fontSize: '0.86rem', color: subTextColor, margin: '0 0 18px' }}>
            {search ? 'Nenhum resultado corresponde à sua pesquisa.' : 'Crie sua primeira integração para receber webhooks automáticos dos alunos.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => {
                setEditingIntegration(null);
                setIsModalOpen(true);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                backgroundColor: '#9333ea',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer',
              }}
              data-testid="create-first-integration-btn"
            >
              Criar Integração
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filtered.map((wh) => (
            <IntegrationCard
              key={wh.id}
              wh={wh}
              cardBg={cardBg}
              cardBorder={cardBorder}
              textColor={textColor}
              subTextColor={subTextColor}
              testingId={testingId}
              onTest={handleTestWebhook}
              onOpenLogs={(w) => setLogsModalWebhook(w)}
              onEdit={(w) => {
                setEditingIntegration(w);
                setIsModalOpen(true);
              }}
              onDeletePrompt={(id) => setDeletingId(id)}
              onCopyUrl={handleCopyUrl}
              copiedId={copiedId}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <IntegrationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIntegration(null);
        }}
        onSuccess={fetchIntegrations}
        initialData={editingIntegration}
      />

      {/* Modal de Logs */}
      <IntegrationLogsModal
        isOpen={Boolean(logsModalWebhook)}
        onClose={() => setLogsModalWebhook(null)}
        webhook={logsModalWebhook}
      />

      {/* Popup de Confirmação de Deleção */}
      <DeleteIntegrationModal
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
