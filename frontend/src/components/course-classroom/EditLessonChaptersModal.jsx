import React, { useState } from 'react';
import { Bookmark, Clock, Plus, Trash2, X, Loader2, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function EditLessonChaptersModal({
  isOpen,
  onClose,
  chapters = [],
  courseId,
  moduleId,
  lessonId,
  onSaveSuccess,
  isLightBg = false
}) {
  const { addToast } = useToast();
  const [items, setItems] = useState(() => {
    if (Array.isArray(chapters) && chapters.length > 0) {
      return chapters.map((ch) => ({
        time: ch.time || '00:00',
        seconds: ch.seconds || 0,
        title: ch.title || ''
      }));
    }
    return [{ time: '00:00', seconds: 0, title: 'Introdução' }];
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#475569' : '#94a3b8';
  const modalBg = isLightBg ? '#ffffff' : '#0f172a';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)';
  const inputBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.05)';

  const handleTimeChange = (index, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], time: value };
      return next;
    });
  };

  const handleTitleChange = (index, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], title: value };
      return next;
    });
  };

  const handleAddChapter = () => {
    let nextTime = '00:00';
    if (items.length > 0) {
      const last = items[items.length - 1];
      const parts = (last.time || '00:00').split(':');
      try {
        let sec = 0;
        if (parts.length === 2) sec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        else if (parts.length === 3) sec = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
        sec += 60;
        const mins = Math.floor(sec / 60);
        const secs = sec % 60;
        nextTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      } catch {
        nextTime = '01:00';
      }
    }
    setItems((prev) => [...prev, { time: nextTime, seconds: 0, title: '' }]);
  };

  const handleRemoveChapter = (index) => {
    if (items.length <= 1) {
      addToast('A aula deve ter pelo menos um capítulo.', 'warning');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    // Validação
    for (let i = 0; i < items.length; i++) {
      if (!items[i].title.trim()) {
        addToast(`O título do capítulo #${i + 1} não pode estar vazio.`, 'error');
        return;
      }
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const res = await fetch(
        `/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/transcription/chapters`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ chapters: items })
        }
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Falha ao salvar os capítulos.');
      }

      const json = await res.json();
      addToast('Capítulos atualizados com sucesso!', 'success');
      if (onSaveSuccess) onSaveSuccess(json.chapters || items);
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar capítulos:', err);
      addToast(err.message || 'Falha ao atualizar capítulos.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      data-testid="edit-chapters-modal-backdrop"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        data-testid="edit-chapters-modal-content"
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: modalBg,
          borderRadius: '14px',
          border: `1px solid ${borderColor}`,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: `1px solid ${borderColor}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#3b82f6'
              }}
            >
              <Bookmark size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: textColor }}>
                Editar Capítulos da Aula
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: subTextColor }}>
                Ajuste os títulos e minutagens gerados pela IA ou adicione novos tópicos.
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="btn-close-edit-chapters-modal"
            onClick={onClose}
            disabled={saving}
            style={{
              background: 'transparent',
              border: 'none',
              color: subTextColor,
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Lista de Capítulos */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {items.map((item, idx) => (
            <div
              key={idx}
              data-testid={`chapter-edit-row-${idx}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${borderColor}`
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: subTextColor,
                  width: '24px',
                  textAlign: 'center',
                  flexShrink: 0
                }}
              >
                #{idx + 1}
              </span>

              {/* Tempo */}
              <div style={{ position: 'relative', width: '100px', flexShrink: 0 }}>
                <Clock
                  size={14}
                  color="#3b82f6"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  data-testid={`input-chapter-time-${idx}`}
                  value={item.time}
                  onChange={(e) => handleTimeChange(idx, e.target.value)}
                  placeholder="00:00"
                  style={{
                    width: '100%',
                    padding: '8px 8px 8px 30px',
                    backgroundColor: inputBg,
                    border: `1px solid ${borderColor}`,
                    borderRadius: '6px',
                    color: textColor,
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Título do Capítulo */}
              <input
                type="text"
                data-testid={`input-chapter-title-${idx}`}
                value={item.title}
                onChange={(e) => handleTitleChange(idx, e.target.value)}
                placeholder="Título do capítulo..."
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  backgroundColor: inputBg,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '6px',
                  color: textColor,
                  fontSize: '13.5px',
                  fontWeight: 500,
                  outline: 'none'
                }}
              />

              {/* Botão Remover */}
              <button
                type="button"
                data-testid={`btn-remove-chapter-${idx}`}
                onClick={() => handleRemoveChapter(idx)}
                disabled={items.length <= 1}
                title="Remover capítulo"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: items.length <= 1 ? 'rgba(239, 68, 68, 0.3)' : '#ef4444',
                  cursor: items.length <= 1 ? 'not-allowed' : 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          {/* Botão Adicionar Capítulo */}
          <button
            type="button"
            data-testid="btn-add-chapter-row"
            onClick={handleAddChapter}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
              border: `1px dashed ${borderColor}`,
              borderRadius: '8px',
              color: '#3b82f6',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: '4px',
              transition: 'background-color 0.15s ease'
            }}
          >
            <Plus size={16} />
            <span>Adicionar Novo Capítulo</span>
          </button>
        </div>

        {/* Rodapé de Ações */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '16px 24px',
            borderTop: `1px solid ${borderColor}`,
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(0, 0, 0, 0.2)'
          }}
        >
          <button
            type="button"
            data-testid="btn-cancel-edit-chapters"
            onClick={onClose}
            disabled={saving}
            style={{
              padding: '9px 18px',
              backgroundColor: 'transparent',
              color: subTextColor,
              border: `1px solid ${borderColor}`,
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            data-testid="btn-save-chapters"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 20px',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{saving ? 'Salvando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
