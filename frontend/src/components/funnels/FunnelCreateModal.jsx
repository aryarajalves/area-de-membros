import React from 'react';

export default function FunnelCreateModal({
  isOpen,
  onClose,
  onSubmit,
  newFunnelName,
  setNewFunnelName,
  newFunnelFolderId,
  setNewFunnelFolderId,
  folders = [],
  creating = false,
}) {
  if (!isOpen) return null;

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
      data-testid="funnel-create-modal"
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
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        }}
      >
        <h3 style={{ margin: '0 0 14px 0', fontSize: '1.2rem', fontWeight: 700 }}>Criar Novo Funil</h3>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
              Nome do Funil *
            </label>
            <input
              type="text"
              value={newFunnelName}
              onChange={(e) => setNewFunnelName(e.target.value)}
              placeholder="Ex: Funil de Oferta Especial"
              autoFocus
              style={{
                width: '100%',
                backgroundColor: '#020617',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#ffffff',
                padding: '9px 12px',
                fontSize: '0.85rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              data-testid="create-funnel-name-input"
            />
          </div>

          {folders.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
                Pasta de Destino (Opcional)
              </label>
              <select
                value={newFunnelFolderId || ''}
                onChange={(e) => setNewFunnelFolderId(e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: '100%',
                  backgroundColor: '#020617',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  padding: '9px 12px',
                  fontSize: '0.85rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                data-testid="create-funnel-folder-select"
              >
                <option value="">Sem Pasta</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>📁 {f.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'transparent',
                color: '#cbd5e1',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: creating ? 'not-allowed' : 'pointer',
              }}
              data-testid="submit-create-funnel-btn"
            >
              {creating ? 'Criando...' : 'Criar e Abrir Fluxo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
