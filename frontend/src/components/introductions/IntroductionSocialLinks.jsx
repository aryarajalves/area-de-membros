import React from 'react';
import { Globe, MessageSquare } from 'lucide-react';
import { InstagramIcon, LinkedinIcon } from '../platform-settings/linkIcons';

function formatInstagramLink(handleOrUrl) {
  if (!handleOrUrl) return null;
  const clean = handleOrUrl.trim();
  if (clean.startsWith('http')) return clean;
  const user = clean.replace('@', '');
  return `https://instagram.com/${user}`;
}

function formatUrl(url) {
  if (!url) return null;
  const clean = url.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
  return `https://${clean}`;
}

export default function IntroductionSocialLinks({
  instagram,
  linkedin,
  website,
  authorName,
  authorId,
  currentUserId,
  onOpenDm,
}) {
  const hasSocial = instagram || linkedin || website;
  const showDmButton = onOpenDm && authorId && currentUserId && authorId !== currentUserId;

  if (!hasSocial && !showDmButton) return null;

  const igLink = formatInstagramLink(instagram);
  const inLink = formatUrl(linkedin);
  const webLink = formatUrl(website);

  return (
    <div className="intro-social-links-container" data-testid="intro-social-links">
      <div className="intro-social-chips-row">
        {igLink && (
          <a
            href={igLink}
            target="_blank"
            rel="noopener noreferrer"
            className="intro-social-chip chip-instagram"
            title={`Instagram de ${authorName}`}
            data-testid="intro-link-instagram"
          >
            <InstagramIcon size={14} />
            <span>Instagram</span>
          </a>
        )}

        {inLink && (
          <a
            href={inLink}
            target="_blank"
            rel="noopener noreferrer"
            className="intro-social-chip chip-linkedin"
            title={`LinkedIn de ${authorName}`}
            data-testid="intro-link-linkedin"
          >
            <LinkedinIcon size={14} />
            <span>LinkedIn</span>
          </a>
        )}

        {webLink && (
          <a
            href={webLink}
            target="_blank"
            rel="noopener noreferrer"
            className="intro-social-chip chip-website"
            title={`Portfólio/Site de ${authorName}`}
            data-testid="intro-link-website"
          >
            <Globe size={14} />
            <span>Portfólio / Site</span>
          </a>
        )}

        {showDmButton && (
          <button
            type="button"
            className="intro-social-chip chip-dm"
            onClick={() => onOpenDm(authorId, authorName)}
            title={`Conversar com ${authorName} na DM`}
            data-testid="intro-link-dm"
          >
            <MessageSquare size={14} />
            <span>Chamar na DM</span>
          </button>
        )}
      </div>
    </div>
  );
}
