import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  RefreshCw,
  Cpu,
  Database,
  Bell
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { getInfrastructureOverviewApi, getAlertConfigApi } from './infrastructureApi';
import InfrastructureResourcesTab from './InfrastructureResourcesTab';
import InfrastructureDatabaseTab from './InfrastructureDatabaseTab';
import InfrastructureAlertsTab from './InfrastructureAlertsTab';

export default function InfrastructureManagement({ currentUser, bgColor }) {
  const [activeSubTab, setActiveSubTab] = useState('resources'); // 'resources' | 'database' | 'alerts'
  const [overview, setOverview] = useState(null);
  const [alertConfig, setAlertConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { addToast } = useToast();

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [overviewData, configData] = await Promise.all([
        getInfrastructureOverviewApi(),
        getAlertConfigApi(),
      ]);
      setOverview(overviewData);
      setAlertConfig(configData);
      if (isRefresh) {
        addToast('Métricas de infraestrutura atualizadas!', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao carregar métricas de infraestrutura.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  const ramBadge = overview?.hardware ? `${overview.hardware.ram_pct}% RAM` : '...';
  const poolBadge = overview?.database ? `${overview.database.occupancy_pct}% Pool` : '...';
  const alertBadge = overview?.alert_badge || 'Inativo';

  return (
    <div
      className="page-container custom-scrollbar"
      data-testid="infrastructure-management-view"
      style={{
        padding: '24px 32px',
        maxWidth: '1240px',
        margin: '0 auto',
        minHeight: '100vh',
        background: bgColor || 'transparent',
      }}
    >
      {/* Cabeçalho do Painel Dark / Glassmorphism */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '26px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              background: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(37, 99, 235, 0.2)',
            }}
          >
            <Server size={24} color="#60a5fa" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.3px' }}>
              Infraestrutura & Recursos do Servidor
            </h1>
            <p style={{ margin: '5px 0 0 0', fontSize: '13.5px', color: '#94a3b8' }}>
              Painel organizado por abas com métricas de RAM, CPU, Conexões do PostgreSQL e Webhooks de notificação (Horário Oficial de Brasília).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
          data-testid="refresh-infra-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            borderRadius: '10px',
            fontSize: '13.5px',
            fontWeight: 600,
            color: '#f8fafc',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCw size={15} color="#93c5fd" className={refreshing ? 'spin-icon' : ''} />
          <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
        </button>
      </div>

      {/* Sub-Abas com Estilo Dark Neon */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveSubTab('resources')}
          data-testid="subtab-resources"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '11px 20px',
            background: activeSubTab === 'resources' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.65)',
            border: `1px solid ${activeSubTab === 'resources' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '12px',
            color: activeSubTab === 'resources' ? '#60a5fa' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            boxShadow: activeSubTab === 'resources' ? '0 0 16px rgba(37, 99, 235, 0.25)' : 'none',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
        >
          <Cpu size={17} color={activeSubTab === 'resources' ? '#60a5fa' : '#64748b'} />
          <span>Recursos do Servidor (RAM & CPU)</span>
          <span
            style={{
              background: activeSubTab === 'resources' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
              color: activeSubTab === 'resources' ? '#ffffff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
            }}
          >
            {ramBadge}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('database')}
          data-testid="subtab-database"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '11px 20px',
            background: activeSubTab === 'database' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.65)',
            border: `1px solid ${activeSubTab === 'database' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '12px',
            color: activeSubTab === 'database' ? '#60a5fa' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            boxShadow: activeSubTab === 'database' ? '0 0 16px rgba(37, 99, 235, 0.25)' : 'none',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
        >
          <Database size={17} color={activeSubTab === 'database' ? '#60a5fa' : '#64748b'} />
          <span>Conexões & Banco (PostgreSQL)</span>
          <span
            style={{
              background: activeSubTab === 'database' ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
              color: activeSubTab === 'database' ? '#ffffff' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
            }}
          >
            {poolBadge}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('alerts')}
          data-testid="subtab-alerts"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '11px 20px',
            background: activeSubTab === 'alerts' ? 'rgba(37, 99, 235, 0.2)' : 'rgba(15, 23, 42, 0.65)',
            border: `1px solid ${activeSubTab === 'alerts' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '12px',
            color: activeSubTab === 'alerts' ? '#60a5fa' : '#94a3b8',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            boxShadow: activeSubTab === 'alerts' ? '0 0 16px rgba(37, 99, 235, 0.25)' : 'none',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s ease',
          }}
        >
          <Bell size={17} color={activeSubTab === 'alerts' ? '#60a5fa' : '#64748b'} />
          <span>Configurações de Alertas (Webhook)</span>
          <span
            style={{
              background: alertBadge === 'Ativo' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              color: alertBadge === 'Ativo' ? '#34d399' : '#94a3b8',
              border: alertBadge === 'Ativo' ? '1px solid rgba(16, 185, 129, 0.4)' : 'none',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '20px',
            }}
          >
            {alertBadge}
          </span>
        </button>
      </div>

      {/* Conteúdo da Sub-Aba Ativa */}
      {loading ? (
        <div style={{ padding: '80px', textAlign: 'center', color: '#94a3b8' }}>
          <RefreshCw size={30} color="#60a5fa" className="spin-icon" style={{ margin: '0 auto 12px' }} />
          <div>Carregando métricas de infraestrutura...</div>
        </div>
      ) : (
        <>
          {activeSubTab === 'resources' && (
            <InfrastructureResourcesTab hardware={overview?.hardware} alertConfig={alertConfig} />
          )}

          {activeSubTab === 'database' && (
            <InfrastructureDatabaseTab database={overview?.database} />
          )}

          {activeSubTab === 'alerts' && (
            <InfrastructureAlertsTab
              config={alertConfig}
              onUpdated={(newCfg) => setAlertConfig(newCfg)}
              addToast={addToast}
            />
          )}
        </>
      )}
    </div>
  );
}
