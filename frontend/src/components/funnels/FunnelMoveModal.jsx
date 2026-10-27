import React, { useState, useEffect } from 'react';
import { Folder, FolderX, FolderInput, X, Check } from 'lucide-react';

export default function FunnelMoveModal({
  isOpen,
  funnel = null,
  folders = [],
  onClose,
  onConfirm,
  moving = false,
}) {
  const [selectedFolderId, setSelectedFolderId] = useState(null);

  useEffect(() => {
    if (funnel) {
      setSelectedFolderId(funnel.folder_id || null);
    }
  }, [funnel, isOpen]);

  if (!isOpen || !funnel) return null;

  const handleSave = () => {
    onConfirm(selectedFolderId);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '20px',
      }}
      data-testid="funnel-move-modal"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '16px',
          padding: '24px',
          color: '#f8fafc',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                color: '#a78bfa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderInput size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Mover para Pasta</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Organize seu funil na pasta correspondente
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '14px' }}>
          Funil selecionado: <strong style={{ color: '#ffffff' }}>{funnel.name}</strong>
        </p>

        {/* Lista de Pastas para Selecionar */}
        <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {/* Opção: Sem Pasta */}
          <div
            onClick={() => setSelectedFolderId(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: '10px',
              border: selectedFolderId === null ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: selectedFolderId === null ? 'rgba(139, 92, 246, 0.15)' : '#020617',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            data-testid="move-option-unassigned"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FolderX size={16} color="#94a3b8" />
              <span style={{ fontSize: '0.85rem', color: selectedFolderId === null ? '#ffffff' : '#cbd5e1', fontWeight: selectedFolderId === null ? 700 : 400 }}>
                Sem Pasta (Desvincular)
              </span>
            </div>
            {selectedFolderId === null && <Check size={16} color="#a78bfa" />}
          </div>

          {/* Pastas cadastradas */}
          {folders.map((f) => {
            const isSelected = selectedFolderId === f.id;
            const color = f.color || '#6366f1';
            return (
              <div
                key={f.id}
                onClick={() => setSelectedFolderId(f.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: isSelected ? `1px solid ${color}` : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSelected ? `${color}20` : '#020617',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                data-testid={`move-option-folder-${f.id}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Folder size={16} color={color} />
                  <span style={{ fontSize: '0.85rem', color: isSelected ? '#ffffff' : '#cbd5e1', fontWeight: isSelected ? 700 : 400 }}>
                    {f.name}
                  </span>
                </div>
                {isSelected && <Check size={16} color={color} />}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={moving}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              backgroundColor: 'transparent',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={moving}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              cursor: moving ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
            }}
            data-testid="confirm-move-folder-btn"
          >
            {moving ? 'Movendo...' : 'Mover Funil'}
          </button>
        </div>
      </div>
    </div>
  );
}
