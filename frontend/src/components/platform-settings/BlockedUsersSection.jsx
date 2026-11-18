import React, { useEffect, useState, useCallback } from 'react';
import { Ban, UserCheck } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function BlockedUsersSection({ cardBorder, textColor, subTextColor }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);
  const { addToast } = useToast();

  const fetchBlocked = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const res = await fetch('/api/v1/blocks', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blocked_users || []);
      }
    } catch {
      // silencioso
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const handleUnblock = async (userId, name) => {
    setUnblockingId(userId);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/blocks/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erro ao desbloquear usuário.');
      setBlockedUsers((prev) => prev.filter((u) => u.id !== userId));
      addToast(`${name || 'Usuário'} foi desbloqueado.`, 'success');
    } catch (err) {
      addToast(err.message || 'Erro ao desbloquear.', 'error');
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div
      style={{
        marginTop: '20px',
        padding: '20px',
        borderRadius: '14px',
        border: cardBorder,
        background: 'rgba(255, 255, 255, 0.02)',
      }}
      data-testid="blocked-users-section"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: textColor, fontWeight: 700 }}>
        <Ban size={18} />
        <span>Usuários Bloqueados</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: subTextColor, marginBottom: '12px' }}>
        Usuários bloqueados não aparecem no seu feed da comunidade e não podem enviar mensagens diretas para você.
      </p>

      {loading ? (
        <p style={{ fontSize: '0.85rem', color: subTextColor }}>Carregando...</p>
      ) : blockedUsers.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: subTextColor }}>Nenhum usuário bloqueado no momento.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {blockedUsers.map((u) => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '10px',
                border: cardBorder,
              }}
            >
              <span style={{ color: textColor, fontWeight: 600, fontSize: '0.9rem' }}>{u.name}</span>
              <button
                type="button"
                onClick={() => handleUnblock(u.id, u.name)}
                disabled={unblockingId === u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  background: 'rgba(56, 189, 248, 0.12)',
                  color: '#38bdf8',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                <UserCheck size={14} />
                {unblockingId === u.id ? 'Desbloqueando...' : 'Desbloquear'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
