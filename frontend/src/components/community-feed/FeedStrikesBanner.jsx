import React from 'react';
import { AlertTriangle, Ban, ShieldAlert, ArrowRight } from 'lucide-react';

export default function FeedStrikesBanner({ strikesStatus, onOpenStrikesModal }) {
  if (!strikesStatus || strikesStatus.strikes_count === 0) {
    return null;
  }

  const { strikes_count, is_banned } = strikesStatus;

  return (
    <div
      className={`feed-strikes-banner ${is_banned ? 'banned' : strikes_count === 2 ? 'warning-high' : 'warning-medium'}`}
      data-testid="feed-strikes-banner"
    >
      <div className="feed-strikes-banner-content">
        <div className="feed-strikes-banner-icon">
          {is_banned ? (
            <Ban size={22} color="#ef4444" />
          ) : strikes_count === 2 ? (
            <ShieldAlert size={22} color="#f97316" />
          ) : (
            <AlertTriangle size={22} color="#f59e0b" />
          )}
        </div>

        <div className="feed-strikes-banner-texts">
          <div className="feed-strikes-banner-title">
            {is_banned ? (
              <strong>🚫 Conta Banida do Feed da Comunidade (3/3 strikes)</strong>
            ) : strikes_count === 2 ? (
              <strong>⚠️ Alerta Crítico: Você possui 2 de 3 strikes</strong>
            ) : (
              <strong>⚠️ Advertência: Você possui 1 de 3 strikes</strong>
            )}
            <span className="feed-strikes-pill">
              {is_banned ? '3/3 - BANIDO' : `${strikes_count}/3 Strikes`}
            </span>
          </div>

          <p className="feed-strikes-banner-desc">
            {is_banned
              ? 'Você atingiu o limite de 3 violações e sua conta foi banida de publicar e comentar. Você tem direito a recorrer desta penalidade.'
              : strikes_count === 2
              ? 'Mais uma violação das diretrizes acarretará no banimento automático e imediato da sua conta. Você pode recorrer de cada strike.'
              : 'Você violou as diretrizes de conduta da comunidade. Lembre-se que com 3 strikes a conta é banida automaticamente. Você pode recorrer.'}
          </p>
        </div>
      </div>

      <button
        type="button"
        className="feed-strikes-banner-action-btn"
        onClick={onOpenStrikesModal}
        data-testid="feed-strikes-banner-btn"
      >
        <span>{is_banned ? 'Solicitar Recurso' : 'Ver Strikes e Recorrer'}</span>
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
