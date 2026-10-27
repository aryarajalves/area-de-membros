import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, Video, PlayCircle, ExternalLink, Lock,
  Pencil, Trash2, CalendarPlus, CheckCircle2
} from 'lucide-react';
import {
  formatBrasiliaDate,
  getEventStatus,
  generateGoogleCalendarUrl,
} from './googleCalendarHelper';
import ConfirmAttendanceModal from './ConfirmAttendanceModal';

export default function EventCard({
  event,
  isAdmin = false,
  onEdit,
  onDelete,
  onUnlockCourse,
  addToast,
}) {
  const [isConfirmed, setIsConfirmed] = useState(!!event.is_confirmed);
  const [attendeesCount, setAttendeesCount] = useState(event.attendees_count || 0);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  useEffect(() => {
    setIsConfirmed(!!event.is_confirmed);
    setAttendeesCount(event.attendees_count || 0);
  }, [event.is_confirmed, event.attendees_count]);

  const handleExecuteConfirm = async () => {
    setLoadingConfirm(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/events/${event.id}/confirm-attendance`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok) {
        setIsConfirmed(data.is_confirmed);
        setAttendeesCount(data.attendees_count);
        addToast?.(data.message, 'success');
        setIsConfirmModalOpen(false);
      } else {
        addToast?.(data.detail || 'Erro ao confirmar presença.', 'error');
      }
    } catch {
      addToast?.('Erro de conexão ao confirmar presença.', 'error');
    } finally {
      setLoadingConfirm(false);
    }
  };

  const status = getEventStatus(event.start_time, event.end_time);
  const googleCalendarUrl = generateGoogleCalendarUrl({
    title: event.title,
    description: event.description || '',
    startTime: event.start_time,
    endTime: event.end_time,
    meetingUrl: event.meeting_url || '',
  });

  const formattedStart = formatBrasiliaDate(event.start_time);
  const formattedEnd = event.end_time ? formatBrasiliaDate(event.end_time).split('às')[1] : null;

  return (
    <div
      data-testid={`event-card-${event.id}`}
      style={{
        background: 'linear-gradient(145deg, rgba(19, 27, 46, 0.85), rgba(11, 17, 32, 0.95))',
        border: status === 'live'
          ? '1.5px solid rgba(239, 68, 68, 0.65)'
          : event.has_access === false
          ? '1px solid rgba(234, 179, 8, 0.3)'
          : '1px solid rgba(59, 130, 246, 0.22)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: status === 'live'
          ? '0 10px 30px -10px rgba(239, 68, 68, 0.35), 0 0 20px rgba(239, 68, 68, 0.15)'
          : '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.25s ease',
        position: 'relative',
      }}
    >
      {/* Top Banner / Thumbnail */}
      <div
        style={{
          width: '100%',
          height: '170px',
          position: 'relative',
          backgroundColor: '#0a0f1d',
          overflow: 'hidden',
        }}
      >
        {event.thumbnail_url ? (
          <img
            src={event.thumbnail_url}
            alt={event.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: event.has_access === false ? 'brightness(0.65) saturate(0.8)' : 'none',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6',
            }}
          >
            <Video size={48} opacity={0.6} />
          </div>
        )}

        {/* Badges de Status Flutuantes */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {status === 'live' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '0.04em',
                boxShadow: '0 0 14px rgba(239, 68, 68, 0.7)',
                animation: 'pulse 1.8s infinite',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
              AO VIVO AGORA
            </span>
          )}

          {status === 'upcoming' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: 'rgba(59, 130, 246, 0.85)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: '600',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Clock size={12} />
              EM BREVE
            </span>
          )}

          {status === 'past' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: 'rgba(100, 116, 139, 0.75)',
                color: '#e2e8f0',
                fontSize: '0.75rem',
                fontWeight: '600',
                backdropFilter: 'blur(4px)',
              }}
            >
              <CheckCircle2 size={12} />
              ENCERRADO
            </span>
          )}

          {event.target_type === 'course' && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '20px',
                background: event.has_access === false ? 'rgba(234, 179, 8, 0.9)' : 'rgba(16, 185, 129, 0.85)',
                color: event.has_access === false ? '#0f172a' : '#fff',
                fontSize: '0.75rem',
                fontWeight: '700',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Lock size={11} />
              {event.course_title ? `Exclusivo: ${event.course_title}` : 'Curso Exclusivo'}
            </span>
          )}
        </div>

        {/* Botões de Ação do Admin no Topo Direito */}
        {isAdmin && (
          <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '6px' }}>
            <button
              type="button"
              data-testid={`edit-event-btn-${event.id}`}
              onClick={() => onEdit(event)}
              title="Editar Evento"
              style={{
                padding: '7px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#93c5fd',
                cursor: 'pointer',
                display: 'flex',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              data-testid={`delete-event-btn-${event.id}`}
              onClick={() => onDelete(event)}
              title="Excluir Evento"
              style={{
                padding: '7px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                cursor: 'pointer',
                display: 'flex',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, gap: '14px' }}>
        {/* Data e Horário em Destaque */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa', fontSize: '0.85rem', fontWeight: '600' }}>
          <Calendar size={15} />
          <span>
            {formattedStart}
            {formattedEnd ? ` às${formattedEnd}` : ''}
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px' }}>(Horário de Brasília)</span>
          </span>
        </div>

        {/* Título */}
        <h3
          style={{
            fontSize: '1.15rem',
            fontWeight: '700',
            color: '#f8fafc',
            margin: 0,
            lineHeight: '1.4',
          }}
        >
          {event.title}
        </h3>

        {/* Descrição */}
        {event.description && (
          <p
            style={{
              fontSize: '0.88rem',
              color: '#94a3b8',
              margin: 0,
              lineHeight: '1.5',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {event.description}
          </p>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
          {/* Caso o Aluno NÃO TENHA ACESSO (Upsell) */}
          {event.has_access === false ? (
            <div
              style={{
                padding: '12px',
                borderRadius: '10px',
                background: 'rgba(234, 179, 8, 0.08)',
                border: '1px solid rgba(234, 179, 8, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#facc15', fontSize: '0.82rem', fontWeight: '600' }}>
                <Lock size={15} />
                <span>Conteúdo fechado para o seu plano atual</span>
              </div>
              <button
                type="button"
                data-testid={`unlock-course-btn-${event.id}`}
                onClick={() => onUnlockCourse?.(event)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #eab308, #ca8a04)',
                  border: 'none',
                  color: '#0f172a',
                  fontWeight: '700',
                  fontSize: '0.86rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(234, 179, 8, 0.3)',
                }}
              >
                <ExternalLink size={15} />
                Desbloquear Acesso ao Curso
              </button>
            </div>
          ) : (
            /* Caso o Aluno TENHA ACESSO */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Botão de Transmissão Ao Vivo (se disponível) */}
              {event.meeting_url && (
                <a
                  href={event.meeting_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`join-meeting-btn-${event.id}`}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: status === 'live'
                      ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                      : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '0.88rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: status === 'live'
                      ? '0 4px 14px rgba(239, 68, 68, 0.45)'
                      : '0 4px 12px rgba(59, 130, 246, 0.35)',
                  }}
                >
                  <Video size={16} />
                  {status === 'live' ? 'Entrar no Evento Agora' : 'Acessar Link da Transmissão'}
                </a>
              )}

              {/* Botão de Gravação (se disponível) */}
              {event.recording_url && (
                <a
                  href={event.recording_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`watch-recording-btn-${event.id}`}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#34d399',
                    fontWeight: '600',
                    fontSize: '0.86rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <PlayCircle size={16} />
                  Assistir Gravação
                </a>
              )}

              {/* Botão Confirmar Participação no Evento (Abre popup central de confirmação) */}
              {status !== 'past' && (
                <button
                  type="button"
                  disabled={loadingConfirm}
                  onClick={() => setIsConfirmModalOpen(true)}
                  data-testid={`confirm-attendance-btn-${event.id}`}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: '8px',
                    background: isConfirmed
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.35))'
                      : 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.25))',
                    border: isConfirmed ? '1.5px solid #10b981' : '1px solid rgba(168, 85, 247, 0.4)',
                    color: isConfirmed ? '#a7f3d0' : '#f3e8ff',
                    fontWeight: '600',
                    fontSize: '0.84rem',
                    cursor: loadingConfirm ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: isConfirmed ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none',
                  }}
                >
                  <CheckCircle2 size={16} color={isConfirmed ? '#34d399' : '#c084fc'} />
                  <span>
                    {loadingConfirm
                      ? 'Processando...'
                      : isConfirmed
                      ? `Presença Confirmada ✓ ${attendeesCount > 0 ? `(${attendeesCount})` : ''}`
                      : `Confirmar Participação no Evento ${attendeesCount > 0 ? `(${attendeesCount})` : ''}`}
                  </span>
                </button>
              )}

              {/* Botão Adicionar ao Google Agenda (para eventos futuros ou ao vivo) */}
              {status !== 'past' && googleCalendarUrl && (
                <a
                  href={googleCalendarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`add-calendar-btn-${event.id}`}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#cbd5e1',
                    fontWeight: '500',
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  <CalendarPlus size={14} color="#60a5fa" />
                  Adicionar ao Google Agenda
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Popup no Centro da Tela para Confirmar Participação */}
      <ConfirmAttendanceModal
        isOpen={isConfirmModalOpen}
        event={event}
        isConfirmed={isConfirmed}
        onConfirm={handleExecuteConfirm}
        onCancel={() => setIsConfirmModalOpen(false)}
        isLoading={loadingConfirm}
      />
    </div>
  );
}
