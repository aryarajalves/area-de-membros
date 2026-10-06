import React, { useState, useEffect } from 'react';
import { User, Shield, Award } from 'lucide-react';

export default function ChatMentionContactsList({ contacts = [], filterText = '', onSelectContact, onClose }) {
  const filtered = contacts.filter((c) =>
    (c.name || '').toLowerCase().includes(filterText.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(filterText.toLowerCase())
  ).slice(0, 8);

  if (filtered.length === 0) return null;

  return (
    <div
      data-testid="chat-mention-contacts-popup"
      style={{
        position: 'absolute',
        bottom: '50px',
        left: '75px',
        backgroundColor: '#0f172a',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '10px',
        padding: '6px 0',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        zIndex: 100,
        width: '240px',
        maxHeight: '220px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          padding: '4px 10px 6px',
          fontSize: '0.6875rem',
          fontWeight: 700,
          color: '#38bdf8',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        Mencionar Contato (@)
      </div>
      {filtered.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onSelectContact(c)}
          data-testid={`mention-contact-item-${c.id}`}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            background: 'none',
            border: 'none',
            color: '#f8fafc',
            cursor: 'pointer',
            textAlign: 'left',
            fontSize: '0.8125rem',
            transition: 'background-color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
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
      ))}
    </div>
  );
}
