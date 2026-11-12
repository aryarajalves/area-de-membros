import React from 'react';
import { Ban, ShieldAlert } from 'lucide-react';

export default function FeedBannedCard({ onOpenStrikesModal }) {
  return (
    <div className="feed-banned-card" data-testid="feed-banned-card">
      <div className="feed-banned-icon-wrap">
        <Ban size={28} color="#ef4444" />
      </div>
      <h3 className="feed-banned-title">Você foi banido do Feed da Comunidade</h3>
      <p className="feed-banned-desc">
        Sua conta atingiu 3 strikes por violar as diretrizes de conduta. Você está impedido de criar
        publicações e comentários no momento.
      </p>
      {onOpenStrikesModal && (
        <button
          type="button"
          className="feed-banned-appeal-btn"
          onClick={onOpenStrikesModal}
          data-testid="feed-banned-appeal-btn"
        >
          <ShieldAlert size={16} />
          <span>Ver Meus Strikes e Solicitar Recurso</span>
        </button>
      )}
    </div>
  );
}
