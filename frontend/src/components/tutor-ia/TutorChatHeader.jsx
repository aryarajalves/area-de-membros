import React from 'react';
import { Bot, Trash2, RefreshCw, Database, Download } from 'lucide-react';

export default function TutorChatHeader({
  tutorName = 'Tutor IA 24h',
  textColor = '#f8fafc',
  subTextColor = '#94a3b8',
  borderColor = 'rgba(255, 255, 255, 0.08)',
  hasMessages = false,
  onClearHistory,
  onRefresh,
  onExportChat,
  isManager = false,
  indexingRag = false,
  onIndexRagLesson
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingBottom: '12px',
        borderBottom: `1px solid ${borderColor}`,
        flexWrap: 'wrap',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
          }}
        >
          <Bot size={20} />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: textColor }}>
            {tutorName || 'Tutor IA 24h'} da Aula
          </h4>
          <span style={{ fontSize: '12px', color: subTextColor }}>
            Tire dúvidas do que o professor ensinou no vídeo com respostas em tempo real
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {hasMessages && onExportChat && (
          <button
            type="button"
            onClick={onExportChat}
            title="Exportar histórico desta aula em PDF ou Markdown"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '7px',
              backgroundColor: 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              color: '#c084fc',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            data-testid="btn-export-tutor-chat"
          >
            <Download size={13} />
            <span>Exportar</span>
          </button>
        )}

        {hasMessages && (
          <button
            type="button"
            onClick={onClearHistory}
            title="Limpar histórico desta aula"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '7px',
              backgroundColor: 'transparent',
              border: `1px solid ${borderColor}`,
              color: subTextColor,
              fontSize: '12px',
              cursor: 'pointer'
            }}
            data-testid="btn-clear-tutor-history"
          >
            <Trash2 size={13} />
            <span>Limpar Histórico</span>
          </button>
        )}

        <button
          type="button"
          onClick={onRefresh}
          title="Atualizar status e mensagens"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '6px 8px',
            borderRadius: '7px',
            backgroundColor: 'transparent',
            border: `1px solid ${borderColor}`,
            color: subTextColor,
            cursor: 'pointer'
          }}
          data-testid="btn-refresh-tutor"
        >
          <RefreshCw size={13} />
        </button>

        {isManager && (
          <button
            type="button"
            onClick={onIndexRagLesson}
            disabled={indexingRag}
            title="Indexar / Re-indexar conteúdo desta aula no RAG Vetorial"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              borderRadius: '7px',
              backgroundColor: 'rgba(13, 148, 136, 0.15)',
              border: '1px solid rgba(13, 148, 136, 0.35)',
              color: '#2dd4bf',
              fontSize: '12px',
              fontWeight: 600,
              cursor: indexingRag ? 'not-allowed' : 'pointer'
            }}
            data-testid="btn-index-lesson-rag"
          >
            <Database size={13} className={indexingRag ? 'animate-spin' : ''} />
            <span>{indexingRag ? 'Indexando...' : 'Sincronizar RAG'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
