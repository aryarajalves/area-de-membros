import React from 'react';
import { Sparkles, UserPlus, Loader2 } from 'lucide-react';
import ChatDmConversationItem from './ChatDmConversationItem';
import ChatDmPagination from './ChatDmPagination';

const ITEMS_PER_PAGE = 20;

export default function ChatDmInboxList({
  conversations = [],
  loading = false,
  activeTab = 'inbox',
  currentPage = 1,
  onPageChange,
  onSelectContact,
  onStartNewConversation,
}) {
  const totalPages = Math.max(1, Math.ceil(conversations.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedConversations = conversations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
        data-testid="dm-conversations-list"
      >
        {loading ? (
          <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#94a3b8' }}>
            <Loader2 size={28} className="animate-spin" color="#38bdf8" />
            <span style={{ fontSize: '0.85rem' }}>Carregando conversas...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: '48px 16px', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={36} style={{ opacity: 0.5 }} />
            <div>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>
                {activeTab === 'unread' ? 'Nenhuma mensagem não lida.' : 'Nenhuma conversa na Inbox ainda.'}
              </p>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>
                Inicie uma conversa privada chamando qualquer membro da plataforma.
              </p>
            </div>
            <button
              type="button"
              onClick={onStartNewConversation}
              data-testid="dm-empty-state-new-conversation-btn"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '10px',
                backgroundColor: '#0284c7', color: '#ffffff', border: 'none', fontWeight: 600, fontSize: '0.82rem',
                cursor: 'pointer', marginTop: '8px', boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
              }}
            >
              <UserPlus size={16} />
              <span>Iniciar Nova Conversa</span>
            </button>
          </div>
        ) : (
          paginatedConversations.map((item) => (
            <ChatDmConversationItem
              key={item.contact.id}
              item={item}
              onSelect={onSelectContact}
            />
          ))
        )}
      </div>

      {!loading && conversations.length > 0 && (
        <ChatDmPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={conversations.length}
          startIndex={startIndex}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={onPageChange}
        />
      )}
    </>
  );
}
