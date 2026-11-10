import React from 'react';
import { Compass, Sparkles, MapPin, Briefcase } from 'lucide-react';

export default function IntroductionMatchmaking({
  niche,
  location,
  seeking,
  offering,
}) {
  const hasMeta = niche || location;
  const hasMatchmaking = seeking || offering;

  if (!hasMeta && !hasMatchmaking) return null;

  return (
    <div className="intro-matchmaking-wrapper" data-testid="intro-matchmaking">
      {hasMeta && (
        <div className="intro-meta-tags-row">
          {niche && (
            <span className="intro-meta-tag tag-niche" data-testid="intro-tag-niche">
              <Briefcase size={12} />
              <span>{niche}</span>
            </span>
          )}
          {location && (
            <span className="intro-meta-tag tag-location" data-testid="intro-tag-location">
              <MapPin size={12} />
              <span>{location}</span>
            </span>
          )}
        </div>
      )}

      {hasMatchmaking && (
        <div className="intro-matchmaking-grid">
          {seeking && (
            <div className="intro-match-card card-seeking" data-testid="intro-card-seeking">
              <div className="intro-match-header">
                <Compass size={15} className="header-icon" />
                <span>O que busco na comunidade</span>
              </div>
              <p className="intro-match-text">{seeking}</p>
            </div>
          )}

          {offering && (
            <div className="intro-match-card card-offering" data-testid="intro-card-offering">
              <div className="intro-match-header">
                <Sparkles size={15} className="header-icon" />
                <span>Como posso ajudar / O que domino</span>
              </div>
              <p className="intro-match-text">{offering}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
