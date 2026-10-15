import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Check, Loader2, Sparkles } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export const TAG_COLORS = [
  { label: 'Roxo Neon', value: '#a855f7' },
  { label: 'Azul Neon', value: '#3b82f6' },
  { label: 'Ciano', value: '#06b6d4' },
  { label: 'Verde Esmeralda', value: '#10b981' },
  { label: 'Âmbar', value: '#f59e0b' },
  { label: 'Laranja Neon', value: '#f97316' },
  { label: 'Rosa Neon', value: '#ec4899' },
  { label: 'Vermelho Intenso', value: '#ef4444' },
  { label: 'Índigo', value: '#6366f1' },
  { label: 'Turquesa', value: '#14b8a6' },
];

export default function FunnelCreateTagModal({
  isOpen,
  initialName = '',
  onClose,
  onTagCreated,
}) {
  const { addToast } = useToast();
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState('#a855f7');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setColor('#a855f7');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      addToast('Informe o nome da etiqueta', 'error');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/v1/students/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: trimmedName, color }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Falha ao criar etiqueta');
      }

      const newTag = await res.json();
      addToast(`Etiqueta "${newTag.name}" criada com sucesso!`, 'success');
      if (onTagCreated) {
        onTagCreated(newTag);
      }
      onClose();
    } catch (err) {
      addToast(err.message || 'Erro ao criar etiqueta', 'error');
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '16px',
        pointerEvents: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      data-testid="funnel-create-tag-modal-backdrop"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          backgroundColor: '#130d24',
          borderRadius: '16px',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(168, 85, 247, 0.25)',
          color: '#f8fafc',
          padding: '24px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        data-testid="funnel-create-tag-modal"
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c084fc',
            }}
          >
            <Tag size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
              Nova Etiqueta
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
              Defina o nome e a cor para identificar os contatos
            </p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Nome da Tag */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="tag-name-input"
              style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '6px' }}
            >
              Nome da Etiqueta
            </label>
            <input
              id="tag-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Lead Quente, Comprador VIP..."
              disabled={saving}
              autoFocus
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#090514',
                border: '1px solid rgba(168, 85, 247, 0.45)',
                color: '#f8fafc',
                fontSize: '0.85rem',
                outline: 'none',
              }}
              data-testid="funnel-create-tag-name-input"
            />
          </div>

          {/* Seleção de Cor */}
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}
            >
              Cor da Etiqueta
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
              }}
              data-testid="funnel-create-tag-color-palette"
            >
              {TAG_COLORS.map((c) => {
                const isSelected = color.toLowerCase() === c.value.toLowerCase();
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    title={c.label}
                    style={{
                      height: '36px',
                      borderRadius: '8px',
                      backgroundColor: c.value,
                      border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.2)',
                      boxShadow: isSelected ? `0 0 12px ${c.value}` : 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                    }}
                    data-testid={`funnel-create-tag-color-${c.value}`}
                  >
                    {isSelected && <Check size={16} color="#ffffff" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview da Etiqueta */}
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
              <Sparkles size={14} color="#c084fc" />
              <span>Pré-visualização:</span>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                borderRadius: '12px',
                backgroundColor: `${color}25`,
                color: color,
                border: `1px solid ${color}`,
                fontSize: '0.78rem',
                fontWeight: 700,
                boxShadow: `0 0 8px ${color}30`,
              }}
              data-testid="funnel-create-tag-preview"
            >
              <Tag size={12} />
              {name.trim() || 'Nome da Tag'}
            </span>
          </div>

          {/* Ações (Apenas 1 botão fechar/cancelar + 1 botão criar) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              data-testid="funnel-create-tag-cancel-btn"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: saving || !name.trim() ? 'rgba(168, 85, 247, 0.4)' : '#a855f7',
                border: '1px solid #c084fc',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
                boxShadow: saving || !name.trim() ? 'none' : '0 0 15px rgba(168, 85, 247, 0.5)',
                transition: 'all 0.15s ease',
              }}
              data-testid="funnel-create-tag-submit-btn"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Tag size={14} />}
              <span>{saving ? 'Criando...' : 'Criar Etiqueta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
