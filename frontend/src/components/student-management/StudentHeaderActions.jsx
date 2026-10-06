import React from 'react';
import { Download, Upload, ChevronDown, Send, Tag } from 'lucide-react';

export default function StudentHeaderActions({
  textColor,
  isLightBg,
  exporting,
  isExportDropdownOpen,
  setIsExportDropdownOpen,
  onExport,
  onOpenImport,
  onOpenBroadcast,
  onOpenTags,
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', flexWrap: 'wrap' }}>
      {/* Botão Gerenciar Etiquetas */}
      {onOpenTags && (
        <button
          type="button"
          onClick={onOpenTags}
          style={{
            padding: '9px 15px',
            borderRadius: '8px',
            border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
            color: textColor,
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            transition: 'all 0.2s ease',
          }}
          data-testid="open-student-tags-modal-btn"
        >
          <Tag size={16} color="#3b82f6" />
          Etiquetas
        </button>
      )}

      {/* Botão Disparo em Massa */}
      {onOpenBroadcast && (
        <button
          type="button"
          onClick={onOpenBroadcast}
          style={{
            padding: '9px 18px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            color: '#ffffff',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 12px rgba(139, 92, 246, 0.35)',
            transition: 'all 0.2s ease',
          }}
          data-testid="open-broadcast-modal-btn"
        >
          <Send size={16} />
          Disparo em Massa
        </button>
      )}
      {/* Dropdown de Exportação */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => setIsExportDropdownOpen((prev) => !prev)}
          disabled={exporting}
          style={{
            padding: '9px 16px',
            borderRadius: '8px',
            border: isLightBg ? '1px solid #cbd5e1' : '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)',
            color: textColor,
            fontSize: '0.88rem',
            fontWeight: 600,
            cursor: exporting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          data-testid="export-students-dropdown-btn"
        >
          <Download size={16} />
          {exporting ? 'Exportando...' : 'Exportar'}
          <ChevronDown size={14} />
        </button>

        {isExportDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '110%',
              right: 0,
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
              zIndex: 50,
              minWidth: '170px',
              overflow: 'hidden',
            }}
            data-testid="export-options-menu"
          >
            <button
              type="button"
              onClick={() => onExport('csv')}
              style={{
                width: '100%',
                padding: '10px 14px',
                textAlign: 'left',
                backgroundColor: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              data-testid="export-csv-option"
            >
              Exportar CSV (.csv)
            </button>
            <button
              type="button"
              onClick={() => onExport('xlsx')}
              style={{
                width: '100%',
                padding: '10px 14px',
                textAlign: 'left',
                backgroundColor: 'transparent',
                border: 'none',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              data-testid="export-xlsx-option"
            >
              Exportar Excel (.xlsx)
            </button>
          </div>
        )}
      </div>

      {/* Botão Importar */}
      <button
        type="button"
        onClick={onOpenImport}
        style={{
          padding: '9px 18px',
          borderRadius: '8px',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          border: 'none',
          fontSize: '0.88rem',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
          transition: 'all 0.2s ease',
        }}
        data-testid="open-import-modal-btn"
      >
        <Upload size={16} />
        Importar Alunos
      </button>
    </div>
  );
}
