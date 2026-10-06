import React from 'react';

/**
 * Renderiza o texto da mensagem com destaque visual azul neon para menções @Nome
 */
export function formatMessageWithMentions(text) {
  if (!text) return null;
  // Regex para capturar @Palavra ou @Nome Sobrenome
  const regex = /(@[A-Za-zÀ-ÿ0-9_]+(?:\s+[A-Za-zÀ-ÿ0-9_]+)?)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part && part.startsWith('@')) {
      return (
        <span
          key={index}
          className="chat-mention-tag"
          data-testid="chat-mention-highlight"
          style={{
            color: '#38bdf8',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            padding: '1px 6px',
            borderRadius: '4px',
            fontWeight: 600,
            display: 'inline-block',
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

/**
 * Normaliza a URL do botão para garantir que links externos sem protocolo (ex: www.google.com.br)
 * abram corretamente com https:// em vez de tentar rota relativa interna.
 */
export function resolveButtonUrl(url, actionType = 'url') {
  if (!url) return '#';
  const trimmed = url.trim();
  if (actionType === 'url') {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }
  return trimmed;
}
