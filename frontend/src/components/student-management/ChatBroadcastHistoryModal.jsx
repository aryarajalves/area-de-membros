import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { History, X, ArrowLeft, RefreshCw, Send } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import ChatBroadcastCampaignCard from './ChatBroadcastCampaignCard';
import ChatBroadcastCampaignDetailView from './ChatBroadcastCampaignDetailView';
import HistoryPaginationBar from '../common/HistoryPaginationBar';

const PAGE_SIZE = 20;

export default function ChatBroadcastHistoryModal({ isOpen, onClose }) {
  const [campaigns, setCampaigns] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [campaignDetails, setCampaignDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setCurrentPage(1);
      fetchCampaigns();
    } else {
      document.body.style.overflow = '';
      setSelectedCampaignId(null);
      setCampaignDetails(null);
      setCurrentPage(1);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/chat/broadcast/campaigns', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(Array.isArray(data) ? data : []);
      }
    } catch {
      addToast('Erro ao carregar histórico de disparos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetails = async (campaignId) => {
    setSelectedCampaignId(campaignId);
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/chat/broadcast/campaigns/${campaignId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setCampaignDetails(data);
      }
    } catch {
      addToast('Erro ao carregar detalhes do disparo', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatDuration = (seconds) => {
    if (seconds == null) return '--';
    if (seconds < 60) return `${Math.round(seconds)} segundos`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins} min ${secs} seg`;
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '20px',
      }}
      data-testid="broadcast-history-modal-backdrop"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '92vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: '#f8fafc',
        }}
        data-testid="broadcast-history-modal-container"
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selectedCampaignId ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedCampaignId(null);
                  setCampaignDetails(null);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  borderRadius: '8px',
                  padding: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Voltar à lista"
                data-testid="back-to-campaigns-list-btn"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <History size={18} />
              </div>
            )}

            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                {selectedCampaignId ? campaignDetails?.title || 'Detalhes do Disparo' : 'Histórico de Disparos em Massa'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                {selectedCampaignId
                  ? 'Acompanhe quem recebeu e quem de fato visualizou a mensagem.'
                  : 'Relatório de disparos, taxa de entrega, visualização e tempo de duração.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={fetchCampaigns}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
              }}
              title="Recarregar histórico"
            >
              <RefreshCw size={17} className={loading ? 'spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
              }}
              data-testid="close-history-modal-btn"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Corpo com Scroll */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {selectedCampaignId ? (
            loadingDetails || !campaignDetails ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#94a3b8' }}>
                <RefreshCw size={24} className="spin" style={{ marginBottom: '8px', display: 'inline-block' }} />
                <div>Carregando métricas de destinatários...</div>
              </div>
            ) : (
              <ChatBroadcastCampaignDetailView
                campaignDetails={campaignDetails}
                formatDuration={formatDuration}
              />
            )
          ) : (
            loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                <RefreshCw size={26} className="spin" style={{ marginBottom: '10px', display: 'inline-block' }} />
                <div>Carregando histórico de campanhas...</div>
              </div>
            ) : campaigns.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '50px 20px',
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                }}
              >
                <Send size={36} style={{ opacity: 0.35, marginBottom: '10px' }} />
                <h4 style={{ margin: '0 0 6px 0', color: '#f8fafc', fontSize: '1.05rem' }}>
                  Nenhum disparo realizado ainda
                </h4>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>
                  Quando você fizer um disparo em massa no privado dos alunos, o histórico completo aparecerá aqui.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} data-testid="campaigns-history-list">
                  {campaigns
                    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                    .map((camp) => (
                      <ChatBroadcastCampaignCard
                        key={camp.id}
                        camp={camp}
                        onSelect={fetchDetails}
                        formatDuration={formatDuration}
                      />
                    ))}
                </div>
                <HistoryPaginationBar
                  currentPage={currentPage}
                  totalItems={campaigns.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setCurrentPage}
                  itemName="disparos"
                  testIdPrefix="broadcast-history"
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
