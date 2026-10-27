import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, RefreshCw, AlertCircle, Video, CheckCircle2 } from 'lucide-react';
import EventCard from './EventCard';
import EventFormModal from './EventFormModal';
import DeleteEventConfirmModal from './DeleteEventConfirmModal';
import { getEventStatus } from './googleCalendarHelper';
import './events.css';

export default function EventsManagement({
  currentUser,
  bgColor = '#090d16',
  addToast,
  onNavigateTab,
}) {
  const [events, setEvents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activeFilter, setActiveFilter] = useState('upcoming'); // 'upcoming', 'past', 'all'
  const [isLoading, setIsLoading] = useState(true);

  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdmin = ['superadmin', 'admin'].includes(currentUser?.role);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const res = await fetch('/api/v1/events', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Falha ao carregar eventos');
      }

      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
      addToast?.('Erro ao carregar lista de eventos.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const fetchCourses = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const res = await fetch('/api/v1/courses', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error('Erro ao buscar cursos:', err);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchEvents();
    fetchCourses();
  }, [fetchEvents, fetchCourses]);

  const handleOpenCreateModal = () => {
    setEditingEvent(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEditingEvent(event);
    setIsFormModalOpen(true);
  };

  const handleSaveEvent = async (payload) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    const isEdit = Boolean(editingEvent);
    const url = isEdit ? `/api/v1/events/${editingEvent.id}` : '/api/v1/events';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      addToast?.(errData.detail || 'Erro ao salvar evento.', 'error');
      throw new Error(errData.detail || 'Erro ao salvar');
    }

    addToast?.(isEdit ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!', 'success');
    setIsFormModalOpen(false);
    setEditingEvent(null);
    fetchEvents();
  };

  const handleConfirmDelete = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/events/${deletingEvent.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Falha ao excluir evento');
      }

      addToast?.('Evento excluído com sucesso!', 'success');
      setDeletingEvent(null);
      fetchEvents();
    } catch (err) {
      console.error('Erro ao excluir evento:', err);
      addToast?.('Erro ao excluir evento.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUnlockCourse = (event) => {
    if (event.course_sales_page_url) {
      window.open(event.course_sales_page_url, '_blank');
    } else if (onNavigateTab) {
      onNavigateTab('courses');
    }
  };

  // Filtragem dos eventos de acordo com a aba selecionada
  const filteredEvents = events.filter((ev) => {
    const status = getEventStatus(ev.start_time, ev.end_time);
    if (activeFilter === 'upcoming') {
      return status === 'upcoming' || status === 'live';
    }
    if (activeFilter === 'past') {
      return status === 'past';
    }
    return true; // 'all'
  });

  return (
    <div
      className="events-page-container"
      style={{
        backgroundColor: bgColor,
        minHeight: '100vh',
        padding: '32px 28px',
        color: '#f8fafc',
      }}
    >
      {/* Header */}
      <div className="events-header">
        <div className="events-header-titles">
          <div className="events-header-icon">
            <Calendar size={24} />
          </div>
          <div>
            <h1 className="events-title">Eventos & Aulas Ao Vivo</h1>
            <p className="events-subtitle">
              Acompanhe as mentorias, lives e encontros oficiais da comunidade (Horário de Brasília)
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            type="button"
            data-testid="create-event-btn"
            onClick={handleOpenCreateModal}
            className="events-create-btn"
          >
            <Plus size={18} />
            Novo Evento
          </button>
        )}
      </div>

      {/* Abas de Navegação / Filtros */}
      <div className="events-tabs-bar">
        <div className="events-tabs-group">
          <button
            type="button"
            data-testid="filter-upcoming-btn"
            onClick={() => setActiveFilter('upcoming')}
            className={`events-tab-btn ${activeFilter === 'upcoming' ? 'active' : ''}`}
          >
            <Calendar size={15} />
            Próximos & Ao Vivo
          </button>
          <button
            type="button"
            data-testid="filter-past-btn"
            onClick={() => setActiveFilter('past')}
            className={`events-tab-btn ${activeFilter === 'past' ? 'active' : ''}`}
          >
            <CheckCircle2 size={15} />
            Anteriores & Gravações
          </button>
          {isAdmin && (
            <button
              type="button"
              data-testid="filter-all-btn"
              onClick={() => setActiveFilter('all')}
              className={`events-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
            >
              Todos os Eventos ({events.length})
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={fetchEvents}
          title="Recarregar"
          className="events-refresh-btn"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Conteúdo Principal / Grid de Cards */}
      {isLoading ? (
        <div className="events-loading-state">
          <div className="events-spinner" />
          <p>Carregando eventos...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="events-empty-state">
          <div className="events-empty-icon">
            <Calendar size={48} />
          </div>
          <h3 className="events-empty-title">
            {activeFilter === 'upcoming'
              ? 'Nenhum evento agendado no momento'
              : activeFilter === 'past'
              ? 'Nenhum evento anterior registrado'
              : 'Nenhum evento cadastrado'}
          </h3>
          <p className="events-empty-description">
            {activeFilter === 'upcoming'
              ? 'Fique atento! Novas lives e mentorias com o expert serão anunciadas em breve aqui na agenda.'
              : 'As gravações das mentorias passadas ficarão disponíveis nesta seção.'}
          </p>
          {isAdmin && activeFilter === 'upcoming' && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="events-create-btn"
              style={{ marginTop: '16px' }}
            >
              <Plus size={16} />
              Criar Primeiro Evento
            </button>
          )}
        </div>
      ) : (
        <div className="events-grid">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isAdmin={isAdmin}
              onEdit={handleOpenEditModal}
              onDelete={setDeletingEvent}
              onUnlockCourse={handleUnlockCourse}
              addToast={addToast}
            />
          ))}
        </div>
      )}

      {/* Modais */}
      <EventFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        eventData={editingEvent}
        courses={courses}
        addToast={addToast}
      />

      <DeleteEventConfirmModal
        isOpen={Boolean(deletingEvent)}
        eventTitle={deletingEvent?.title || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingEvent(null)}
        isDeleting={isDeleting}
      />
    </div>
  );
}
