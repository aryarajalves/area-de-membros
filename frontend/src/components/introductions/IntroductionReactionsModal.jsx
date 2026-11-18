import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { getReactionDef } from './IntroductionReactionsBar';

export default function IntroductionReactionsModal({ isOpen, postId, onClose }) {
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!isOpen || !postId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setActiveFilter('all');

    const token = localStorage.getItem('auth_token');
    fetch(`/api/v1/introductions/${postId}/reactions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Erro ao carregar reações.');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setReactions(data.reactions || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Erro ao carregar reações.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, postId]);

  if (!isOpen) return null;

  const countsByType = reactions.reduce((acc, item) => {
    const key = item.reaction_type || 'like';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const filtered = activeFilter === 'all'
    ? reactions
    : reactions.filter((r) => (r.reaction_type || 'like') === activeFilter);

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
      data-testid="introduction-reactions-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: '16px',
          padding: '20px',
          color: '#f8fafc',
          boxShadow: '0 24px 60px rgba(0,0,0,0.65)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
            Reações ({reactions.length})
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            data-testid="close-reactions-modal-btn"
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        {Object.keys(countsByType).length > 1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                border: activeFilter === 'all' ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.12)',
                background: activeFilter === 'all' ? 'rgba(96, 165, 250, 0.18)' : 'transparent',
                color: '#f8fafc',
                fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              Todas ({reactions.length})
            </button>
            {Object.entries(countsByType).map(([type, count]) => {
              const def = getReactionDef(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveFilter(type)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    border: activeFilter === type ? `1px solid ${def.color}` : '1px solid rgba(255,255,255,0.12)',
                    background: activeFilter === type ? `${def.color}26` : 'transparent',
                    color: '#f8fafc',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {def.emoji} {count}
                </button>
              );
            })}
          </div>
        )}

        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '80px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '24px', color: '#94a3b8' }}>
              <Loader2 size={18} className="spin" /> Carregando...
            </div>
          ) : error ? (
            <p style={{ color: '#f87171', fontSize: '0.9rem', textAlign: 'center', padding: '16px' }}>{error}</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center', padding: '16px' }}>Nenhuma reação encontrada.</p>
          ) : (
            filtered.map((item) => {
              const def = getReactionDef(item.reaction_type);
              return (
                <div
                  key={`${item.user_id}-${item.reaction_type}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {item.avatar_url ? (
                      <img src={item.avatar_url} alt={item.name} style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                        {(item.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#f8fafc' }}>{item.name}</div>
                      {item.role && item.role !== 'aluno' && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>{item.role}</div>
                      )}
                    </div>
                  </div>
                  <span title={def.label} style={{ fontSize: '1.15rem' }}>{def.emoji}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
