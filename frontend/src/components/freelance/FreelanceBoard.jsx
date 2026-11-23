import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Plus, Search, Loader2, Filter } from 'lucide-react';
import {
  FREELANCE_CATEGORIES,
  listFreelanceJobs,
  createFreelanceJob,
  updateFreelanceJob,
  deleteFreelanceJob,
} from './freelanceApi';
import FreelanceJobCard from './FreelanceJobCard';
import FreelanceJobModal from './FreelanceJobModal';
import FreelanceConfirmDeleteModal from './FreelanceConfirmDeleteModal';
import ChatDmModal from '../chat/ChatDmModal';

export default function FreelanceBoard({ currentUser, addToast }) {
  const [jobs, setJobs] = useState([]);
  const [canPublish, setCanPublish] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mineOnly, setMineOnly] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dmTargetContact, setDmTargetContact] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listFreelanceJobs({
        status: statusFilter,
        category: categoryFilter,
        search: searchTerm,
        mineOnly,
      });
      setJobs(data.items || []);
      setCanPublish(Boolean(data.can_publish));
    } catch (err) {
      if (addToast) addToast(err.message || 'Erro ao carregar vagas.', 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchTerm, mineOnly, addToast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSaveJob = async (payload) => {
    setSubmitting(true);
    try {
      if (editingJob) {
        await updateFreelanceJob(editingJob.id, payload);
        if (addToast) addToast('Oportunidade atualizada com sucesso!', 'success');
      } else {
        await createFreelanceJob(payload);
        if (addToast) addToast('Vaga publicada no mural de freelancers!', 'success');
      }
      setIsModalOpen(false);
      setEditingJob(null);
      fetchJobs();
    } catch (err) {
      if (addToast) addToast(err.message || 'Erro ao salvar vaga.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (job) => {
    const nextStatus = job.status === 'open' ? 'closed' : 'open';
    try {
      await updateFreelanceJob(job.id, { status: nextStatus });
      if (addToast) {
        addToast(nextStatus === 'closed' ? 'Vaga marcada como encerrada.' : 'Vaga reaberta com sucesso!', 'success');
      }
      fetchJobs();
    } catch (err) {
      if (addToast) addToast(err.message || 'Erro ao alterar status da vaga.', 'error');
    }
  };

  const handleConfirmDelete = async (jobId) => {
    setDeleting(true);
    try {
      await deleteFreelanceJob(jobId);
      if (addToast) addToast('Vaga excluída com sucesso!', 'success');
      setJobToDelete(null);
      fetchJobs();
    } catch (err) {
      if (addToast) addToast(err.message || 'Erro ao excluir vaga.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div data-testid="freelance-board" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Briefcase size={24} color="#38bdf8" />
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#ffffff' }}>
              Vagas &amp; Serviços
            </h1>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>
            Publique demandas para contratar membros da comunidade ou encontre oportunidades abertas.
          </p>
        </div>

        {canPublish && (
          <button
            type="button"
            data-testid="open-create-freelance-btn"
            onClick={() => {
              setEditingJob(null);
              setIsModalOpen(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Plus size={16} />
            <span>Publicar Vaga</span>
          </button>
        )}
      </div>

      {/* Barra de Filtros */}
      <div
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: '1 1 240px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '6px 12px',
          }}
        >
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            data-testid="freelance-search-input"
            placeholder="Buscar por título, habilidade ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '0.85rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} color="#94a3b8" />
          <select
            data-testid="freelance-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '7px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              color: '#f8fafc',
              fontSize: '0.8125rem',
            }}
          >
            <option value="all">Todas as categorias</option>
            {FREELANCE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <select
          data-testid="freelance-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '7px 10px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            color: '#f8fafc',
            fontSize: '0.8125rem',
          }}
        >
          <option value="all">Todos os status</option>
          <option value="open">Abertas</option>
          <option value="closed">Encerradas</option>
        </select>

        {canPublish && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#cbd5e1', cursor: 'pointer' }}>
            <input
              type="checkbox"
              data-testid="freelance-mine-only-checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
            />
            <span>Minhas vagas</span>
          </label>
        )}
      </div>

      {/* Listagem */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '10px', color: '#94a3b8' }}>
          <Loader2 size={22} className="animate-spin" color="#38bdf8" />
          <span>Carregando oportunidades...</span>
        </div>
      ) : jobs.length === 0 ? (
        <div
          data-testid="freelance-empty-state"
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
            borderRadius: '14px',
            color: '#94a3b8',
          }}
        >
          Nenhuma oportunidade de freelancer encontrada com esses filtros.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
          {jobs.map((job) => (
            <FreelanceJobCard
              key={job.id}
              job={job}
              currentUser={currentUser}
              onOpenDm={(author) => setDmTargetContact(author)}
              onEdit={(target) => {
                setEditingJob(target);
                setIsModalOpen(true);
              }}
              onToggleStatus={handleToggleStatus}
              onRequestDelete={(target) => setJobToDelete(target)}
            />
          ))}
        </div>
      )}

      <FreelanceJobModal
        isOpen={isModalOpen}
        editingJob={editingJob}
        onClose={() => {
          setIsModalOpen(false);
          setEditingJob(null);
        }}
        onSubmit={handleSaveJob}
        submitting={submitting}
      />

      <FreelanceConfirmDeleteModal
        job={jobToDelete}
        loading={deleting}
        onCancel={() => setJobToDelete(null)}
        onConfirm={handleConfirmDelete}
      />

      {dmTargetContact && (
        <ChatDmModal
          isOpen={Boolean(dmTargetContact)}
          onClose={() => setDmTargetContact(null)}
          currentUser={currentUser}
          targetContact={dmTargetContact}
        />
      )}
    </div>
  );
}
