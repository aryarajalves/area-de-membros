import React, { useState } from 'react';
import { Ban, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function BlockUserConfirmModal({
  isOpen,
  targetUser,
  onClose,
  onBlocked,
}) {
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  if (!isOpen || !targetUser) return null;

  const handleConfirmBlock = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/v1/blocks/${targetUser.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Não foi possível bloquear o usuário.');
      }
      addToast(`${targetUser.name || 'Usuário'} foi bloqueado.`, 'success');
      onBlocked?.(targetUser.id);
      onClose?.();
    } catch (error) {
      addToast(error.message || 'Erro ao bloquear usuário.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      data-testid="block-user-modal"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '16px',
          padding: '24px',
          color: '#f8fafc',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', fontWeight: 700 }}>
            <Ban size={20} />
            <span>Bloquear Usuário</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '20px' }}>
          Deseja bloquear <strong>{targetUser.name || 'este usuário'}</strong>? Você deixará de ver suas publicações no feed e não receberá mensagens diretas dele. Você pode desbloquear depois em Configurações.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirmBlock}
            disabled={loading}
            data-testid="confirm-block-user-btn"
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              border: 'none',
              background: '#ef4444',
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Bloqueando...' : 'Bloquear'}
          </button>
        </div>
      </div>
    </div>
  );
}
