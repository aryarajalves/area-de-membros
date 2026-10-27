import React from 'react';
import { GitBranch, Play, Copy, Trash2, Folder, FolderInput, Layers, Zap, History } from 'lucide-react';

export default function FunnelCard({
  item,
  onSelectFunnel,
  onMoveClick,
  onHistoryClick,
  onDuplicateClick,
  onDeleteClick,
}) {
  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
      data-testid={`funnel-card-${item.id}`}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <GitBranch size={17} />
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#34d399',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '2px 8px',
                borderRadius: '12px',
              }}
            >
              Ativo
            </span>
            {item.folder_name && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  color: item.folder_color || '#a78bfa',
                  backgroundColor: `${item.folder_color || '#a78bfa'}20`,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontWeight: 600,
                }}
                data-testid={`funnel-folder-badge-${item.id}`}
              >
                <Folder size={11} />
                <span>{item.folder_name}</span>
              </div>
            )}
          </div>

          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            {new Date(item.created_at).toLocaleDateString('pt-BR')}
          </span>
        </div>

        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc' }}>
          {item.name}
        </h3>
        {item.description && (
          <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.4 }}>
            {item.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '14px 0', fontSize: '0.78rem', color: '#94a3b8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Layers size={13} color="#a78bfa" />
            <span>{item.nodes_count || 1} {item.nodes_count === 1 ? 'nó' : 'nós'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Zap size={13} color="#f59e0b" />
            <span>{item.executions_count || 0} execuções</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}>
        <button
          type="button"
          onClick={() => onSelectFunnel(item.id)}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          data-testid={`edit-funnel-btn-${item.id}`}
        >
          <Play size={13} fill="#ffffff" />
          <span>Editar Fluxo</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => onMoveClick(item)}
            title="Mover para Pasta"
            style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', padding: '7px', borderRadius: '6px', cursor: 'pointer' }}
            data-testid={`move-funnel-btn-${item.id}`}
          >
            <FolderInput size={13} />
          </button>

          <button
            type="button"
            onClick={() => onHistoryClick(item)}
            title="Histórico de Execuções e Contatos"
            style={{ background: 'transparent', border: '1px solid rgba(139, 92, 246, 0.35)', color: '#c084fc', padding: '7px', borderRadius: '6px', cursor: 'pointer' }}
            data-testid={`history-funnel-btn-${item.id}`}
          >
            <History size={13} />
          </button>

          <button
            type="button"
            onClick={() => onDuplicateClick(item)}
            title="Duplicar Funil"
            style={{ background: 'transparent', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', padding: '7px', borderRadius: '6px', cursor: 'pointer' }}
            data-testid={`duplicate-funnel-btn-${item.id}`}
          >
            <Copy size={13} />
          </button>

          <button
            type="button"
            onClick={() => onDeleteClick(item)}
            title="Excluir Funil"
            style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', padding: '7px', borderRadius: '6px', cursor: 'pointer' }}
            data-testid={`delete-funnel-btn-${item.id}`}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
