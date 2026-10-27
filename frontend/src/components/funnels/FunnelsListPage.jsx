import React, { useState, useEffect, useCallback } from 'react';
import { GitBranch, Plus, CheckCircle2, Search } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import FunnelDeleteConfirmModal from './FunnelDeleteConfirmModal';
import FunnelDuplicateConfirmModal from './FunnelDuplicateConfirmModal';
import FunnelExecutionsHistoryModal from './FunnelExecutionsHistoryModal';
import FunnelFolderBar from './FunnelFolderBar';
import FunnelFolderModal from './FunnelFolderModal';
import FunnelDeleteFolderConfirmModal from './FunnelDeleteFolderConfirmModal';
import FunnelMoveModal from './FunnelMoveModal';
import FunnelCreateModal from './FunnelCreateModal';
import FunnelCard from './FunnelCard';

export default function FunnelsListPage({ onSelectFunnel }) {
  const [funnels, setFunnels] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modais de Funil
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState('');
  const [newFunnelFolderId, setNewFunnelFolderId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [duplicateTarget, setDuplicateTarget] = useState(null);
  const [duplicating, setDuplicating] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);

  // Modais de Pasta
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [savingFolder, setSavingFolder] = useState(false);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const [moveFunnelTarget, setMoveFunnelTarget] = useState(null);
  const [movingFunnel, setMovingFunnel] = useState(false);

  const { addToast } = useToast();

  const fetchFolders = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/funnels/folders', {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch {
      // Ignora erro eventual de rede
    }
  }, []);

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

  const loadAll = useCallback(() => {
    fetchFunnels();
    fetchFolders();
  }, [fetchFunnels, fetchFolders]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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
        body: JSON.stringify({
          name: newFunnelName.trim(),
          trigger_type: 'chat_button',
          folder_id: newFunnelFolderId || null,
        }),
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

  const handleConfirmDuplicate = async () => {
    if (!duplicateTarget) return;
    setDuplicating(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/funnels/${duplicateTarget.id}/duplicate`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Falha ao duplicar funil');
      addToast('Funil duplicado com sucesso!', 'success');
      setDuplicateTarget(null);
      loadAll();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDuplicating(false);
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
      loadAll();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveFolder = async ({ name, color }) => {
    setSavingFolder(true);
    try {
      const token = localStorage.getItem('auth_token');
      const isEdit = !!editingFolder;
      const url = isEdit ? `/api/v1/funnels/folders/${editingFolder.id}` : '/api/v1/funnels/folders';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name, color }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Falha ao salvar pasta');
      }
      addToast(isEdit ? 'Pasta atualizada!' : 'Pasta criada com sucesso!', 'success');
      setFolderModalOpen(false);
      setEditingFolder(null);
      fetchFolders();
      fetchFunnels();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSavingFolder(false);
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    setDeletingFolder(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/funnels/folders/${deleteFolderTarget.id}`, {
        method: 'DELETE',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      if (!res.ok) throw new Error('Falha ao excluir pasta');
      addToast('Pasta excluída! Funis preservados em Sem Pasta.', 'success');
      if (selectedFolderId === deleteFolderTarget.id) {
        setSelectedFolderId(null);
      }
      setDeleteFolderTarget(null);
      loadAll();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setDeletingFolder(false);
    }
  };

  const handleConfirmMoveFunnel = async (targetFolderId) => {
    if (!moveFunnelTarget) return;
    setMovingFunnel(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/funnels/${moveFunnelTarget.id}/folder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ folder_id: targetFolderId }),
      });
      if (!res.ok) throw new Error('Falha ao mover funil');
      addToast('Funil movido com sucesso!', 'success');
      setMoveFunnelTarget(null);
      loadAll();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setMovingFunnel(false);
    }
  };

  const unassignedCount = funnels.filter((f) => !f.folder_id).length;

  const filtered = funnels.filter((f) => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase().trim());
    if (!matchesSearch) return false;
    if (selectedFolderId === null) return true;
    if (selectedFolderId === 'unassigned') return !f.folder_id;
    return f.folder_id === selectedFolderId;
  });

  return (
    <div style={{ padding: '28px', maxWidth: '1240px', margin: '0 auto', color: '#f8fafc' }} data-testid="funnels-list-page">
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '1.75rem', fontWeight: 800 }}>
            <span style={{ background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Meus Funis
            </span>
          </h1>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#94a3b8' }}>
            Crie fluxos visuais inteligentes de mensagens para engajar e converter seus alunos diretamente no chat privado.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
            <CheckCircle2 size={13} />
            <span>Chat DMs: Ativo</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setNewFunnelName(`Novo Funil ${new Date().toLocaleDateString('pt-BR')}, ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);
              setNewFunnelFolderId(typeof selectedFolderId === 'number' ? selectedFolderId : null);
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

      {/* Barra de Pastas */}
      <FunnelFolderBar
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onCreateFolderClick={() => {
          setEditingFolder(null);
          setFolderModalOpen(true);
        }}
        onEditFolderClick={(f) => {
          setEditingFolder(f);
          setFolderModalOpen(true);
        }}
        onDeleteFolderClick={(f) => {
          setDeleteFolderTarget(f);
        }}
        totalFunnelsCount={funnels.length}
        unassignedFunnelsCount={unassignedCount}
      />

      {/* Barra de Busca */}
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

      {/* Grade de Funis */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>Carregando seus funis...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '60px 20px', textAlign: 'center', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px dashed rgba(255, 255, 255, 0.12)' }}>
          <GitBranch size={42} color="#6366f1" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem' }}>Nenhum funil encontrado</h3>
          <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '0.85rem' }}>
            {selectedFolderId ? 'Nenhum funil associado a esta pasta.' : 'Comece criando o seu primeiro fluxo automatizado.'}
          </p>
          <button
            onClick={() => {
              setNewFunnelName(`Novo Funil ${new Date().toLocaleDateString('pt-BR')}`);
              setNewFunnelFolderId(typeof selectedFolderId === 'number' ? selectedFolderId : null);
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
            <FunnelCard
              key={item.id}
              item={item}
              onSelectFunnel={onSelectFunnel}
              onMoveClick={(f) => setMoveFunnelTarget(f)}
              onHistoryClick={(f) => setHistoryTarget(f)}
              onDuplicateClick={(f) => setDuplicateTarget(f)}
              onDeleteClick={(f) => setDeleteTarget(f)}
            />
          ))}
        </div>
      )}

      {/* Modais de Pasta */}
      <FunnelFolderModal
        isOpen={folderModalOpen}
        folder={editingFolder}
        onClose={() => {
          setFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={handleSaveFolder}
        saving={savingFolder}
      />

      <FunnelDeleteFolderConfirmModal
        isOpen={!!deleteFolderTarget}
        folderName={deleteFolderTarget?.name}
        funnelsCount={deleteFolderTarget?.funnels_count || 0}
        onClose={() => setDeleteFolderTarget(null)}
        onConfirm={handleConfirmDeleteFolder}
        deleting={deletingFolder}
      />

      <FunnelMoveModal
        isOpen={!!moveFunnelTarget}
        funnel={moveFunnelTarget}
        folders={folders}
        onClose={() => setMoveFunnelTarget(null)}
        onConfirm={handleConfirmMoveFunnel}
        moving={movingFunnel}
      />

      {/* Modais de Funil */}
      <FunnelCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateFunnel}
        newFunnelName={newFunnelName}
        setNewFunnelName={setNewFunnelName}
        newFunnelFolderId={newFunnelFolderId}
        setNewFunnelFolderId={setNewFunnelFolderId}
        folders={folders}
        creating={creating}
      />

      <FunnelDuplicateConfirmModal
        isOpen={!!duplicateTarget}
        funnelName={duplicateTarget?.name}
        onClose={() => setDuplicateTarget(null)}
        onConfirm={handleConfirmDuplicate}
        duplicating={duplicating}
      />

      <FunnelExecutionsHistoryModal
        isOpen={!!historyTarget}
        funnelId={historyTarget?.id}
        funnelName={historyTarget?.name}
        onClose={() => setHistoryTarget(null)}
      />

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
