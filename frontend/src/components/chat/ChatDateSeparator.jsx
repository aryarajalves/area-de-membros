import React from 'react';
import { Calendar } from 'lucide-react';
import { formatChatDateSeparator } from './chatDateUtils';

export default function ChatDateSeparator({ date }) {
  const formatted = formatChatDateSeparator(date);
  if (!formatted) return null;

  return (
    <div
      className="chat-date-separator-container"
      data-testid="chat-date-separator"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '18px 0 12px',
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        }}
      />
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#94a3b8',
          letterSpacing: '0.02em',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          margin: '0 12px',
        }}
      >
        <Calendar size={12} color="#60a5fa" />
        <span>{formatted}</span>
      </div>
      <div
        style={{
          flex: 1,
          height: '1px',
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        }}
      />
    </div>
  );
}
