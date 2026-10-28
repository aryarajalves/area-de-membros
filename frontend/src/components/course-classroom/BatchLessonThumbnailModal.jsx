import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, X, Check, Loader2, Layers, CheckSquare, Square } from 'lucide-react';
import LessonThumbnailManager from './LessonThumbnailManager';
import { useToast } from '../../context/ToastContext';

export default function BatchLessonThumbnailModal({
  isOpen,
  onClose,
  courseId,
  module,
  onSuccess,
  onUploadThumbnail,
  isLightBg = false
}) {
  const { addToast } = useToast();
  const [selectedLessonIds, setSelectedLessonIds] = useState([]);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const lessons = module?.lessons || [];

  // Ao abrir o modal ou mudar de módulo, seleciona todas as aulas por padrão
  useEffect(() => {
    if (isOpen && module) {
      const allIds = (module.lessons || []).map((l) => l.id);
      setSelectedLessonIds(allIds);
      setThumbnailUrl('');
      setSaving(false);
    }
  }, [isOpen, module]);

  if (!isOpen || !module) return null;

  const isAllSelected = lessons.length > 0 && selectedLessonIds.length === lessons.length;
  const isNoneSelected = selectedLessonIds.length === 0;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedLessonIds([]);
    } else {
      setSelectedLessonIds(lessons.map((l) => l.id));
    }
  };

  const handleToggleLesson = (id) => {
    setSelectedLessonIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleApply = async () => {
    if (selectedLessonIds.length === 0) {
      addToast('Selecione pelo menos uma aula para aplicar a capa.', 'error');
      return;
    }
    if (!thumbnailUrl || !thumbnailUrl.trim()) {
      addToast('Envie ou selecione uma imagem de capa antes de aplicar.', 'error');
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('auth_token');
    try {
      const res = await fetch(`/api/v1/courses/${courseId}/modules/${module.id}/lessons/batch-thumbnail`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          lesson_ids: selectedLessonIds,
          thumbnail_url: thumbnailUrl.trim()
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao atualizar as capas das aulas.');
      }

      const data = await res.json();
      addToast(data.message || `Capa aplicada com sucesso a ${selectedLessonIds.length} aulas!`, 'success');
      onSuccess?.(selectedLessonIds, thumbnailUrl.trim());
      onClose();
    } catch (err) {
      addToast(err.message || 'Falha ao aplicar capa em lote.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const panelBg = isLightBg ? '#ffffff' : '#0f172a';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const itemBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const itemHoverBorder = isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      data-testid="batch-lesson-thumbnail-modal"
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          background: panelBg,
          borderRadius: '16px',
          border: `1px solid ${borderColor}`,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.15)',
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: textColor }}>
                Trocar Capa das Aulas em Lote
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: subTextColor }}>
                {module.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            data-testid="batch-modal-close-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: subTextColor,
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Seletor / Upload de Capa */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: textColor, marginBottom: '8px' }}>
              1. Selecione ou Envie a Nova Imagem de Capa (Thumbnail)
            </label>
            <LessonThumbnailManager
              thumbnailUrl={thumbnailUrl}
              onChange={setThumbnailUrl}
              onUploadThumbnail={onUploadThumbnail}
              isLightBg={isLightBg}
              title="Capa Padronizada para as Aulas Selecionadas"
              aspectRatio="16 / 9"
              recommendedText="1280 × 720 px (16:9). JPG, PNG ou WEBP (máx. 5 MB). Esta mesma imagem será definida para todas as aulas marcadas abaixo."
              emptyHelpText="Nenhuma imagem enviada ainda. Faça upload de um arquivo ou cole uma URL direta abaixo."
              previewMaxHeight="160px"
            />
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="Ou cole aqui a URL direta da imagem (ex: https://...)"
                data-testid="batch-thumbnail-url-input"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${borderColor}`,
                  background: isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
                  color: textColor,
                  fontSize: '12.5px'
                }}
              />
            </div>
          </div>

          {/* Seleção de Aulas */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}
            >
              <label style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
                2. Aulas do Módulo que receberão a nova capa:
              </label>
              <span style={{ fontSize: '12px', color: '#a855f7', fontWeight: 500 }}>
                {selectedLessonIds.length} de {lessons.length} selecionadas
              </span>
            </div>

            {/* Checkbox Geral: Selecionar Todas */}
            <div
              onClick={handleToggleSelectAll}
              data-testid="batch-select-all-btn"
              style={{
                padding: '10px 14px',
                background: itemBg,
                borderRadius: '8px',
                border: `1px solid ${borderColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                marginBottom: '10px',
                userSelect: 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isAllSelected ? (
                  <CheckSquare size={18} color="#a855f7" />
                ) : (
                  <Square size={18} color={subTextColor} />
                )}
                <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
                  Selecionar todas as aulas deste módulo
                </span>
              </div>
              <span style={{ fontSize: '12px', color: subTextColor }}>
                {isAllSelected ? 'Desmarcar todas' : 'Marcar todas'}
              </span>
            </div>

            {/* Lista das Aulas */}
            <div
              style={{
                maxHeight: '220px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                paddingRight: '4px'
              }}
            >
              {lessons.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: subTextColor, fontSize: '13px' }}>
                  Este módulo não possui nenhuma aula cadastrada.
                </div>
              ) : (
                lessons.map((lesson, index) => {
                  const isChecked = selectedLessonIds.includes(lesson.id);
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => handleToggleLesson(lesson.id)}
                      data-testid={`batch-lesson-row-${lesson.id}`}
                      style={{
                        padding: '8px 12px',
                        background: isChecked ? (isLightBg ? 'rgba(168, 85, 247, 0.08)' : 'rgba(168, 85, 247, 0.12)') : itemBg,
                        borderRadius: '8px',
                        border: `1px solid ${isChecked ? '#a855f7' : borderColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        {isChecked ? (
                          <CheckSquare size={16} color="#a855f7" style={{ flexShrink: 0 }} />
                        ) : (
                          <Square size={16} color={subTextColor} style={{ flexShrink: 0 }} />
                        )}

                        {/* Thumbnail atual da aula */}
                        <div
                          style={{
                            width: '48px',
                            height: '27px',
                            borderRadius: '4px',
                            background: '#1e293b',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `1px solid ${borderColor}`
                          }}
                        >
                          {lesson.thumbnail_url ? (
                            <img
                              src={lesson.thumbnail_url}
                              alt={lesson.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <ImageIcon size={14} color="#64748b" />
                          )}
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: textColor,
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            Aula {index + 1}: {lesson.title}
                          </span>
                        </div>
                      </div>

                      {lesson.duration && (
                        <span style={{ fontSize: '11px', color: subTextColor, flexShrink: 0 }}>
                          {lesson.duration}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Rodapé com Botões de Ação */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            data-testid="batch-cancel-btn"
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: `1px solid ${borderColor}`,
              background: 'transparent',
              color: textColor,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={saving || isNoneSelected || !thumbnailUrl?.trim()}
            data-testid="batch-apply-btn"
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              background: saving || isNoneSelected || !thumbnailUrl?.trim()
                ? (isLightBg ? '#cbd5e1' : '#334155')
                : 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: saving || isNoneSelected || !thumbnailUrl?.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: saving || isNoneSelected || !thumbnailUrl?.trim() ? 'none' : '0 4px 12px rgba(168, 85, 247, 0.3)'
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Aplicando...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Aplicar Capa nas {selectedLessonIds.length} Aula(s)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
