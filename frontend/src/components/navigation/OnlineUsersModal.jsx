import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Users, Search, Loader2, RefreshCw, MessageSquare, Mail } from 'lucide-react';

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function OnlineUsersModal({ isOpen, onClose, onStartDm, onStatsSynced }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'aluno' | 'team'

  const fetchOnlineUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch('/api/v1/presence/online-users', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
        if (onStatsSynced) onStatsSynced();
      }
    } catch {
      // Silencioso
    } finally {
      setLoading(false);
    }
  }, [onStatsSynced]);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setRoleFilter('all');
    fetchOnlineUsers();
  }, [isOpen, fetchOnlineUsers]);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) => {
    if (roleFilter === 'aluno' && u.role !== 'aluno') return false;
    if (roleFilter === 'team' && !['admin', 'superadmin'].includes(u.role)) return false;
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      return (u.name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term);
    }
    return true;
  });

  const studentsCount = users.filter((u) => u.role === 'aluno').length;
  const teamCount = users.filter((u) => ['admin', 'superadmin'].includes(u.role)).length;

  const modalContent = (
    <div
      data-testid="online-users-modal"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '86vh',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
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
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Contatos Online Agora
              </h2>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '2px 0 0 0' }}>
                {studentsCount} {studentsCount === 1 ? 'aluno' : 'alunos'} e {teamCount} da equipe conectados
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchOnlineUsers}
            disabled={loading}
            title="Atualizar lista"
            data-testid="refresh-online-users-btn"
            style={{
              padding: '7px 10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: 'rgba(15, 23, 42, 0.7)',
              color: '#94a3b8',
              cursor: loading ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
          </button>
        </div>

        {/* Busca e Filtros de Perfil */}
        <div
          style={{
            padding: '14px 22px 10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar contato online por nome ou e-mail..."
              data-testid="search-online-users-input"
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

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `Todos (${users.length})` },
              { id: 'aluno', label: `Alunos (${studentsCount})` },
              { id: 'team', label: `Equipe (${teamCount})` },
            ].map((tab) => {
              const active = roleFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoleFilter(tab.id)}
                  data-testid={`online-role-filter-${tab.id}`}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: active ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: active ? 'rgba(16, 185, 129, 0.16)' : 'rgba(15, 23, 42, 0.6)',
                    color: active ? '#34d399' : '#94a3b8',
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Contatos */}
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
              <p style={{ fontSize: '13.5px', margin: 0 }}>Verificando quem está online...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div
              data-testid="empty-online-users"
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
                {search.trim() ? 'Nenhum contato online encontrado nesta busca' : 'Nenhum contato online neste filtro'}
              </p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                data-testid={`online-user-item-${u.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '11px',
                  backgroundColor: 'rgba(30, 41, 59, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt={u.name}
                        style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', display: 'block' }}
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
                        }}
                      >
                        {getInitials(u.name)}
                      </div>
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: '#10b981',
                        border: '2px solid #0f172a',
                        boxShadow: '0 0 6px #10b981',
                      }}
                    />
                  </div>

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
                        {u.name}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: ['admin', 'superadmin'].includes(u.role)
                            ? 'rgba(56, 189, 248, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                          color: ['admin', 'superadmin'].includes(u.role) ? '#38bdf8' : '#34d399',
                          border: ['admin', 'superadmin'].includes(u.role)
                            ? '1px solid rgba(56, 189, 248, 0.35)'
                            : '1px solid rgba(16, 185, 129, 0.35)',
                        }}
                      >
                        {u.role === 'superadmin' ? 'Super Admin' : u.role === 'admin' ? 'Admin' : 'Aluno'}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginTop: '2px',
                        fontSize: '12px',
                        color: '#94a3b8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <Mail size={11} color="#64748b" />
                      <span>{u.email}</span>
                    </div>
                  </div>
                </div>

                {onStartDm && (
                  <button
                    type="button"
                    onClick={() => onStartDm(u)}
                    data-testid={`online-user-dm-btn-${u.id}`}
                    style={{
                      padding: '6px 11px',
                      borderRadius: '8px',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      color: '#38bdf8',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0,
                    }}
                  >
                    <MessageSquare size={13} />
                    <span>DM</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Rodapé com Único Botão de Fechar */}
        <div
          style={{
            padding: '14px 22px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            display: 'flex',
            justifyContent: 'flex-end',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            data-testid="close-online-users-modal-btn"
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

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
