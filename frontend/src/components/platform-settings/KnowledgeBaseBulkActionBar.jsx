import React from 'react';
import { CheckSquare, Loader2, Zap } from 'lucide-react';

export default function KnowledgeBaseBulkActionBar({
  selectedCount = 0,
  onClear,
  onBatchIndex,
  isBatchRunning = false,
  isLightBg = false,
  textColor = '#f8fafc',
  subTextColor = '#94a3b8'
}) {
  if (selectedCount === 0) return null;

  return (
    <div
      data-testid="bulk-action-bar"
      style={{
        padding: '14px 20px',
        borderRadius: '12px',
        backgroundColor: isLightBg ? '#ecfdf5' : 'rgba(13, 148, 136, 0.15)',
        border: isLightBg ? '1px solid #a7f3d0' : '1px solid rgba(13, 148, 136, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <CheckSquare size={18} color="#0d9488" />
        <div>
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: textColor }}>
            {selectedCount} {selectedCount === 1 ? 'aula selecionada' : 'aulas selecionadas'}
          </span>
          <span style={{ fontSize: '11.5px', color: subTextColor, display: 'block' }}>
            Clique no botão ao lado para indexar o RAG e gerar 5 Q&A em lote com popup de progresso
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={onClear}
          data-testid="btn-clear-selection"
          style={{
            background: 'transparent',
            border: 'none',
            color: subTextColor,
            fontSize: '12.5px',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          Desmarcar Todas
        </button>
        <button
          type="button"
          disabled={isBatchRunning}
          onClick={onBatchIndex}
          data-testid="btn-index-selected-rag"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 18px',
            borderRadius: '8px',
            backgroundColor: '#0d9488',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            border: 'none',
            cursor: isBatchRunning ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)'
          }}
        >
          {isBatchRunning ? <Loader2 size={15} className="animate-spin" /> : <Zap size={15} />}
          <span>{isBatchRunning ? 'Sincronizando Seleção...' : '⚡ Sincronizar Selecionadas no RAG'}</span>
        </button>
      </div>
    </div>
  );
}
