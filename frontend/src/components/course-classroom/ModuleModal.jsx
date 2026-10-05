import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import LessonThumbnailManager from './LessonThumbnailManager';
import ExpandableTextarea from '../common/ExpandableTextarea';

export default function ModuleModal({
  isOpen,
  onClose,
  onSave,
  onUploadThumbnail,
  editingModule,
  loading,
  bgColor = '#090d16'
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [orderIndex, setOrderIndex] = useState(0);

  useEffect(() => {
    if (editingModule) {
      setTitle(editingModule.title || '');
      setDescription(editingModule.description || '');
      setImageUrl(editingModule.image_url || '');
      setOrderIndex(editingModule.order_index || 0);
    } else {
      setTitle('');
      setDescription('');
      setImageUrl('');
      setOrderIndex(0);
    }
  }, [editingModule, isOpen]);

  if (!isOpen) return null;

  const isLightBg = ['#f8fafc', '#ffffff', '#f1f5f9'].includes((bgColor || '').toLowerCase());
  const modalBg = isLightBg ? '#ffffff' : (bgColor === '#000000' ? '#0f172a' : bgColor);
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      order_index: parseInt(orderIndex, 10) || 0
    });
  };

  return (
    <div className="custom-modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="table-card" style={{ maxWidth: '520px', width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '14px', backgroundColor: modalBg, border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.14)', color: textColor, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: textColor }}>
            {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="table-action-btn"
            style={{ border: 'none', background: 'transparent', color: textColor }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Título do Módulo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Módulo 1 - Fundamentos"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-control-modern"
              data-testid="module-title-input"
            />
          </div>

          <ExpandableTextarea
            label="Descrição (Opcional)"
            placeholder="O que o aluno aprenderá neste módulo..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            textColor={textColor}
            subTextColor={isLightBg ? '#64748b' : '#94a3b8'}
            testId="module-description-input"
            toggleTestId="toggle-expand-module-description-btn"
          />

          {onUploadThumbnail && (
            <div>
              <LessonThumbnailManager
                title="Imagem de Capa / Pôster do Módulo (Estilo Netflix - Opcional)"
                thumbnailUrl={imageUrl}
                onChange={setImageUrl}
                onUploadThumbnail={onUploadThumbnail}
                isLightBg={isLightBg}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '6px' }}>
              Ordem de Exibição
            </label>
            <input
              type="number"
              min={0}
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              className="form-control-modern"
              data-testid="module-order-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" className="secondary-btn" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="primary-btn" disabled={loading} data-testid="save-module-btn">
              {loading ? 'Salvando...' : (editingModule ? 'Salvar Alterações' : 'Criar Módulo')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
