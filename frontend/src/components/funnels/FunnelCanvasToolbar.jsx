import React from 'react';
import { ArrowLeft, Save, Download, Trash2 } from 'lucide-react';

export default function FunnelCanvasToolbar({
  name,
  setName,
  saving,
  onBack,
  onSaveFlow,
  onExportJson,
  onRequestDelete,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        backgroundColor: '#0b1329',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#cbd5e1',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          data-testid="funnel-back-btn"
        >
          <ArrowLeft size={14} />
          <span>Voltar para Lista</span>
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
            NOME DO FUNIL
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(139, 92, 246, 0.4)',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              outline: 'none',
              padding: '2px 4px',
            }}
            data-testid="funnel-name-input"
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={onSaveFlow}
          disabled={saving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
          }}
          data-testid="save-flow-btn"
        >
          <Save size={15} />
          <span>{saving ? 'Salvando...' : 'Salvar Fluxo'}</span>
        </button>

        <button
          type="button"
          onClick={onExportJson}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          data-testid="export-json-btn"
        >
          <Download size={14} />
          <span>Exportar JSON</span>
        </button>

        <button
          type="button"
          onClick={onRequestDelete}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          data-testid="delete-funnel-btn"
        >
          <Trash2 size={14} />
          <span>Excluir Funil</span>
        </button>
      </div>
    </div>
  );
}
