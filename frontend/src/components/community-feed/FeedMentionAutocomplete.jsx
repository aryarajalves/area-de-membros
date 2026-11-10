import React, { useEffect, useState } from 'react';
import { AtSign, Loader2 } from 'lucide-react';
import { fetchMentionCandidates } from './communityFeedApi';

export default function FeedMentionAutocomplete({
  query = '',
  onSelectCandidate,
  onClose,
}) {
  const [candidates, setCandidates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const timer = setTimeout(() => {
      fetchMentionCandidates(query)
        .then((data) => {
          if (isMounted) {
            setCandidates(data || []);
            setSelectedIndex(0);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (candidates.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < candidates.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : candidates.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (candidates[selectedIndex]) {
          onSelectCandidate(candidates[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [candidates, selectedIndex, onSelectCandidate, onClose]);

  if (!query && candidates.length === 0 && !isLoading) return null;

  return (
    <div
      className="feed-mention-dropdown"
      data-testid="feed-mention-autocomplete"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="feed-mention-header">
        <AtSign size={13} className="feed-mention-icon" />
        <span>Mencionar membro da comunidade</span>
      </div>

      {isLoading ? (
        <div className="feed-mention-loading">
          <Loader2 size={14} className="feed-spinner" />
          <span>Buscando...</span>
        </div>
      ) : candidates.length === 0 ? (
        <div className="feed-mention-empty">
          <span>Nenhum membro encontrado</span>
        </div>
      ) : (
        <div className="feed-mention-list">
          {candidates.map((cand, idx) => {
            const isSelected = idx === selectedIndex;
            const initial = cand.name ? cand.name.charAt(0).toUpperCase() : 'M';
            return (
              <div
                key={cand.id}
                className={`feed-mention-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectCandidate(cand)}
                onMouseEnter={() => setSelectedIndex(idx)}
                data-testid={`feed-mention-item-${cand.id}`}
              >
                <div className="feed-mention-avatar">
                  {cand.avatar_url ? (
                    <img src={cand.avatar_url} alt={cand.name} />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
                <div className="feed-mention-user-info">
                  <span className="feed-mention-name">{cand.name}</span>
                  {cand.role === 'superadmin' && (
                    <span className="feed-role-badge superadmin">Super Admin</span>
                  )}
                  {cand.role === 'admin' && (
                    <span className="feed-role-badge admin">Admin</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
