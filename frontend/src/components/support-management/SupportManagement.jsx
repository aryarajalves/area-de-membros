import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, BookOpen, Filter, MessageCircleQuestion, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import SupportTopicCard from './SupportTopicCard';
import NewSupportTopicModal from './NewSupportTopicModal';
import SupportTopicDetailModal from './SupportTopicDetailModal';
import DeleteSupportConfirmModal from './DeleteSupportConfirmModal';
import SupportStatsCards from './SupportStatsCards';
import SupportFilterPills from './SupportFilterPills';

export default function SupportManagement({ currentUser, bgColor }) {
  const [courses, setCourses] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'popular' | 'unanswered'
  const [activePillFilter, setActivePillFilter] = useState('all');

  // Métricas
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Modais
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState(null);
  const [deletingTopic, setDeletingTopic] = useState(false);

  const { addToast } = useToast();

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/support/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch {
      // Ignora erro silencioso
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch('/api/v1/support/my-courses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCourses(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignora erro silencioso
    }
  }, []);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('search', searchQuery.trim());
    if (selectedCourseId) params.append('course_id', selectedCourseId);

    // Mapeamento do filtro de pílulas rápidas
    if (activePillFilter === 'resolved') {
      params.append('status', 'resolved');
    } else if (activePillFilter === 'unanswered') {
      params.append('status', 'open');
      params.append('sort_by', 'unanswered');
    } else if (activePillFilter === 'popular') {
      params.append('sort_by', 'popular');
    } else if (activePillFilter === 'my_topics') {
      params.append('sort_by', 'my_topics');
    } else if (sortBy) {
      params.append('sort_by', sortBy);
    }

    try {
      const res = await fetch(`/api/v1/support/topics?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTopics(data.items || []);
      } else {
        addToast(data.detail || 'Erro ao carregar dúvidas.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Erro ao carregar dúvidas.', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCourseId, sortBy, activePillFilter, addToast]);

  useEffect(() => {
    fetchCourses();
    fetchStats();
  }, [fetchCourses, fetchStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTopics();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchTopics]);

  const handleToggleLike = async (topicId) => {
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/support/topics/${topicId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setTopics((prev) =>
          prev.map((t) =>
            t.id === topicId
              ? { ...t, liked_by_me: data.liked, likes_count: data.likes_count }
              : t
          )
        );
      }
    } catch {
      // Ignora
    }
  };

  const handleOpenDetail = (topic) => {
    setSelectedTopicId(topic.id);
    setIsDetailModalOpen(true);
  };

  const confirmDeleteTopic = async () => {
    if (!topicToDelete) return;
    setDeletingTopic(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/support/topics/${topicToDelete.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao excluir dúvida.');
      addToast('Dúvida excluída com sucesso.', 'success');
      setTopics((prev) => prev.filter((t) => t.id !== topicToDelete.id));
      fetchStats();
      if (selectedTopicId === topicToDelete.id) {
        setIsDetailModalOpen(false);
      }
      setTopicToDelete(null);
    } catch (err) {
      addToast(err.message || 'Falha ao excluir dúvida.', 'error');
    } finally {
      setDeletingTopic(false);
    }
  };

  return (
    <div
      style={{
        padding: '32px 24px',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100%',
        backgroundColor: bgColor || 'transparent',
      }}
      data-testid="support-management-container"
    >
      {/* Top Header Cinemático */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sparkles size={12} />
              Comunidade VIP & Dúvidas
            </span>
          </div>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 800,
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            <MessageCircleQuestion size={28} color="#38bdf8" />
            Suporte e Dúvidas
          </h1>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Tire suas dúvidas técnicas, colabore com os alunos e receba soluções oficiais dos instrutores.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewTopicModalOpen(true)}
          style={{
            padding: '11px 22px',
            backgroundColor: '#0284c7',
            color: '#fff',
            fontWeight: 700,
            fontSize: '14px',
            borderRadius: '12px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 8px 20px -4px rgba(2, 132, 199, 0.5)',
            transition: 'all 0.2s ease',
          }}
          data-testid="open-new-topic-btn"
        >
          <Plus size={18} />
          Fazer uma pergunta
        </button>
      </div>

      {/* Cards de Métricas */}
      <SupportStatsCards stats={stats} loading={loadingStats} />

      {/* Pílulas de Filtros Rápidos */}
      <SupportFilterPills
        activeFilter={activePillFilter}
        onSelectFilter={(pillKey) => setActivePillFilter(pillKey)}
        stats={stats}
      />

      {/* Barra de Filtros e Busca */}
      <div
        style={{
          backgroundColor: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        {/* Campo de Busca */}
        <div
          style={{
            flex: '1 1 260px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Pesquisar dúvidas de alunos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
            }}
            data-testid="search-topics-input"
          />
        </div>

        {/* Filtro por Curso */}
        <div style={{ flex: '0 1 220px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={16} color="#94a3b8" />
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
            data-testid="filter-course-select"
          >
            <option value="">Todos os cursos</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* Ordenação */}
        <div style={{ flex: '0 1 200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#94a3b8" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
            data-testid="sort-topics-select"
          >
            <option value="recent">Mais recentes</option>
            <option value="popular">Mais curtidas</option>
            <option value="unanswered">Sem resposta</option>
          </select>
        </div>
      </div>

      {/* Lista de Dúvidas */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <Loader2 size={36} className="spin-animation" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: '14px' }}>Buscando dúvidas...</p>
        </div>
      ) : topics.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: 'rgba(30, 41, 59, 0.3)',
            borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.12)',
          }}
          data-testid="empty-topics-state"
        >
          <MessageCircleQuestion size={44} color="#64748b" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#f8fafc', marginBottom: '8px' }}>
            Nenhuma dúvida encontrada
          </h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '400px', margin: '0 auto 20px' }}>
            {searchQuery || selectedCourseId
              ? 'Nenhum resultado corresponde aos filtros aplicados. Tente ajustar os termos.'
              : 'Ainda não há dúvidas publicadas para estes cursos. Seja o primeiro a perguntar!'}
          </p>
          <button
            type="button"
            onClick={() => setIsNewTopicModalOpen(true)}
            style={{
              padding: '8px 18px',
              backgroundColor: '#0284c7',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
            }}
            data-testid="empty-new-topic-btn"
          >
            Criar primeira publicação
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {topics.map((topic) => (
            <SupportTopicCard
              key={topic.id}
              topic={topic}
              currentUser={currentUser}
              onClick={() => handleOpenDetail(topic)}
              onCommentClick={() => handleOpenDetail(topic)}
              onLike={() => handleToggleLike(topic.id)}
              onToggleLike={() => handleToggleLike(topic.id)}
              onDelete={() => setTopicToDelete(topic)}
              onDeleteTopic={() => setTopicToDelete(topic)}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      <NewSupportTopicModal
        isOpen={isNewTopicModalOpen}
        onClose={() => setIsNewTopicModalOpen(false)}
        courses={courses}
        onTopicCreated={(newTopic) => {
          setTopics((prev) => [newTopic, ...prev]);
          fetchStats();
        }}
      />

      <SupportTopicDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTopicId(null);
        }}
        topicId={selectedTopicId}
        currentUser={currentUser}
        onTopicDeleted={(id) => {
          setTopics((prev) => prev.filter((t) => t.id !== id));
          fetchStats();
        }}
        onRequestDeleteTopic={(topic) => setTopicToDelete(topic)}
        onTopicUpdated={(updated) => {
          setTopics((prev) =>
            prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
          );
          fetchStats();
        }}
        onReplyAdded={() => {
          fetchTopics();
          fetchStats();
        }}
      />

      <DeleteSupportConfirmModal
        isOpen={Boolean(topicToDelete)}
        title="Excluir dúvida"
        message="Tem certeza que deseja apagar esta dúvida e todas as suas respostas? Esta ação não pode ser desfeita."
        loading={deletingTopic}
        onConfirm={confirmDeleteTopic}
        onClose={() => setTopicToDelete(null)}
      />
    </div>
  );
}
