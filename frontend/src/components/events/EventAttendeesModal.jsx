import React, { useState, useEffect } from 'react';
import { Users, Search, Loader2, CheckCircle2, Mail, Phone, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatBrasiliaDate } from './googleCalendarHelper';

const ATTENDEES_PER_PAGE = 5;

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function EventAttendeesModal({ isOpen, event, onClose, addToast }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isOpen || !event?.id) return;
    let isMounted = true;

    const fetchAttendees = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`/api/v1/events/${event.id}/attendees`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.detail || 'Erro ao carregar participantes do evento.');
        }
        if (isMounted) {
          setAttendees(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (isMounted) {
          addToast?.(err.message || 'Erro ao carregar participantes.', 'error');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setSearch('');
    setCurrentPage(1);
    fetchAttendees();
    return () => {
      isMounted = false;
    };
  }, [isOpen, event?.id, addToast]);

  if (!isOpen || !event) return null;

  const filteredAttendees = search.trim()
    ? attendees.filter((att) => {
        const term = search.trim().toLowerCase();
        return (
          (att.name || '').toLowerCase().includes(term) ||
          (att.email || '').toLowerCase().includes(term) ||
          (att.phone || '').toLowerCase().includes(term)
        );
      })
    : attendees;

  const totalPages = Math.max(1, Math.ceil(filteredAttendees.length / ATTENDEES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedAttendees = filteredAttendees.slice(
    (safePage - 1) * ATTENDEES_PER_PAGE,
    safePage * ATTENDEES_PER_PAGE
  );

  return (
    <div
      data-testid="event-attendees-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '86vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Users size={20} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h2
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: '#f8fafc',
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Participantes Confirmados
              </h2>
              <p
                style={{
                  fontSize: '12.5px',
                  color: '#94a3b8',
                  margin: '2px 0 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {event.title}
              </p>
            </div>
          </div>

          <span
            data-testid="event-attendees-total-badge"
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              flexShrink: 0,
            }}
          >
            {attendees.length} {attendees.length === 1 ? 'confirmado' : 'confirmados'}
          </span>
        </div>

        {/* Barra de Busca */}
        <div
          style={{
            padding: '14px 22px 10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={15}
              color="#64748b"
              style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar participante por nome, e-mail ou telefone..."
              data-testid="search-event-attendees-input"
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#f8fafc',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Lista de Participantes */}
        <div
          style={{
            padding: '16px 22px',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8' }}>
              <Loader2 size={28} className="spin-animation" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: '13.5px', margin: 0 }}>Carregando lista de participantes...</p>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div
              data-testid="empty-event-attendees"
              style={{
                textAlign: 'center',
                padding: '36px 16px',
                backgroundColor: 'rgba(30, 41, 59, 0.3)',
                borderRadius: '12px',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
              }}
            >
              <Users size={34} color="#64748b" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px 0' }}>
                {search.trim()
                  ? 'Nenhum participante encontrado para esta busca'
                  : 'Ninguém confirmou presença neste evento ainda'}
              </p>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
                {search.trim()
                  ? 'Tente pesquisar por outro nome ou e-mail.'
                  : 'Assim que os alunos clicarem em Confirmar Participação, os nomes aparecerão aqui.'}
              </p>
            </div>
          ) : (
            paginatedAttendees.map((att) => (
              <div
                key={att.user_id}
                data-testid={`event-attendee-item-${att.user_id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '11px',
                  backgroundColor: 'rgba(30, 41, 59, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 200px' }}>
                  {att.avatar_url ? (
                    <img
                      src={att.avatar_url}
                      alt={att.name}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: '#0284c7',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {getInitials(att.name)}
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#f8fafc',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {att.name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor:
                            att.role === 'superadmin' || att.role === 'admin'
                              ? 'rgba(56, 189, 248, 0.15)'
                              : 'rgba(16, 185, 129, 0.15)',
                          color:
                            att.role === 'superadmin' || att.role === 'admin'
                              ? '#38bdf8'
                              : '#34d399',
                          border:
                            att.role === 'superadmin' || att.role === 'admin'
                              ? '1px solid rgba(56, 189, 248, 0.35)'
                              : '1px solid rgba(16, 185, 129, 0.35)',
                        }}
                      >
                        {att.role === 'superadmin'
                          ? 'Super Admin'
                          : att.role === 'admin'
                            ? 'Admin'
                            : 'Aluno'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexWrap: 'wrap',
                        marginTop: '3px',
                        fontSize: '12px',
                        color: '#94a3b8',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
                        <Mail size={11} color="#64748b" style={{ flexShrink: 0 }} />
                        <span>{att.email}</span>
                      </span>
                      {att.phone && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                          <Phone size={11} color="#64748b" style={{ flexShrink: 0 }} />
                          <span>{att.phone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {att.confirmed_at && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      flexShrink: 0,
                      marginLeft: 'auto',
                      fontSize: '11px',
                      color: '#64748b',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#34d399',
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircle2 size={12} /> Confirmado
                    </span>
                    <span>{formatBrasiliaDate(att.confirmed_at)}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Rodapé com Paginação e Único Botão de Fechar */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: filteredAttendees.length > 0 ? 'space-between' : 'flex-end',
            flexWrap: 'wrap',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          {filteredAttendees.length > 0 && (
            <div
              data-testid="attendees-pagination"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                data-testid="attendees-prev-page-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  backgroundColor: safePage <= 1 ? 'rgba(30, 41, 59, 0.35)' : 'rgba(30, 41, 59, 0.85)',
                  color: safePage <= 1 ? '#64748b' : '#f8fafc',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <span
                data-testid="attendees-page-indicator"
                style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                Página {safePage} de {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                data-testid="attendees-next-page-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  backgroundColor: safePage >= totalPages ? 'rgba(30, 41, 59, 0.35)' : 'rgba(30, 41, 59, 0.85)',
                  color: safePage >= totalPages ? '#64748b' : '#f8fafc',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                }}
              >
                Próxima <ChevronRight size={14} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            data-testid="close-event-attendees-modal-btn"
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              color: '#f8fafc',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
