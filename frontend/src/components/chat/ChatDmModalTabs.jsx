import React from 'react';
import { Inbox, BellOff, Users, UserPlus, CheckCheck } from 'lucide-react';

export default function ChatDmModalTabs({
  activeTab,
  setActiveTab,
  unreadTotal,
  currentUser,
  onStartNewConversation,
  onMarkAllRead,
}) {
  return (
    <div
      data-testid="dm-modal-tabs-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0c1322',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        data-testid="dm-modal-tabs-scroll"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexWrap: 'wrap',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          maxWidth: '100%',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('inbox')}
          data-testid="dm-tab-inbox"
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            backgroundColor: activeTab === 'inbox' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'inbox' ? '#38bdf8' : '#94a3b8',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <Inbox size={14} />
          <span>Inbox</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('unread')}
          data-testid="dm-tab-unread"
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            backgroundColor: activeTab === 'unread' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
            color: activeTab === 'unread' ? '#f87171' : '#94a3b8',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <BellOff size={14} />
          <span>Não lidas</span>
          {unreadTotal > 0 && (
            <span
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '9999px',
              }}
            >
              {unreadTotal}
            </span>
          )}
        </button>

        {currentUser?.role === 'superadmin' && (
          <button
            type="button"
            onClick={() => setActiveTab('team_support')}
            data-testid="dm-tab-team-support"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: activeTab === 'team_support' ? 'rgba(234, 179, 8, 0.2)' : 'transparent',
              color: activeTab === 'team_support' ? '#facc15' : '#94a3b8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <Users size={14} />
            <span>Atendimento da Equipe</span>
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {unreadTotal > 0 && onMarkAllRead && (
          <button
            type="button"
            onClick={onMarkAllRead}
            data-testid="dm-mark-all-read-btn"
            title="Marcar todas as DMs como lidas"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: 'rgba(16, 185, 129, 0.14)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <CheckCheck size={13} />
            <span>Marcar como lido</span>
          </button>
        )}

        <button
          type="button"
          onClick={onStartNewConversation}
          data-testid="dm-new-conversation-btn"
          title="Iniciar conversa privada com um aluno ou membro"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: 600,
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            color: '#38bdf8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <UserPlus size={14} />
          <span>Nova Conversa</span>
        </button>
      </div>
    </div>
  );
}
