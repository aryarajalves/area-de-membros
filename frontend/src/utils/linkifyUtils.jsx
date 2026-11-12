import React from 'react';

/**
 * Expressão regular para capturar URLs (http, https, www)
 */
const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

/**
 * Expressão regular para capturar hashtags (#palavra)
 */
const HASHTAG_REGEX = /(#[a-zA-Z0-9À-ÿ_]+)/g;

/**
 * Renderiza um texto convertendo URLs em links HTML clicáveis e seguros,
 * e hashtags (#exemplo) em badges clicáveis.
 * @param {string} text
 * @param {Function} [onHashtagClick]
 * @returns {React.ReactNode}
 */
export function renderTextWithLinks(text, onHashtagClick) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  const parts = text.split(URL_REGEX);

  return parts.map((part, index) => {
    if (part.match(URL_REGEX)) {
      const href = part.toLowerCase().startsWith('http') ? part : `https://${part}`;
      return (
        <a
          key={`link-${index}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="feed-post-link"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }

    // Se não for URL, verifica se possui hashtags
    const subParts = part.split(HASHTAG_REGEX);
    return subParts.map((sub, sIdx) => {
      if (sub.match(HASHTAG_REGEX)) {
        const cleanTag = sub.replace(/^#/, '');
        return (
          <span
            key={`tag-${index}-${sIdx}`}
            className="feed-post-hashtag"
            title={`Filtrar por #${cleanTag}`}
            onClick={(e) => {
              e.stopPropagation();
              if (onHashtagClick) {
                onHashtagClick(cleanTag);
              } else {
                window.dispatchEvent(new CustomEvent('feed-filter-hashtag', { detail: { hashtag: cleanTag } }));
              }
            }}
          >
            {sub}
          </span>
        );
      }
      return sub;
    });
  });
}
