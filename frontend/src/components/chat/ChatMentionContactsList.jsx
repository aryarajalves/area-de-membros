import React, { useState, useEffect, useMemo } from 'react';
import { Users, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

export default function ChatMentionContactsList({
  contacts = [],
  filterText = '',
  onSelectContact,
  onClose,
  currentUser = null,
  currentMentionCount = 0,
}) {
  const [page, setPage] = useState(1);

  const isPrivileged = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const hasReachedLimit = !isPrivileged && currentMentionCount >= 5;

  // Reseta para a primeira página sempre que o texto de filtro mudar
  useEffect(() => {
    setPage(1);
  }, [filterText]);

  // Filtra os contatos conforme o usuário digita
  const filteredList = useMemo(() => {
    const term = (filterText || '').toLowerCase().trim();

    const matches = contacts.filter((c) =>
      (c.name || '').toLowerCase().includes(term) ||
      (c.email || '').toLowerCase().includes(term)
    );

    // Opção @todos exclusiva para Admin e Super Admin
    if (isPrivileged && (!term || 'todos'.includes(term))) {
      const allItem = {
        id: 'todos',
        name: 'todos',
        role: 'all',
        isAll: true,
      };
      return [allItem, ...matches];
    }

    return matches;
  }, [contacts, filterText, isPrivileged]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedContacts = filteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (filteredList.length === 0) {
    return (
      <div
        data-testid="chat-mention-contacts-popup"
        style={containerStyle}
      >
        <div style={headerStyle}>
          Mencionar Contato (@)
        </div>
        <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8' }}>
          Nenhum contato encontrado para "@{filterText}"
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="chat-mention-contacts-popup"
      style={containerStyle}
    >
      {/* Cabeçalho */}
      <div style={headerStyle}>
        <span>Mencionar Contato (@)</span>
        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500 }}>
          {filteredList.length} {filteredList.length === 1 ? 'contato' : 'contatos'}
        </span>
      </div>

      {/* Alerta de limite de menções para alunos */}
      {hasReachedLimit && (
        <div
          data-testid="mention-limit-alert"
          style={{
            padding: '6px 10px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.72rem',
            color: '#f87171',
          }}
        >
          <AlertTriangle size={13} style={{ flexShrink: 0 }} />
          <span>Limite de 5 menções por mensagem atingido.</span>
        </div>
      )}

      {/* Lista de Contatos Paginada (20 por página) */}
      <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
        {paginatedContacts.map((c) => {
          if (c.isAll) {
            return (
              <button
                key="mention-item-todos"
                type="button"
                onClick={() => onSelectContact(c)}
                disabled={hasReachedLimit}
                data-testid="mention-contact-todos"
                style={{
                  ...itemBtnStyle(hasReachedLimit),
                  backgroundColor: 'rgba(251, 191, 36, 0.08)',
                  borderBottom: '1px solid rgba(251, 191, 36, 0.2)',
                }}
              >
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(251, 191, 36, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fbbf24',
                    flexShrink: 0,
                  }}
                >
                  <Users size={14} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.8125rem' }}>
                    @todos
                  </div>
                  <div style={{ fontSize: '0.675rem', color: '#e2e8f0' }}>
                    Notificar todos os membros do canal
                  </div>
                </div>
              </button>
            );
          }

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectContact(c)}
              disabled={hasReachedLimit}
              data-testid={`mention-contact-item-${c.id}`}
              style={itemBtnStyle(hasReachedLimit)}
              onMouseEnter={(e) => {
                if (!hasReachedLimit) e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)';
              }}
              onMouseLeave={(e) => {
                if (!hasReachedLimit) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#fff',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  (c.name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                  {c.role === 'superadmin' ? 'Super Admin' : c.role === 'admin' ? 'Instrutor' : 'Aluno'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Barra de Paginação (se mais de 20 contatos) */}
      {totalPages > 1 && (
        <div
          data-testid="mention-pagination-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#090d16',
            fontSize: '0.72rem',
            color: '#94a3b8',
          }}
        >
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            data-testid="mention-prev-page-btn"
            style={navBtnStyle(currentPage === 1)}
            title="Página anterior"
          >
            <ChevronLeft size={14} />
          </button>

          <span data-testid="mention-page-indicator">
            Pág. {currentPage} de {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            data-testid="mention-next-page-btn"
            style={navBtnStyle(currentPage === totalPages)}
            title="Próxima página"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

const containerStyle = {
  position: 'absolute',
  bottom: '50px',
  left: '75px',
  backgroundColor: '#0f172a',
  border: '1px solid rgba(56, 189, 248, 0.3)',
  borderRadius: '12px',
  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(56, 189, 248, 0.15)',
  zIndex: 100,
  width: '280px',
  overflow: 'hidden',
  animation: 'fadeIn 0.15s ease',
};

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 12px',
  fontSize: '0.6875rem',
  fontWeight: 700,
  color: '#38bdf8',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
};

function itemBtnStyle(disabled) {
  return {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '7px 12px',
    background: 'none',
    border: 'none',
    color: disabled ? '#64748b' : '#f8fafc',
    cursor: disabled ? 'not-allowed' : 'pointer',
    textAlign: 'left',
    fontSize: '0.8125rem',
    transition: 'background-color 0.15s ease',
    opacity: disabled ? 0.5 : 1,
  };
}

function navBtnStyle(disabled) {
  return {
    background: 'none',
    border: 'none',
    color: disabled ? '#475569' : '#38bdf8',
    cursor: disabled ? 'not-allowed' : 'pointer',
    padding: '3px 6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}
