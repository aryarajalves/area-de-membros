import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch,
  Plus,
  Play,
  Copy,
  Trash2,
  Calendar,
  Layers,
  Zap,
  CheckCircle2,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import FunnelDeleteConfirmModal from './FunnelDeleteConfirmModal';

export default function FunnelsListPage({ onSelectFunnel }) {
  const [funnels, setFunnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { addToast } = useToast();

  const fetchFunnels = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/funnels', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Falha ao listar funis');
      const data = await res.json();
      setFunnels(data);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchFunnels();
  }, [fetchFunnels]);

  const handleCreateFunnel = async (e) => {
    e.preventDefault();
    if (!newFunnelName.trim()) {
      addToast('Informe o nome do funil', 'error');
      return;
    }
    setCreating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/funnels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: newFunnelName.trim(), trigger_type: 'chat_button' }),
      });
      if (!res.ok) throw new Error('Falha ao criar funil');
      const created = await res.json();
      addToast('Funil criado com sucesso!', 'success');
      setShowCreateModal(false);
      setNewFunnelName('');
      onSelectFunnel(created.id);
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (funnelId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/funnels/${funnelId}/duplicate`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Falha ao duplicar funil');
      addToast('Funil duplicado com sucesso!', 'success');
      fetchFunnels();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/funnels/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Falha ao excluir funil');
      addToast('Funil excluído com sucesso!', 'success');
      setDeleteTarget(null);
      fetchFunnels();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const filtered = funnels.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  return (
    <div style={{ padding: '28px', maxWidth: '1240px', margin: '0 auto', color: '#f8fafc' }} data-testid="funnels-list-page">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Meus Funis
            </span>
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
            Crie fluxos visuais inteligentes de mensagens para engajar e converter seus alunos diretamente no chat privado.
          </p>
        </div>

        {/* Badges de Conectividade e Botão Criar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
            <CheckCircle2 size={13} />
            <span>Chat DMs: Ativo</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewFunnelName(`Novo Funil ${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
              setShowCreateModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.35)',
            }}
            data-testid="create-funnel-btn"
          >
            <Plus size={16} />
            <span>Criar Novo Funil</span>
          </button>
        </div>
      </div>

      {/* Busca */}
      <div style={{ marginBottom: '22px', maxWidth: '360px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '8px 12px' }}>
          <Search size={15} color="#64748b" />
          <input
            type="text"
            placeholder="Buscar por nome do funil..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f8fafc', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Listagem de Funis */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Carregando seus funis...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px dashed rgba(255, 255, 255, 0.12)' }}>
          <GitBranch size={42} color="#6366f1" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>Nenhum funil encontrado</h3>
          <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            Comece criando o seu primeiro fluxo automatizado para engajar seus alunos pelo chat.
          </p>
          <button
            onClick={() => {
              setNewFunnelName(`Novo Funil ${new Date().toLocaleDateString('pt-BR')}`);
              setShowCreateModal(true);
            }}
            style={{ padding: '9px 18px', borderRadius: '8px', background: '#6366f1', color: '#ffffff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            Criar Primeiro Funil
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
          {filtered.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: '#0f172a',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.15s ease, border-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.5)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
              data-testid={`funnel-card-${item.id}`}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GitBranch size={17} />
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#34d399', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                      Ativo
                    </span>
                  </div>

                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
                  {item.name}
                </h3>
                {item.description && (
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '14px 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Layers size={13} color="#a78bfa" />
                    <span>{item.nodes_count || 1} {item.nodes_count === 1 ? 'nó' : 'nós'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Zap size={13} color="#f59e0b" />
                    <span>{item.executions_count || 0} execuções</span>
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => onSelectFunnel(item.id)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                  data-testid={`edit-funnel-btn-${item.id}`}
                >
                  <Play size={13} fill="#ffffff" />
                  <span>Editar Fluxo</span>
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(item.id)}
                    title="Duplicar Funil"
                    style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', padding: '7px', borderRadius: '6px', cursor: 'pointer' }}
                    data-testid={`duplicate-funnel-btn-${item.id}`}
                  >
                    <Copy size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    title="Excluir Funil"
                    style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '7px', borderRadius: '6px', cursor: 'pointer' }}
                    data-testid={`delete-funnel-btn-${item.id}`}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar Funil */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: '20px' }}>
          <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#0f172a', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '16px', padding: '24px', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '1.2rem', fontWeight: 700 }}>Criar Novo Funil</h3>
            <form onSubmit={handleCreateFunnel}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>Nome do Funil *</label>
                <input
                  type="text"
                  value={newFunnelName}
                  onChange={(e) => setNewFunnelName(e.target.value)}
                  placeholder="Ex: Funil de Oferta Especial"
                  autoFocus
                  style={{ width: '100%', backgroundColor: '#020617', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '8px', color: '#ffffff', padding: '9px 12px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.15)', backgroundColor: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{ padding: '8px 20px', borderRadius: '8px', background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', color: '#ffffff', border: 'none', fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer' }}
                  data-testid="submit-create-funnel-btn"
                >
                  {creating ? 'Criando...' : 'Criar e Abrir Fluxo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Exclusão */}
      <FunnelDeleteConfirmModal
        isOpen={!!deleteTarget}
        funnelName={deleteTarget?.name}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
