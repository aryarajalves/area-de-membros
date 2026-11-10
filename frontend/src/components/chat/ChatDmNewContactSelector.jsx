import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Shield, GraduationCap, Crown, Trophy } from 'lucide-react';
import { OnlineStatusDot } from '../common/OnlineStatusBadge';
import ChatDmContactFilters from './ChatDmContactFilters';

export default function ChatDmNewContactSelector({
  onSelectContact,
  onClose,
}) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [orderBy, setOrderBy] = useState('name_asc');
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  useEffect(() => {
    const fetchCourses = async () => {
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetch('/api/v1/courses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(Array.isArray(data) ? data : []);
        }
      } catch {
        // Silencioso
      }
    };
    fetchCourses();
  }, []);

  const fetchCandidates = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        order_by: orderBy,
        role: selectedRole,
      });
      if (searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }
      if (selectedCourseId) {
        params.append('course_id', selectedCourseId);
      }

      const res = await fetch(`/api/v1/chat/dm/candidates?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setContacts(data);
          setTotalCount(data.length);
          setTotalPages(1);
        } else {
          setContacts(data.items || []);
          setTotalPages(data.pages || 1);
          setTotalCount(data.total || 0);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar contatos:', err);
    } finally {
      setLoading(false);
    }
  }, [page, orderBy, selectedRole, selectedCourseId, searchTerm]);

  useEffect(() => {
    fetchCandidates();
  }, [fetchCandidates]);

  const renderRoleBadge = (role) => {
    if (role === 'superadmin') {
      return (
        <span
          data-testid="badge-role-superadmin"
          style={{
            fontSize: '0.65rem',
            backgroundColor: 'rgba(192, 132, 252, 0.15)',
            color: '#c084fc',
            padding: '1px 6px',
            borderRadius: '4px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <Crown size={10} /> Super Admin
        </span>
      );
    }
    if (role === 'admin') {
      return (
        <span
          data-testid="badge-role-admin"
          style={{
            fontSize: '0.65rem',
            backgroundColor: 'rgba(234, 179, 8, 0.15)',
            color: '#eab308',
            padding: '1px 6px',
            borderRadius: '4px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
          }}
        >
          <Shield size={10} /> Admin
        </span>
      );
    }
    return (
      <span
        data-testid="badge-role-aluno"
        style={{
          fontSize: '0.65rem',
          backgroundColor: 'rgba(56, 189, 248, 0.15)',
          color: '#38bdf8',
          padding: '1px 6px',
          borderRadius: '4px',
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
        }}
      >
        <GraduationCap size={10} /> Aluno
      </span>
    );
  };

  return (
    <div
      data-testid="dm-new-contact-selector"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        backgroundColor: '#0f172a',
      }}
    >
      {/* Filtros e Busca */}
      <ChatDmContactFilters
        searchTerm={searchTerm}
        setSearchTerm={(term) => {
          setSearchTerm(term);
          setPage(1);
        }}
        selectedRole={selectedRole}
        onRoleChange={(r) => {
          setSelectedRole(r);
          setPage(1);
        }}
        selectedCourseId={selectedCourseId}
        onCourseChange={(cid) => {
          setSelectedCourseId(cid);
          setPage(1);
        }}
        orderBy={orderBy}
        onOrderChange={(ord) => {
          setOrderBy(ord);
          setPage(1);
        }}
        courses={courses}
      />

      {/* Lista de Contatos */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
        data-testid="dm-contacts-list"
      >
        {loading ? (
          <div
            style={{
              padding: '40px 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              color: '#94a3b8',
            }}
          >
            <Loader2 size={24} className="animate-spin" color="#38bdf8" />
            <span style={{ fontSize: '0.82rem' }}>Carregando membros...</span>
          </div>
        ) : contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>Nenhum usuário encontrado.</p>
            <span style={{ fontSize: '0.75rem' }}>Tente ajustar a busca ou os filtros acima.</span>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              data-testid={`dm-contact-item-${contact.id}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Avatar com Dot Online */}
              <div style={{ position: 'relative', width: '38px', height: '38px', flexShrink: 0 }}>
                {contact.avatar_url ? (
                  <img
                    src={contact.avatar_url}
                    alt={contact.name}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: ['superadmin', 'admin'].includes(contact.role) ? 'rgba(234, 179, 8, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                      color: ['superadmin', 'admin'].includes(contact.role) ? '#eab308' : '#38bdf8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                    }}
                  >
                    {(contact.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <OnlineStatusDot isOnline={contact.is_online} size={10} />
              </div>

              {/* Informações */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      color: '#f8fafc',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {contact.name}
                  </span>
                  {renderRoleBadge(contact.role)}

                  {contact.level_title && (
                    <span
                      data-testid={`dm-contact-rpg-${contact.id}`}
                      style={{
                        fontSize: '0.65rem',
                        backgroundColor: 'rgba(205, 127, 50, 0.15)',
                        color: '#cd7f32',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                      title={`${contact.total_points || 0} pontos`}
                    >
                      <Trophy size={10} /> Nv. {contact.level} {contact.level_title}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {contact.email}
                </span>
              </div>

              {/* Botão Conversar */}
              <span
                style={{
                  fontSize: '0.75rem',
                  color: '#38bdf8',
                  fontWeight: 600,
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  flexShrink: 0,
                }}
              >
                Conversar
              </span>
            </div>
          ))
        )}
      </div>

      {/* Barra de Paginação: Máximo 20 por página */}
      <div
        data-testid="dm-contacts-pagination"
        style={{
          padding: '8px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0c1322',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          Total: <strong style={{ color: '#f1f5f9' }}>{totalCount}</strong> membros
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            data-testid="dm-pagination-prev-btn"
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: page <= 1 ? '#475569' : '#f1f5f9',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '0.75rem',
            }}
          >
            <ChevronLeft size={14} /> Anterior
          </button>

          <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            data-testid="dm-pagination-next-btn"
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: page >= totalPages ? '#475569' : '#f1f5f9',
              cursor: page >= totalPages ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '0.75rem',
            }}
          >
            Próxima <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
