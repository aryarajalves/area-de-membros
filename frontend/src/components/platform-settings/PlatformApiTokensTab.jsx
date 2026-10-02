import React, { useState, useEffect, useCallback } from 'react';
import { KeyRound, Plus, Trash2, Power, Copy, Check, ShieldCheck, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import NewApiTokenModal from './NewApiTokenModal';
import TokenCreatedModal from './TokenCreatedModal';
import DeleteTokenConfirmModal from './DeleteTokenConfirmModal';

export default function PlatformApiTokensTab({ cardBg, cardBorder, textColor, subTextColor, isLightBg }) {
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [createdTokenData, setCreatedTokenData] = useState(null);
  const [tokenToDelete, setTokenToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const { addToast } = useToast();

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    const authToken = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/api-tokens', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTokens(Array.isArray(data) ? data : []);
      } else {
        addToast(data.detail || 'Erro ao carregar tokens de API.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Falha na conexão ao buscar tokens.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  const handleToggleStatus = async (token) => {
    setTogglingId(token.id);
    const authToken = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/api-tokens/${token.id}/toggle`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTokens((prev) => prev.map((t) => (t.id === token.id ? data : t)));
        addToast(
          data.is_active ? `Chave "${token.name}" reativada!` : `Chave "${token.name}" pausada!`,
          'success'
        );
      } else {
        throw new Error(data.detail || 'Erro ao alternar status.');
      }
    } catch (err) {
      addToast(err.message || 'Falha ao alterar status da chave.', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDeleteToken = async () => {
    if (!tokenToDelete) return;
    setDeleting(true);
    const authToken = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/api-tokens/${tokenToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Erro ao revogar chave de API.');
      addToast('Chave de API revogada e excluída com sucesso.', 'success');
      setTokens((prev) => prev.filter((t) => t.id !== tokenToDelete.id));
      setTokenToDelete(null);
    } catch (err) {
      addToast(err.message || 'Falha ao excluir chave de API.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Nunca';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div data-testid="platform-api-tokens-tab" style={{ maxWidth: '980px' }}>
      {/* Topo com Descrição e Botão Novo */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: textColor }}>
            Chaves de Acesso à API (API Keys)
          </h2>
          <p style={{ fontSize: '13px', color: subTextColor, margin: 0 }}>
            Gere tokens seguros para autenticar integrações de sistemas externos, automações no n8n, Make ou Webhooks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          style={{
            padding: '10px 18px',
            backgroundColor: '#0284c7',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '13.5px',
            borderRadius: '10px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)',
            transition: 'all 0.2s ease',
          }}
          data-testid="open-new-token-modal-btn"
        >
          <Plus size={17} />
          Gerar Novo Token
        </button>
      </div>

      {/* Tabela / Card de Tokens */}
      <div
        className="table-card"
        style={{
          backgroundColor: cardBg,
          border: cardBorder,
          borderRadius: '16px',
          padding: '20px',
          boxShadow: isLightBg ? '0 10px 25px -5px rgba(0, 0, 0, 0.05)' : '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0', color: subTextColor }}>
            <Loader2 size={32} className="spin-animation" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '13.5px' }}>Carregando chaves de API...</p>
          </div>
        ) : tokens.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              border: '1px dashed rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
            }}
            data-testid="empty-api-tokens-state"
          >
            <KeyRound size={40} color="#64748b" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Nenhuma chave de API gerada
            </h3>
            <p style={{ fontSize: '13px', color: subTextColor, maxWidth: '420px', margin: '0 auto 18px' }}>
              Crie uma chave para conectar com segurança suas ferramentas externas à Área de Membros sem depender do login interativo.
            </p>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#0284c7',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
              }}
              data-testid="empty-create-token-btn"
            >
              Criar primeira chave
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: subTextColor, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 14px' }}>Nome da Chave</th>
                  <th style={{ padding: '12px 14px' }}>Token Mascarado</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px' }}>Criado em</th>
                  <th style={{ padding: '12px 14px' }}>Último Uso</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr
                    key={token.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                      fontSize: '13px',
                      color: textColor,
                    }}
                    data-testid={`api-token-row-${token.id}`}
                  >
                    <td style={{ padding: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ShieldCheck size={16} color="#38bdf8" />
                        <span style={{ fontWeight: 600 }}>{token.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <code
                        style={{
                          backgroundColor: 'rgba(0, 0, 0, 0.35)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          color: '#38bdf8',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {token.masked_token}
                      </code>
                    </td>
                    <td style={{ padding: '14px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: token.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: token.is_active ? '#34d399' : '#f87171',
                          border: `1px solid ${token.is_active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        }}
                      >
                        {token.is_active ? 'Ativo' : 'Pausado'}
                      </span>
                    </td>
                    <td style={{ padding: '14px', color: subTextColor, fontSize: '12px' }}>
                      {formatDate(token.created_at)}
                    </td>
                    <td style={{ padding: '14px', color: subTextColor, fontSize: '12px' }}>
                      {formatDate(token.last_used_at)}
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(token)}
                          disabled={togglingId === token.id}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: token.is_active ? '#94a3b8' : '#34d399',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                          }}
                          data-testid={`toggle-token-status-${token.id}`}
                          title={token.is_active ? 'Pausar chave' : 'Reativar chave'}
                        >
                          <Power size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setTokenToDelete(token)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '6px',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#94a3b8';
                          }}
                          data-testid={`delete-token-btn-${token.id}`}
                          title="Revogar e excluir chave"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      <NewApiTokenModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onTokenCreated={(tokenData) => {
          setIsNewModalOpen(false);
          setTokens((prev) => [tokenData, ...prev]);
          setCreatedTokenData(tokenData);
        }}
      />

      <TokenCreatedModal
        isOpen={Boolean(createdTokenData)}
        tokenData={createdTokenData}
        onClose={() => setCreatedTokenData(null)}
      />

      <DeleteTokenConfirmModal
        isOpen={Boolean(tokenToDelete)}
        tokenName={tokenToDelete?.name}
        loading={deleting}
        onConfirm={confirmDeleteToken}
        onClose={() => setTokenToDelete(null)}
      />
    </div>
  );
}
