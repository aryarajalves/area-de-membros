import React from 'react';
import { MessageCircle, Globe, MessageSquare } from 'lucide-react';
import { InstagramIcon, LinkedinIcon } from '../platform-settings/linkIcons';

function formatWhatsAppLink(phone, authorName) {
  if (!phone) return null;
  const cleanPhone = phone.replace(/\D/g, '');
  if (!cleanPhone) return null;
  const message = encodeURIComponent(`Olá ${authorName || ''}! Vi sua apresentação na Área de Membros e gostaria de me conectar!`);
  return `https://wa.me/${cleanPhone}?text=${message}`;
}

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
  whatsapp,
  website,
  authorName,
  authorId,
  currentUserId,
  onOpenDm,
}) {
  const hasSocial = instagram || linkedin || whatsapp || website;
  const showDmButton = onOpenDm && authorId && currentUserId && authorId !== currentUserId;

  if (!hasSocial && !showDmButton) return null;

  const igLink = formatInstagramLink(instagram);
  const inLink = formatUrl(linkedin);
  const waLink = formatWhatsAppLink(whatsapp, authorName);
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

        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="intro-social-chip chip-whatsapp"
            title={`Chamar no WhatsApp: ${whatsapp}`}
            data-testid="intro-link-whatsapp"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
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
