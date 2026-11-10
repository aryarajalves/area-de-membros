import React, { useState, useEffect } from 'react';
import { Users, Loader2, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import ChatDmAdminConversationItem from './ChatDmAdminConversationItem';
import ChatDmPagination from './ChatDmPagination';

const ITEMS_PER_PAGE = 20;

export default function ChatDmAdminSupportList({
  onSelectConversation,
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const getAuthToken = () => localStorage.getItem('auth_token') || localStorage.getItem('token');

  const fetchAdminConversations = async () => {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    try {
      const q = unreadOnly ? '?unread_only=true' : '';
      const res = await fetch(`/api/v1/chat/dm/admin-conversations${q}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar conversas dos administradores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminConversations();
    setCurrentPage(1);
  }, [unreadOnly]);

  const totalPages = Math.ceil(conversations.length / ITEMS_PER_PAGE);
  const displayedConversations = conversations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const pendingCount = conversations.reduce((acc, c) => acc + (c.unread_by_admin > 0 ? 1 : 0), 0);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }} data-testid="chat-dm-admin-support-list">
      {/* Sub-barra de Filtro da Equipe */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setUnreadOnly(false)}
            data-testid="admin-filter-all"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: !unreadOnly ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
              color: !unreadOnly ? '#38bdf8' : '#94a3b8',
            }}
          >
            Todas ({conversations.length})
          </button>
          <button
            type="button"
            onClick={() => setUnreadOnly(true)}
            data-testid="admin-filter-pending"
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.74rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: unreadOnly ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
              color: unreadOnly ? '#facc15' : '#94a3b8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertCircle size={12} />
            <span>Pendentes ({pendingCount})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={fetchAdminConversations}
          title="Recarregar atendimentos"
          data-testid="admin-refresh-conversations-btn"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Lista de Atendimentos */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
        {loading ? (
          <div style={{ padding: '40px 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} className="animate-spin" color="#38bdf8" />
          </div>
        ) : displayedConversations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
            <Users size={32} style={{ marginBottom: '8px', opacity: 0.6 }} />
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {unreadOnly
                ? 'Nenhum administrador com mensagens pendentes de resposta.'
                : 'Nenhum atendimento registrado entre alunos e administradores.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayedConversations.map((c) => (
              <ChatDmAdminConversationItem
                key={`${c.student.id}-${c.admin.id}`}
                conversation={c}
                onSelect={onSelectConversation}
              />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <ChatDmPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
