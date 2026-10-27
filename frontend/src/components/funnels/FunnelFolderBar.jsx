import React from 'react';
import { Folder, FolderPlus, Layers, FolderX, Edit2, Trash2 } from 'lucide-react';

export default function FunnelFolderBar({
  folders = [],
  selectedFolderId = null,
  onSelectFolder,
  onCreateFolderClick,
  onEditFolderClick,
  onDeleteFolderClick,
  totalFunnelsCount = 0,
  unassignedFunnelsCount = 0,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '8px',
        scrollbarWidth: 'thin',
      }}
      data-testid="funnel-folder-bar"
    >
      {/* Botão: Todos os Funis */}
      <button
        type="button"
        onClick={() => onSelectFolder(null)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 14px',
          borderRadius: '10px',
          border: selectedFolderId === null ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: selectedFolderId === null ? 'rgba(139, 92, 246, 0.2)' : '#0f172a',
          color: selectedFolderId === null ? '#ffffff' : '#94a3b8',
          fontSize: '0.82rem',
          fontWeight: selectedFolderId === null ? 700 : 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
        }}
        data-testid="folder-pill-all"
      >
        <Layers size={14} color={selectedFolderId === null ? '#a78bfa' : '#64748b'} />
        <span>Todos os Funis</span>
        <span
          style={{
            fontSize: '0.72rem',
            padding: '2px 7px',
            borderRadius: '10px',
            backgroundColor: selectedFolderId === null ? 'rgba(139, 92, 246, 0.35)' : 'rgba(255, 255, 255, 0.08)',
            color: selectedFolderId === null ? '#ffffff' : '#cbd5e1',
          }}
        >
          {totalFunnelsCount}
        </span>
      </button>

      {/* Pastas Personalizadas */}
      {folders.map((folder) => {
        const isSelected = selectedFolderId === folder.id;
        const color = folder.color || '#6366f1';
        return (
          <div
            key={folder.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: '10px',
              border: isSelected ? `1px solid ${color}` : '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: isSelected ? `${color}22` : '#0f172a',
              padding: '4px 6px 4px 10px',
              gap: '6px',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
            data-testid={`folder-pill-${folder.id}`}
          >
            <button
              type="button"
              onClick={() => onSelectFolder(folder.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent',
                border: 'none',
                color: isSelected ? '#ffffff' : '#cbd5e1',
                fontSize: '0.82rem',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: color,
                  boxShadow: isSelected ? `0 0 8px ${color}` : 'none',
                }}
              />
              <Folder size={14} color={color} />
              <span>{folder.name}</span>
              <span
                style={{
                  fontSize: '0.72rem',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? `${color}44` : 'rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                }}
              >
                {folder.funnels_count || 0}
              </span>
            </button>

            {/* Ações da pasta: Renomear e Excluir */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '4px' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditFolderClick(folder);
                }}
                title="Editar Pasta"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '3px',
                  borderRadius: '4px',
                  display: 'flex',
                }}
                data-testid={`edit-folder-btn-${folder.id}`}
              >
                <Edit2 size={12} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteFolderClick(folder);
                }}
                title="Excluir Pasta"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#f87171',
                  cursor: 'pointer',
                  padding: '3px',
                  borderRadius: '4px',
                  display: 'flex',
                }}
                data-testid={`delete-folder-btn-${folder.id}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        );
      })}

      {/* Botão: Sem Pasta */}
      {unassignedFunnelsCount > 0 && (
        <button
          type="button"
          onClick={() => onSelectFolder('unassigned')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 14px',
            borderRadius: '10px',
            border: selectedFolderId === 'unassigned' ? '1px solid #64748b' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: selectedFolderId === 'unassigned' ? 'rgba(100, 116, 139, 0.25)' : '#0f172a',
            color: selectedFolderId === 'unassigned' ? '#ffffff' : '#64748b',
            fontSize: '0.82rem',
            fontWeight: selectedFolderId === 'unassigned' ? 700 : 500,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          data-testid="folder-pill-unassigned"
        >
          <FolderX size={14} color="#94a3b8" />
          <span>Sem Pasta</span>
          <span
            style={{
              fontSize: '0.72rem',
              padding: '2px 7px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
            }}
          >
            {unassignedFunnelsCount}
          </span>
        </button>
      )}

      {/* Botão: Nova Pasta */}
      <button
        type="button"
        onClick={onCreateFolderClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '10px',
          border: '1px dashed rgba(139, 92, 246, 0.5)',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          color: '#c084fc',
          fontSize: '0.82rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
        }}
        data-testid="create-folder-btn"
      >
        <FolderPlus size={14} />
        <span>+ Nova Pasta</span>
      </button>
    </div>
  );
}
