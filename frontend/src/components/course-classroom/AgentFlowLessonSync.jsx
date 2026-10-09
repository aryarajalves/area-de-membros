import React, { useState, useEffect } from 'react';
import { Database, Loader2, RefreshCw, X, AlertTriangle, Check } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import AgentFlowSyncProgressModal from './AgentFlowSyncProgressModal';

export default function AgentFlowLessonSync({
  lessonId,
  isManager,
  initialSyncedAt,
  initialKbId,
  isLightBg = false,
  lessonTitle = '',
  onSyncSuccess
}) {
  const [syncedAt, setSyncedAt] = useState(initialSyncedAt || null);
  const [kbId, setKbId] = useState(initialKbId || null);
  const [syncing, setSyncing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { addToast } = useToast();

  // Sincroniza estado local reativamente sempre que as props mudarem (ex: fetch assíncrono ou troca de aula)
  useEffect(() => {
    setSyncedAt(initialSyncedAt || null);
  }, [initialSyncedAt, lessonId]);

  useEffect(() => {
    setKbId(initialKbId || null);
  }, [initialKbId, lessonId]);

  const isSynced = Boolean(syncedAt);

  // Fecha modal com Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showConfirmModal && !syncing) {
        setShowConfirmModal(false);
      }
    };
    if (showConfirmModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showConfirmModal, syncing]);

  const handleButtonClick = () => {
    if (isSynced) {
      // Re-sincronização: abre popup centralizado de confirmação
      setShowConfirmModal(true);
    } else {
      // Primeira sincronização manual
      executeSync();
    }
  };

  const executeSync = async () => {
    setShowConfirmModal(false);
    setSyncing(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/agentflow/lessons/${lessonId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Falha ao sincronizar com AgentFlow.');
      }

      const data = await res.json();
      setSyncedAt(data.synced_at || new Date().toISOString());
      if (data.kb_id) setKbId(data.kb_id);
      setShowConfirmModal(false);
      if (typeof onSyncSuccess === 'function') {
        onSyncSuccess(data);
      }
      addToast(
        `Aula sincronizada com sucesso no AgentFlow! (${data.qa_count || 5} P&R e ${data.chunks_count || 0} trechos)`,
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Erro ao sincronizar com AgentFlow.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const modalBg = isLightBg ? '#ffffff' : '#0b1120';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#475569' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(16, 185, 129, 0.28)';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      {/* Badge de Status */}
      <span
        data-testid="agentflow-sync-badge"
        title={isSynced ? `Sincronizado em ${new Date(syncedAt).toLocaleString('pt-BR')}` : 'Ainda não enviado para a Base de Conhecimento do AgentFlow'}
        style={{
          fontSize: '12px',
          fontWeight: 700,
          backgroundColor: isSynced ? 'rgba(16, 185, 129, 0.12)' : 'rgba(148, 163, 184, 0.12)',
          color: isSynced ? '#10b981' : (isLightBg ? '#64748b' : '#94a3b8'),
          border: `1px solid ${isSynced ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.25)'}`,
          padding: '4px 10px',
          borderRadius: '999px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px'
        }}
      >
        <Database size={12} />
        <span>
          {isSynced ? `AgentFlow (Base #${kbId || 'ativa'})` : 'AgentFlow: Pendente'}
        </span>
      </span>

      {/* Botão de Ação Manual para Admins/Managers */}
      {isManager && (
        <button
          type="button"
          data-testid="btn-sync-agentflow"
          onClick={handleButtonClick}
          disabled={syncing}
          title={isSynced ? 'Re-sincronizar aula com o AgentFlow' : 'Enviar transcrição, perguntas, respostas e resumos para o AgentFlow'}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 10px',
            backgroundColor: isSynced ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.18)',
            color: isSynced ? '#10b981' : '#818cf8',
            border: `1px solid ${isSynced ? 'rgba(16, 185, 129, 0.35)' : 'rgba(99, 102, 241, 0.4)'}`,
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: syncing ? 'not-allowed' : 'pointer',
            opacity: syncing ? 0.7 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          {syncing && !showConfirmModal ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              <span>Sincronizando...</span>
            </>
          ) : isSynced ? (
            <>
              <RefreshCw size={12} />
              <span>Re-sincronizar</span>
            </>
          ) : (
            <>
              <Database size={12} />
              <span>Sincronizar com AgentFlow</span>
            </>
          )}
        </button>
      )}

      {/* Popup Centralizado de Confirmação de Re-sincronização */}
      {showConfirmModal && (
        <div
          className="custom-modal-overlay"
          data-testid="confirm-resync-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1300,
            padding: '16px'
          }}
          onClick={(e) => {
            // Regra UX: NÃO deve fechar ao clicar fora do painel central
            e.stopPropagation();
          }}
        >
          <div
            className="table-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-resync-modal-title"
            data-testid="confirm-resync-modal"
            style={{
              width: '92%',
              maxWidth: '460px',
              padding: 0,
              borderRadius: '16px',
              backgroundColor: modalBg,
              border: `1px solid ${borderColor}`,
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(16, 185, 129, 0.14)',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 20px',
                borderBottom: isLightBg ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3
                    id="confirm-resync-modal-title"
                    data-testid="confirm-resync-modal-title"
                    style={{
                      fontSize: '15.5px',
                      fontWeight: 700,
                      color: textColor,
                      margin: 0
                    }}
                  >
                    Re-sincronizar Aula
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                    AgentFlow • Base de Conhecimento RAG
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="close-modal-btn"
                onClick={() => !syncing && setShowConfirmModal(false)}
                disabled={syncing}
                data-testid="confirm-resync-modal-close-btn"
                aria-label="Fechar modal"
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                  color: textColor,
                  border: 'none',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Conteúdo */}
            <div style={{ padding: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  marginBottom: '16px'
                }}
              >
                <AlertTriangle size={18} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', color: textColor, lineHeight: 1.5 }}>
                  Deseja realmente re-sincronizar esta aula com o AgentFlow?
                  <div style={{ fontSize: '12px', color: subTextColor, marginTop: '4px' }}>
                    A transcrição atual, os trechos (chunks), perguntas & respostas geradas e os resumos serão reenviados para atualizar o conhecimento do robô.
                  </div>
                </div>
              </div>

              {lessonTitle && (
                <div style={{ fontSize: '12.5px', color: subTextColor, marginBottom: '6px' }}>
                  Aula: <strong style={{ color: textColor }}>{lessonTitle}</strong>
                </div>
              )}
            </div>

            {/* Rodapé com 1 Botão de Cancelar e 1 Botão de Ação Principal */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '14px 20px',
                borderTop: isLightBg ? '1px solid #f1f5f9' : '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: isLightBg ? '#fafafa' : 'rgba(0, 0, 0, 0.25)'
              }}
            >
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowConfirmModal(false)}
                disabled={syncing}
                data-testid="confirm-resync-modal-cancel-btn"
                style={{
                  fontSize: '12.5px',
                  padding: '8px 16px',
                  borderRadius: '8px'
                }}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="primary-btn"
                onClick={executeSync}
                disabled={syncing}
                data-testid="confirm-resync-modal-confirm-btn"
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: syncing ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                }}
              >
                {syncing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Re-sincronizando...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Sim, Re-sincronizar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup Centralizado de Progresso da Sincronização (Bloqueante) */}
      <AgentFlowSyncProgressModal
        isOpen={syncing}
        lessonTitle={lessonTitle}
        isLightBg={isLightBg}
      />
    </div>
  );
}
