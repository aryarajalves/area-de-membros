import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquareQuote,
  Star,
  CheckCircle2,
  Clock,
  Plus,
  Filter,
  Search,
  BookOpen
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import TestimonialCard from './TestimonialCard';
import TestimonialModal from './TestimonialModal';
import TestimonialDeleteModal from './TestimonialDeleteModal';

export default function TestimonialsManagement({ user }) {
  const { addToast } = useToast();
  const isManager = ['admin', 'superadmin'].includes(user?.role);

  const [testimonials, setTestimonials] = useState([]);
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, average_rating: 5.0 });
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(isManager ? 'all' : 'approved');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [saving, setSaving] = useState(false);

  // Cursos que o usuário atual já avaliou
  const userReviewedCourseIds = useMemo(() => {
    return new Set(
      testimonials
        .filter((t) => t.user_id === user?.id)
        .map((t) => t.course_id)
    );
  }, [testimonials, user?.id]);


  const [deletingTestimonial, setDeletingTestimonial] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  // Carrega lista de cursos disponíveis
  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/v1/courses', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        // Aluno só pode escolher cursos que tem acesso liberado
        const available = user?.role === 'aluno'
          ? data.filter((c) => c.has_access)
          : data;
        setCourses(available);
      }
    } catch (err) {
      console.error('Erro ao carregar cursos:', err);
    }
  };

  // Carrega depoimentos
  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCourseId) params.append('course_id', selectedCourseId);
      if (isManager && selectedStatus !== 'all') params.append('status', selectedStatus);

      const qs = params.toString() ? `?${params.toString()}` : '';
      const statsQs = selectedCourseId ? `?course_id=${selectedCourseId}` : '';

      const [resTestimonials, resStats] = await Promise.all([
        fetch(`/api/v1/testimonials${qs}`, { headers: getHeaders() }),
        fetch(`/api/v1/testimonials/stats${statsQs}`, { headers: getHeaders() })
      ]);

      if (resTestimonials.ok) {
        const data = await resTestimonials.json();
        setTestimonials(data);
      }
      if (resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Erro ao carregar depoimentos:', err);
      addToast('Erro ao carregar depoimentos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [selectedCourseId, selectedStatus]);

  // Salvar / Editar Depoimento
  const handleSaveTestimonial = async (data) => {
    setSaving(true);
    try {
      const url = editingTestimonial
        ? `/api/v1/testimonials/${editingTestimonial.id}`
        : '/api/v1/testimonials';
      const method = editingTestimonial ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Erro ao salvar depoimento.');
      }

      addToast(
        editingTestimonial
          ? 'Depoimento atualizado com sucesso!'
          : 'Depoimento enviado com sucesso! Ele passará pela moderação antes de ser publicado.',
        'success'
      );
      setIsModalOpen(false);
      setEditingTestimonial(null);
      fetchTestimonials();
    } catch (err) {
      addToast(err.message || 'Erro ao salvar depoimento.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Moderar status (Aprovar / Rejeitar)
  const handleModerate = async (testimonialId, newStatus) => {
    try {
      const res = await fetch(`/api/v1/testimonials/${testimonialId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Erro ao moderar depoimento.');
      }
      addToast(newStatus === 'approved' ? 'Depoimento aprovado com sucesso!' : 'Depoimento rejeitado.', 'success');
      fetchTestimonials();
    } catch (err) {
      addToast(err.message || 'Erro ao moderar depoimento.', 'error');
    }
  };

  // Alternar destaque
  const handleToggleFeature = async (testimonialId, isFeatured) => {
    try {
      const res = await fetch(`/api/v1/testimonials/${testimonialId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ is_featured: isFeatured })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Erro ao atualizar destaque.');
      }
      addToast(isFeatured ? 'Depoimento destacado!' : 'Destaque removido.', 'success');
      fetchTestimonials();
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar destaque.', 'error');
    }
  };

  // Confirmar Exclusão
  const handleConfirmDelete = async () => {
    if (!deletingTestimonial) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/testimonials/${deletingTestimonial.id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Erro ao excluir depoimento.');
      }
      addToast('Depoimento excluído com sucesso.', 'success');
      setDeletingTestimonial(null);
      fetchTestimonials();
    } catch (err) {
      addToast(err.message || 'Erro ao excluir depoimento.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filtro textual local por título, aluno ou conteúdo
  const filteredTestimonials = useMemo(() => {
    if (!searchTerm.trim()) return testimonials;
    const term = searchTerm.toLowerCase();
    return testimonials.filter(
      (t) =>
        t.title?.toLowerCase().includes(term) ||
        t.content?.toLowerCase().includes(term) ||
        t.user?.name?.toLowerCase().includes(term) ||
        t.course?.title?.toLowerCase().includes(term)
    );
  }, [testimonials, searchTerm]);

  return (
    <div className="testimonials-management-page" style={{ padding: '24px', maxWidth: '1280px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '10px', borderRadius: '12px', color: '#3b82f6' }}>
              <MessageSquareQuote size={26} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700, color: '#f8fafc' }}>
                Depoimentos dos Cursos
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#94a3b8' }}>
                {isManager
                  ? 'Gerencie, modere e destaque os depoimentos e avaliações enviados pelos alunos.'
                  : 'Veja o que os alunos dizem sobre os cursos e compartilhe sua própria experiência.'}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTestimonial(null);
            setIsModalOpen(true);
          }}
          disabled={courses.length === 0}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            padding: '10px 18px',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: courses.length === 0 ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            opacity: courses.length === 0 ? 0.6 : 1,
            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)'
          }}
          data-testid="open-create-testimonial-btn"
        >
          <Plus size={18} />
          <span>Deixar Depoimento</span>
        </button>
      </div>

      {/* Cards de Métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MessageSquareQuote size={14} /> Total de Depoimentos
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '6px', color: '#f8fafc' }} data-testid="metric-total">{stats.total}</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} /> Aprovados
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '6px', color: '#4ade80' }} data-testid="metric-approved">{stats.approved}</div>
        </div>

        {isManager && (
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(234, 179, 8, 0.2)', borderRadius: '12px', padding: '16px' }}>
            <div style={{ fontSize: '0.8rem', color: '#facc15', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Pendentes de Moderação
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '6px', color: '#facc15' }} data-testid="metric-pending">{stats.pending}</div>
          </div>
        )}

        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '0.8rem', color: '#eab308', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Star size={14} /> Nota Média
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '6px', color: '#eab308' }} data-testid="metric-avg-rating">
            ⭐ {stats.average_rating.toFixed(1)} / 5.0
          </div>
        </div>
      </div>


      {/* Barra de Filtros */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
        {/* Filtro por Curso */}
        <div style={{ minWidth: '200px' }}>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              fontSize: '0.88rem',
              outline: 'none'
            }}
            data-testid="filter-course-select"
          >
            <option value="">Todos os Cursos</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro por Status (apenas para gerentes) */}
        {isManager && (
          <div style={{ minWidth: '160px' }}>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '10px',
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '0.88rem',
                outline: 'none'
              }}
              data-testid="filter-status-select"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Aguardando Moderação</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
        )}

        {/* Busca textual */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Buscar por aluno, curso ou palavra-chave..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              borderRadius: '10px',
              background: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#f8fafc',
              fontSize: '0.88rem',
              outline: 'none'
            }}
            data-testid="search-testimonials-input"
          />
        </div>
      </div>

      {/* Grid de Depoimentos */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          Carregando depoimentos...
        </div>
      ) : filteredTestimonials.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: '16px',
            border: '1px dashed rgba(255, 255, 255, 0.15)'
          }}
          data-testid="empty-testimonials-state"
        >
          <MessageSquareQuote size={48} style={{ color: '#64748b', marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 6px 0', color: '#f8fafc', fontSize: '1.1rem' }}>
            Nenhum depoimento encontrado
          </h3>
          <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '0.88rem' }}>
            {searchTerm || selectedCourseId
              ? 'Tente ajustar os filtros ou o termo de busca para encontrar depoimentos.'
              : 'Seja o primeiro a compartilhar sua experiência e deixar um depoimento!'}
          </p>
          {courses.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setEditingTestimonial(null);
                setIsModalOpen(true);
              }}
              style={{
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              data-testid="empty-create-testimonial-btn"
            >
              Deixar Meu Depoimento
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '20px'
          }}
          data-testid="testimonials-grid"
        >
          {filteredTestimonials.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              currentUser={user}
              onEdit={(t) => {
                setEditingTestimonial(t);
                setIsModalOpen(true);
              }}
              onDelete={(t) => setDeletingTestimonial(t)}
              onModerate={handleModerate}
              onToggleFeature={handleToggleFeature}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <TestimonialModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTestimonial(null);
        }}
        onSubmit={handleSaveTestimonial}
        editingTestimonial={editingTestimonial}
        availableCourses={courses}
        userReviewedCourseIds={userReviewedCourseIds}
        saving={saving}
      />

      {/* Modal de Exclusão */}
      <TestimonialDeleteModal
        isOpen={Boolean(deletingTestimonial)}
        onClose={() => setDeletingTestimonial(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
      />
    </div>
  );
}
