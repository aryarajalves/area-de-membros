import React, { useState, useEffect } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, X, Check, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function BatchLessonOrderModal({
  isOpen,
  onClose,
  courseId,
  module,
  onSuccess,
  isLightBg = false
}) {
  const { addToast } = useToast();
  const [orderedLessons, setOrderedLessons] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && module) {
      const initial = (module.lessons || []).map((l, idx) => ({
        ...l,
        order_index: l.order_index !== undefined && l.order_index !== null ? Number(l.order_index) : (idx + 1)
      }));
      initial.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
      setOrderedLessons(initial);
      setSaving(false);
    }
  }, [isOpen, module]);

  if (!isOpen || !module) return null;

  const handleMoveUp = (index) => {
    if (index <= 0) return;
    setOrderedLessons((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index) => {
    if (index >= orderedLessons.length - 1) return;
    setOrderedLessons((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleOrderChange = (id, newOrder) => {
    const val = Number(newOrder);
    setOrderedLessons((prev) =>
      prev.map((l) => (l.id === id ? { ...l, order_index: isNaN(val) ? 0 : val } : l))
    );
  };

  const handleAutoNumber = () => {
    setOrderedLessons((prev) =>
      prev.map((l, idx) => ({ ...l, order_index: idx + 1 }))
    );
    addToast('Aulas auto-numeradas sequencialmente de 1 a ' + orderedLessons.length, 'success');
  };

  const handleInvertOrder = () => {
    setOrderedLessons((prev) => [...prev].reverse());
  };

  const handleSave = async () => {
    if (orderedLessons.length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    const token = localStorage.getItem('auth_token');
    try {
      const items = orderedLessons.map((l, idx) => ({
        lesson_id: l.id,
        order_index: l.order_index !== undefined && l.order_index !== null ? Number(l.order_index) : (idx + 1)
      }));

      const res = await fetch(`/api/v1/courses/${courseId}/modules/${module.id}/lessons/batch-order`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ items })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Erro ao atualizar ordem das aulas.');
      }

      const data = await res.json();
      addToast(data.message || 'Ordem das aulas atualizada com sucesso!', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      addToast(err.message || 'Falha ao salvar a nova ordem das aulas.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const panelBg = isLightBg ? '#ffffff' : '#0f172a';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)';
  const itemBg = isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';
  const btnSecBg = isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.06)';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
      }}
      data-testid="batch-lesson-order-modal"
    >
      <div
        style={{
          width: '100%', maxWidth: '680px', maxHeight: '90vh',
          background: panelBg, borderRadius: '16px', border: `1px solid ${borderColor}`,
          display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden'
        }}
      >
        {/* Cabeçalho */}
        <div style={{ padding: '18px 24px', borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowUpDown size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: textColor }}>
                Reordenar Aulas em Lote
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: subTextColor }}>
                {module.title} • {orderedLessons.length} aula(s)
              </p>
            </div>
          </div>
          <button
            type="button" onClick={onClose} disabled={saving} data-testid="batch-order-close-btn"
            style={{ background: 'transparent', border: 'none', color: subTextColor, cursor: 'pointer', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Ações Rápidas */}
        <div style={{ padding: '12px 24px', background: btnSecBg, borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: subTextColor }}>
            Ajuste os botões <strong>↑ ↓</strong> ou digite o número da ordem em cada aula.
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button" onClick={handleAutoNumber} disabled={saving || orderedLessons.length === 0}
              data-testid="batch-auto-number-btn" title="Ajusta os números sequencialmente 1, 2, 3..."
              style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${borderColor}`, background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={13} />
              <span>Auto-Numerar (1, 2, 3...)</span>
            </button>
            <button
              type="button" onClick={handleInvertOrder} disabled={saving || orderedLessons.length <= 1}
              data-testid="batch-invert-order-btn" title="Inverter a sequência das aulas"
              style={{ padding: '6px 12px', borderRadius: '6px', border: `1px solid ${borderColor}`, background: 'transparent', color: subTextColor, fontSize: '12px', fontWeight: 500, cursor: 'pointer' }}
            >
              Inverter
            </button>
          </div>
        </div>

        {/* Lista com Rolagem */}
        <div
          style={{ padding: '16px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px' }}
          data-testid="batch-order-list"
        >
          {orderedLessons.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: subTextColor, fontSize: '13px' }}>
              Este módulo não possui nenhuma aula cadastrada para reordenar.
            </div>
          ) : (
            orderedLessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                data-testid={`batch-order-item-${lesson.id}`}
                style={{ padding: '10px 14px', background: itemBg, borderRadius: '10px', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
              >
                {/* Controles de Subir / Descer e Ordem */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      type="button" disabled={idx === 0 || saving} onClick={() => handleMoveUp(idx)}
                      data-testid={`move-up-btn-${lesson.id}`} title="Mover para cima"
                      style={{ background: 'transparent', border: 'none', color: idx === 0 ? (isLightBg ? '#cbd5e1' : '#475569') : '#38bdf8', cursor: idx === 0 ? 'not-allowed' : 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button" disabled={idx === orderedLessons.length - 1 || saving} onClick={() => handleMoveDown(idx)}
                      data-testid={`move-down-btn-${lesson.id}`} title="Mover para baixo"
                      style={{ background: 'transparent', border: 'none', color: idx === orderedLessons.length - 1 ? (isLightBg ? '#cbd5e1' : '#475569') : '#38bdf8', cursor: idx === orderedLessons.length - 1 ? 'not-allowed' : 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  {/* Input Numérico da Ordem */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: subTextColor, fontWeight: 500 }}>Ordem:</span>
                    <input
                      type="number" min={0} value={lesson.order_index ?? idx + 1}
                      onChange={(e) => handleOrderChange(lesson.id, e.target.value)}
                      data-testid={`order-input-${lesson.id}`}
                      style={{ width: '54px', padding: '4px 6px', borderRadius: '6px', border: `1px solid ${borderColor}`, background: isLightBg ? '#ffffff' : '#0f172a', color: textColor, fontSize: '12px', fontWeight: 600, textAlign: 'center' }}
                    />
                  </div>
                </div>

                {/* Info da Aula */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                  <div style={{ width: '44px', height: '25px', borderRadius: '4px', background: '#1e293b', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${borderColor}` }}>
                    {lesson.thumbnail_url ? (
                      <img src={lesson.thumbnail_url} alt={lesson.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={13} color="#64748b" />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: textColor, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lesson.title}
                    </span>
                  </div>
                </div>

                {lesson.duration && (
                  <span style={{ fontSize: '11px', color: subTextColor, flexShrink: 0 }}>
                    {lesson.duration}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Rodapé com Botões de Ação */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button" onClick={onClose} disabled={saving} data-testid="batch-order-cancel-btn"
            style={{ padding: '9px 16px', borderRadius: '8px', border: `1px solid ${borderColor}`, background: 'transparent', color: textColor, fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            type="button" onClick={handleSave} disabled={saving || orderedLessons.length === 0}
            data-testid="batch-order-save-btn"
            style={{
              padding: '9px 20px', borderRadius: '8px', border: 'none',
              background: saving || orderedLessons.length === 0 ? (isLightBg ? '#cbd5e1' : '#334155') : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff', fontSize: '13px', fontWeight: 600,
              cursor: saving || orderedLessons.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: saving || orderedLessons.length === 0 ? 'none' : '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Salvar Nova Ordem</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
