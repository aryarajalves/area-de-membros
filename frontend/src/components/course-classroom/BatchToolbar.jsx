import React from 'react';
import { Folder, Layers } from 'lucide-react';

/**
 * Barra superior de controles e ações da importação em lote de aulas.
 * Permite trocar de pasta, expandir/recolher módulos, marcar/desmarcar todas
 * e definir uma capa global para todas as aulas do curso.
 */
export default function BatchToolbar({
  folderInputRef,
  onFolderSelect,
  folderName,
  modulesList,
  isImporting,
  onExpandAll,
  onSetAllSelected,
  onApplyCoverToAllLessons
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="file"
          ref={folderInputRef}
          webkitdirectory=""
          directory=""
          multiple
          style={{ display: 'none' }}
          onChange={onFolderSelect}
          disabled={isImporting}
          data-testid="folder-file-input"
        />
        <button
          type="button"
          onClick={() => folderInputRef.current?.click()}
          disabled={isImporting}
          data-testid="select-folder-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
            color: '#ffffff',
            border: '1px solid rgba(129, 140, 248, 0.4)',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: isImporting ? 'not-allowed' : 'pointer'
          }}
        >
          <Folder size={16} />
          <span>{folderName ? 'Trocar Pasta do Computador' : 'Selecionar Pasta do Computador'}</span>
        </button>

        {folderName && (
          <span style={{ fontSize: '13px', color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            📁 Pasta: <strong style={{ color: '#60a5fa' }}>{folderName}</strong>
          </span>
        )}
      </div>

      {modulesList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Seletor Global de Capa para Todas as Aulas */}
          <input
            id="global-all-lessons-cover-input"
            type="file"
            accept="image/*"
            disabled={isImporting}
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onApplyCoverToAllLessons) {
                onApplyCoverToAllLessons(file, URL.createObjectURL(file));
              }
              e.target.value = '';
            }}
            data-testid="global-all-lessons-cover-input"
          />
          <label
            htmlFor="global-all-lessons-cover-input"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              padding: '5px 11px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: isImporting ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Escolher 1 imagem e aplicar como capa para todas as aulas de todos os módulos"
            data-testid="global-all-lessons-cover-btn"
          >
            <Layers size={13} />
            <span>Capa p/ Todas as Aulas</span>
          </label>

          <button
            type="button"
            onClick={() => onExpandAll(true)}
            disabled={isImporting}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
            data-testid="expand-all-btn"
          >
            Expandir Todos
          </button>
          <button
            type="button"
            onClick={() => onExpandAll(false)}
            disabled={isImporting}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
            data-testid="collapse-all-btn"
          >
            Recolher Todos
          </button>
          <button
            type="button"
            onClick={() => onSetAllSelected(true)}
            disabled={isImporting}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
            data-testid="select-all-btn"
          >
            Marcar Todas
          </button>
          <button
            type="button"
            onClick={() => onSetAllSelected(false)}
            disabled={isImporting}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              padding: '5px 10px',
              borderRadius: '6px',
              fontSize: '11.5px',
              cursor: 'pointer'
            }}
            data-testid="deselect-all-btn"
          >
            Desmarcar Todas
          </button>
        </div>
      )}
    </div>
  );
}
