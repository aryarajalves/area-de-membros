import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, X, Crown, Shield, GraduationCap, MessageSquare, Loader2 } from 'lucide-react';

export default function ChatMembersSidebar({
  isOpen = true,
  onClose,
  channel,
  currentUser,
  onSelectMember,
  onStartDm,
}) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [data, setData] = useState({
    total_members: 0,
    superadmins: [],
    admins: [],
    students: [],
  });

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  useEffect(() => {
    let isMounted = true;
    const fetchMembers = async () => {
      const token = getAuthToken();
      if (!token) return;
      setLoading(true);
      try {
        const chType = channel?.type || 'general';
        const courseParam = channel?.course_id ? `&course_id=${channel.course_id}` : '';
        const res = await fetch(`/api/v1/chat/members?channel_type=${chType}${courseParam}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setData(json);
        }
      } catch (err) {
        console.error('Erro ao buscar membros do chat:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMembers();
    return () => {
      isMounted = false;
    };
  }, [channel?.type, channel?.course_id]);

  const filterUsers = (list = []) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (u) =>
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q))
    );
  };

  const filteredSuperadmins = useMemo(() => filterUsers(data.superadmins), [data.superadmins, search]);
  const filteredAdmins = useMemo(() => filterUsers(data.admins), [data.admins, search]);
  const filteredStudents = useMemo(() => filterUsers(data.students), [data.students, search]);

  if (!isOpen) return null;

  const renderMemberRow = (m, roleType) => {
    const isMe = currentUser && currentUser.id === m.id;
    let roleColor = '#34d399';
    let RoleIcon = GraduationCap;
    if (roleType === 'superadmin') {
      roleColor = '#c084fc';
      RoleIcon = Crown;
    } else if (roleType === 'admin') {
      roleColor = '#60a5fa';
      RoleIcon = Shield;
    }

    return (
      <div
        key={m.id}
        data-testid={`chat-member-item-${m.id}`}
        onClick={() => onSelectMember && onSelectMember(m)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          backgroundColor: 'transparent',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          {/* Avatar com status online */}
          <div style={{ position: 'relative', width: '34px', height: '34px', flexShrink: 0 }}>
            {m.avatar_url ? (
              <img
                src={m.avatar_url}
                alt={m.name}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                }}
              />
            ) : (
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: roleColor,
                  border: '1.5px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {m.name ? m.name.charAt(0).toUpperCase() : '?'}
              </div>
            )}
            {/* Ponto indicador de status */}
            <span
              title={m.is_online ? 'Online' : 'Offline'}
              style={{
                position: 'absolute',
                bottom: '-1px',
                right: '-1px',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: m.is_online ? '#10b981' : '#64748b',
                border: '2px solid #0c1222',
                boxShadow: m.is_online ? '0 0 6px #10b981' : 'none',
              }}
            />
          </div>

          {/* Nome e subtítulo */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: isMe ? '#93c5fd' : '#f1f5f9',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {m.name} {isMe && <span style={{ fontSize: '11px', color: '#64748b' }}>(Você)</span>}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                color: roleColor,
                opacity: 0.9,
              }}
            >
              <RoleIcon size={10} />
              <span>
                {roleType === 'superadmin' ? 'Super Admin' : roleType === 'admin' ? 'Admin' : 'Aluno'}
              </span>
            </div>
          </div>
        </div>

        {/* Botão de mensagem rápida DM (visível se não for o próprio usuário) */}
        {!isMe && onStartDm && (
          <button
            type="button"
            title={`Conversar com ${m.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onStartDm(m);
            }}
            data-testid={`quick-dm-btn-${m.id}`}
            style={{
              padding: '6px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
              e.currentTarget.style.color = '#60a5fa';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <MessageSquare size={14} />
          </button>
        )}
      </div>
    );
  };

  const renderSection = (title, items, roleType, badgeColor) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: '18px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#64748b',
            padding: '0 8px',
            marginBottom: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{title}</span>
          <span
            style={{
              fontSize: '10.5px',
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: badgeColor,
            }}
          >
            {items.length}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {items.map((m) => renderMemberRow(m, roleType))}
        </div>
      </div>
    );
  };

  return (
    <aside
      className="chat-members-sidebar"
      data-testid="chat-members-sidebar"
      style={{
        width: '270px',
        minWidth: '270px',
        backgroundColor: '#0c1222',
        borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        zIndex: 10,
        boxShadow: '-4px 0 16px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Cabeçalho da Barra Lateral Direita */}
      <div
        style={{
          padding: '16px 14px 12px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60a5fa',
            }}
          >
            <Users size={15} />
          </div>
          <div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ffffff' }}>
              Membros do Chat
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {data.total_members} {data.total_members === 1 ? 'participante' : 'participantes'}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            data-testid="close-members-sidebar-btn"
            title="Recolher barra lateral"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }}
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Campo de Busca Rápida */}
      <div style={{ padding: '10px 12px 6px' }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            padding: '6px 10px',
          }}
        >
          <Search size={13} color="#64748b" style={{ marginRight: '8px', flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar participante..."
            data-testid="members-search-input"
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f8fafc',
              fontSize: '12px',
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Membros com Rolagem Fluida */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 10px 20px',
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
            <Loader2 size={16} className="animate-spin" color="#3b82f6" />
            <span>Carregando membros...</span>
          </div>
        ) : (
          <>
            {renderSection('Super Admin', filteredSuperadmins, 'superadmin', '#c084fc')}
            {renderSection('Administradores', filteredAdmins, 'admin', '#60a5fa')}
            {renderSection('Alunos', filteredStudents, 'aluno', '#34d399')}

            {filteredSuperadmins.length === 0 &&
              filteredAdmins.length === 0 &&
              filteredStudents.length === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b', fontSize: '12px' }}>
                  Nenhum participante encontrado para &quot;{search}&quot;.
                </div>
              )}
          </>
        )}
      </div>
    </aside>
  );
}
