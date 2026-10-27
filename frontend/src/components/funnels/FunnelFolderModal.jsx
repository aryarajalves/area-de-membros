import React, { useState, useEffect } from 'react';
import { Folder, X } from 'lucide-react';

const COLOR_PRESETS = [
  { label: 'Índigo', value: '#6366f1' },
  { label: 'Roxo', value: '#8b5cf6' },
  { label: 'Rosa Neon', value: '#ec4899' },
  { label: 'Esmeralda', value: '#10b981' },
  { label: 'Âmbar', value: '#f59e0b' },
  { label: 'Ciano', value: '#06b6d4' },
  { label: 'Rubi', value: '#ef4444' },
];

export default function FunnelFolderModal({
  isOpen,
  onClose,
  onSave,
  folder = null,
  saving = false,
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6366f1');

  useEffect(() => {
    if (folder) {
      setName(folder.name || '');
      setColor(folder.color || '#6366f1');
    } else {
      setName('');
      setColor('#6366f1');
    }
  }, [folder, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
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
      data-testid="funnel-folder-modal"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(139, 92, 246, 0.4)',
          borderRadius: '16px',
          padding: '24px',
          color: '#f8fafc',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: `${color}25`,
                color: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Folder size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
              {folder ? 'Editar Pasta de Funis' : 'Nova Pasta de Funis'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '6px', fontWeight: 600 }}>
              Nome da Pasta *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Boas-vindas, Recuperação, Eventos..."
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
              data-testid="folder-name-input"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: '8px', fontWeight: 600 }}>
              Cor de Destaque
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  title={c.label}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    backgroundColor: c.value,
                    border: color === c.value ? '2px solid #ffffff' : '2px solid transparent',
                    cursor: 'pointer',
                    boxShadow: color === c.value ? `0 0 10px ${c.value}` : 'none',
                    transform: color === c.value ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                  data-testid={`color-preset-${c.value}`}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
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
              disabled={saving || !name.trim()}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
                opacity: saving || !name.trim() ? 0.6 : 1,
              }}
              data-testid="submit-folder-btn"
            >
              {saving ? 'Salvando...' : folder ? 'Salvar Alterações' : 'Criar Pasta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
