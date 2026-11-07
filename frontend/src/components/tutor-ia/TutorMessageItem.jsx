import React, { useState } from 'react';
import { Bot, User, Copy, Check, Clock, ExternalLink, ThumbsUp, ThumbsDown, MessageSquare, BookOpen } from 'lucide-react';

function timeToSeconds(timeStr) {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export default function TutorMessageItem({
  message,
  tutorName = 'Tutor IA',
  onSeekTime,
  onSelectRelatedLesson,
  onFeedback,
  onRequestDislikeFeedback,
  onSaveToNotes,
  isLightBg = false
}) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTimestampClick = (timeStr) => {
    const seconds = timeToSeconds(timeStr);
    if (onSeekTime) {
      onSeekTime(seconds);
    }
    // Dispara o evento oficial ouvido pelo CustomVideoPlayer da aula
    window.dispatchEvent(new CustomEvent('video-seek-to', { detail: { seconds } }));
    window.dispatchEvent(new CustomEvent('seek-video-time', { detail: { seconds } }));

    // Rola suavemente até o player de vídeo para visualização imediata do trecho
    const playerEl = document.querySelector('.custom-video-player') || document.querySelector('[data-testid="custom-video-player"]');
    if (playerEl) {
      playerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Renderiza o texto substituindo minutagens no formato 00:00 por botões clicáveis
  const renderFormattedContent = (content) => {
    const timeRegex = /\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g;
    const elements = [];
    let lastIndex = 0;
    let match;

    while ((match = timeRegex.exec(content)) !== null) {
      const matchIndex = match.index;
      const timeStr = match[1];

      if (matchIndex > lastIndex) {
        elements.push(content.substring(lastIndex, matchIndex));
      }

      elements.push(
        <button
          key={`ts-${matchIndex}`}
          type="button"
          onClick={() => handleTimestampClick(timeStr)}
          title={`Pular vídeo para ${timeStr}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            color: '#c084fc',
            border: '1px solid rgba(168, 85, 247, 0.45)',
            borderRadius: '6px',
            padding: '1px 6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            margin: '0 2px',
            verticalAlign: 'baseline',
            transition: 'all 0.15s ease'
          }}
          data-testid={`btn-seek-timestamp-${timeStr}`}
        >
          <Clock size={11} />
          <span>{timeStr}</span>
        </button>
      );

      lastIndex = timeRegex.lastIndex;
    }

    if (lastIndex < content.length) {
      elements.push(content.substring(lastIndex));
    }

    return elements;
  };

  const containerBg = isAssistant
    ? (isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)')
    : (isLightBg ? '#f1f5f9' : 'rgba(168, 85, 247, 0.12)');

  const borderColor = isAssistant
    ? (isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)')
    : (isLightBg ? '#d8b4fe' : 'rgba(168, 85, 247, 0.35)');

  return (
    <div
      data-testid={`tutor-message-${message.id || message.role}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isAssistant ? 'flex-start' : 'flex-end',
        gap: '6px',
        width: '100%',
        margin: '6px 0'
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: '10px',
          maxWidth: '92%',
          alignItems: 'flex-start',
          flexDirection: isAssistant ? 'row' : 'row-reverse'
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: isAssistant ? '#7c3aed' : '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0,
            boxShadow: isAssistant ? '0 0 10px rgba(124, 58, 237, 0.4)' : 'none'
          }}
        >
          {isAssistant ? <Bot size={17} /> : <User size={16} />}
        </div>

        {/* Balão da Mensagem */}
        <div
          style={{
            backgroundColor: containerBg,
            border: `1px solid ${borderColor}`,
            borderRadius: isAssistant ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
            padding: '12px 16px',
            fontSize: '13.5px',
            lineHeight: 1.65,
            color: isLightBg ? '#1e293b' : '#f1f5f9',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {isAssistant && (
            <div
              data-testid="tutor-name-badge"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isLightBg ? '#7c3aed' : '#c084fc',
                marginBottom: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span>{tutorName}</span>
              {message.isStreaming && (
                <span
                  style={{
                    fontSize: '10px',
                    color: '#a855f7',
                    fontWeight: 500,
                    opacity: 0.85
                  }}
                >
                  (digitando...)
                </span>
              )}
            </div>
          )}

          {message.isStreaming && !message.content ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#a855f7', fontSize: '13px' }}>
              <span className="animate-spin inline-block">✨</span>
              <span>Pensando e estruturando a resposta...</span>
            </span>
          ) : (
            <>
              {renderFormattedContent(message.content)}
              {message.isStreaming && (
                <span
                  data-testid="tutor-streaming-cursor"
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '14px',
                    backgroundColor: '#a855f7',
                    marginLeft: '4px',
                    verticalAlign: 'middle',
                    borderRadius: '2px',
                    animation: 'pulse 0.75s infinite'
                  }}
                />
              )}
            </>
          )}

          {/* Aulas Correlatas Recomendadas */}
          {isAssistant && Array.isArray(message.related_lessons) && message.related_lessons.length > 0 && (
            <div
              style={{
                marginTop: '12px',
                paddingTop: '10px',
                borderTop: `1px solid ${borderColor}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
              data-testid="tutor-related-lessons-box"
            >
              <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Aulas Relacionadas a Este Tema:
              </span>
              {message.related_lessons.map((rel, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectRelatedLesson && onSelectRelatedLesson(rel)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${borderColor}`,
                    color: isLightBg ? '#334155' : '#e2e8f0',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: onSelectRelatedLesson ? 'pointer' : 'default',
                    textAlign: 'left',
                    gap: '8px'
                  }}
                  data-testid={`btn-related-lesson-${rel.lesson_id}`}
                >
                  <span>
                    📚 {rel.course_title} • {rel.module_title ? `${rel.module_title} • ` : ''}{rel.lesson_title}
                  </span>
                  <ExternalLink size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}

          {/* Justificativa de feedback se existente */}
          {isAssistant && message.feedback_text && (
            <div
              data-testid="tutor-feedback-text-indicator"
              style={{
                marginTop: '8px',
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(249, 115, 22, 0.08)',
                border: '1px solid rgba(249, 115, 22, 0.25)',
                fontSize: '11px',
                color: '#fb923c',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '5px',
                lineHeight: 1.4
              }}
            >
              <MessageSquare size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Sua justificativa enviada:</strong> "{message.feedback_text}"
              </span>
            </div>
          )}

          {/* Barra de Ações: Like, Dislike e Copiar para respostas da IA */}
          {isAssistant && !message.isStreaming && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: '8px',
                paddingTop: '6px',
                borderTop: `1px solid ${isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.04)'}`
              }}
            >
              {/* Avaliação Like / Dislike */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => onFeedback && onFeedback({ messageId: message.id, rating: 'like' })}
                  title={message.feedback_rating === 'like' ? 'Você marcou como útil' : 'Gostei desta resposta'}
                  data-testid="btn-feedback-like"
                  style={{
                    background: message.feedback_rating === 'like' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                    border: message.feedback_rating === 'like' ? '1px solid rgba(16, 185, 129, 0.35)' : 'none',
                    color: message.feedback_rating === 'like' ? '#10b981' : (isLightBg ? '#64748b' : '#94a3b8'),
                    borderRadius: '6px',
                    padding: '3px 7px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ThumbsUp size={12} fill={message.feedback_rating === 'like' ? '#10b981' : 'none'} />
                  <span>{message.feedback_rating === 'like' ? 'Útil' : ''}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onRequestDislikeFeedback ? onRequestDislikeFeedback(message) : (onFeedback && onFeedback({ messageId: message.id, rating: 'dislike' }))}
                  title={message.feedback_rating === 'dislike' ? 'Você indicou que precisa melhorar' : 'Não gostei / precisa melhorar'}
                  data-testid="btn-feedback-dislike"
                  style={{
                    background: message.feedback_rating === 'dislike' ? 'rgba(249, 115, 22, 0.15)' : 'transparent',
                    border: message.feedback_rating === 'dislike' ? '1px solid rgba(249, 115, 22, 0.35)' : 'none',
                    color: message.feedback_rating === 'dislike' ? '#f97316' : (isLightBg ? '#64748b' : '#94a3b8'),
                    borderRadius: '6px',
                    padding: '3px 7px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ThumbsDown size={12} fill={message.feedback_rating === 'dislike' ? '#f97316' : 'none'} />
                  <span>{message.feedback_rating === 'dislike' ? 'Não útil' : ''}</span>
                </button>
              </div>

              {/* Ações da Direita: Salvar nas Anotações e Copiar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {onSaveToNotes && (
                  <button
                    type="button"
                    onClick={() => onSaveToNotes(message)}
                    title="Salvar esta explicação nas Minhas Anotações desta aula"
                    data-testid="btn-save-note-from-message"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isLightBg ? '#64748b' : '#94a3b8',
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      padding: '3px 6px',
                      borderRadius: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <BookOpen size={12} color="#a855f7" />
                    <span>Salvar Anotação</span>
                  </button>
                )}

                {/* Botão Copiar */}
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: isLightBg ? '#64748b' : '#94a3b8',
                    fontSize: '11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    padding: '3px 6px'
                  }}
                  data-testid="btn-copy-tutor-message"
                >
                  {copied ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
