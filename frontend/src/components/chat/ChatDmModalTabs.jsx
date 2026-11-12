import React from 'react';
import { Inbox, BellOff, Users, UserPlus } from 'lucide-react';

export default function ChatDmModalTabs({
  activeTab,
  setActiveTab,
  unreadTotal,
  currentUser,
  onStartNewConversation,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backgroundColor: '#0c1322',
      }}
    >
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={() => setActiveTab('inbox')}
          data-testid="dm-tab-inbox"
          style={{
            padding: '6px 14px',
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
            padding: '6px 14px',
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
              padding: '6px 14px',
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
            }}
          >
            <Users size={14} />
            <span>Atendimento da Equipe</span>
          </button>
        )}
      </div>

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
        }}
      >
        <UserPlus size={14} />
        <span>Nova Conversa</span>
      </button>
    </div>
  );
}
