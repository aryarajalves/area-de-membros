import React from 'react';
import { UserCheck, Clock, AlertCircle } from 'lucide-react';

export default function ChatDmAdminConversationItem({
  conversation,
  onSelect,
}) {
  const { student, admin, last_message, last_message_at, unread_by_admin } = conversation;

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={() => onSelect(conversation)}
      data-testid={`admin-dm-conversation-${student.id}-${admin.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        borderRadius: '12px',
        backgroundColor: unread_by_admin > 0 ? 'rgba(234, 179, 8, 0.08)' : 'rgba(255, 255, 255, 0.03)',
        border: unread_by_admin > 0 ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        gap: '12px',
      }}
    >
      {/* Avatares Combinados Aluno + Admin */}
      <div style={{ position: 'relative', width: '42px', height: '42px', flexShrink: 0 }}>
        {student.avatar_url ? (
          <img
            src={student.avatar_url}
            alt={student.name}
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {student.name ? student.name.charAt(0).toUpperCase() : 'A'}
          </div>
        )}

        {/* Mini badge do Admin Responsável */}
        <div
          title={`Admin: ${admin.name}`}
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: '#0f172a',
            border: '1.5px solid #eab308',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            color: '#eab308',
            fontWeight: 800,
          }}
        >
          {admin.name ? admin.name.charAt(0).toUpperCase() : '★'}
        </div>
      </div>

      {/* Dados da Conversa */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {student.name}
            </span>
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>↔</span>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: '#facc15',
                backgroundColor: 'rgba(234, 179, 8, 0.15)',
                padding: '1px 6px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
              }}
            >
              {admin.name}
            </span>
          </div>

          <span style={{ fontSize: '0.68rem', color: '#64748b', flexShrink: 0 }}>
            {formatTime(last_message_at)}
          </span>
        </div>

        {/* Pré-visualização da última mensagem */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', gap: '8px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '0.76rem',
              color: unread_by_admin > 0 ? '#fde047' : '#94a3b8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '85%',
              fontWeight: unread_by_admin > 0 ? 600 : 400,
            }}
          >
            {last_message || 'Nenhuma mensagem recente'}
          </p>

          {unread_by_admin > 0 && (
            <span
              data-testid={`unread-badge-${student.id}-${admin.id}`}
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: '#1e1b4b',
                backgroundColor: '#facc15',
                borderRadius: '999px',
                padding: '1px 6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                flexShrink: 0,
              }}
              title="Mensagens do aluno aguardando resposta do administrador"
            >
              <AlertCircle size={10} />
              {unread_by_admin}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
