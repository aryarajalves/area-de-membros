import React, { useState, useEffect, useRef } from 'react';
import {
  Zap, CheckCircle2, Loader2, Square, CheckSquare, StopCircle, Lock, Sparkles, AlertCircle
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function BatchVideoOptimizationModal({
  isOpen,
  onClose,
  unoptimizedItems = [],
  onQueueUpdated,
  pollIntervalMs = 2000
}) {
  const { addToast } = useToast();
  const [selectedIds, setSelectedIds] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [itemStates, setItemStates] = useState({});
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const stopRequestedRef = useRef(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  useEffect(() => {
    if (isOpen && !isRunning) {
      const allIds = unoptimizedItems.map((item) => item.lesson.id);
      setSelectedIds((prev) => (prev.length > 0 ? prev.filter((id) => allIds.includes(id)) : allIds));
    }
  }, [isOpen, unoptimizedItems, isRunning]);

  if (!isOpen) return null;

  const toggleLessonSelection = (lessonId) => {
    if (isRunning || itemStates[lessonId]?.status === 'completed') return;
    setSelectedIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  const handleSelectAll = () => {
    if (isRunning) return;
    const selectable = unoptimizedItems
      .filter((item) => itemStates[item.lesson.id]?.status !== 'completed')
      .map((item) => item.lesson.id);
    setSelectedIds(selectable);
  };

  const handleDeselectAll = () => {
    if (!isRunning) setSelectedIds([]);
  };

  const waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollUntilVideoOptimized = async (lessonId, videoUrl, initialMb) => {
    for (let attempt = 0; attempt < 1800; attempt += 1) {
      if (stopRequestedRef.current) return { stopped: true };
      try {
        const res = await fetch(
          `/api/v1/courses/video-info?video_url=${encodeURIComponent(videoUrl)}`,
          { headers: getAuthHeaders() }
        );
        if (res.ok) {
          const info = await res.json();
          const pct = info.is_optimized ? 100 : (info.progress_pct || 5);
          const stageLabel =
            info.stage_label ||
            (info.is_optimized ? 'Otimizado com sucesso!' : 'Convertendo com FFmpeg (H.264 + FastStart)...');

          setItemStates((prev) => ({
            ...prev,
            [lessonId]: {
              ...prev[lessonId],
              status: info.is_optimized ? 'completed' : 'running',
              progressPct: pct,
              stageLabel,
              origMb: info.original_size_mb || initialMb || prev[lessonId]?.origMb || 0,
              newMb: info.size_mb || 0
            }
          }));

          if (info.is_optimized || (!info.is_optimizing && info.stage === 'completed')) {
            return { completed: true, info };
          }
          if (!info.is_optimizing && info.stage === 'cancelled') {
            return { stopped: true };
          }
          if (!info.is_optimizing && info.stage === 'failed') {
            return { failed: true, errorLabel: info.stage_label };
          }
        }
      } catch {
        // Continua aguardando
      }
      await waitMs(pollIntervalMs);
    }
    try {
      await fetch('/api/v1/courses/stop-video-optimization', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ video_url: videoUrl })
      });
    } catch {
      // Silencioso
    }
    return { failed: true };
  };

  const handleStartQueue = async () => {
    const queueItems = unoptimizedItems.filter(
      (item) => selectedIds.includes(item.lesson.id) && itemStates[item.lesson.id]?.status !== 'completed'
    );
    if (queueItems.length === 0) {
      addToast('Selecione pelo menos 1 aula para iniciar a fila de otimização.', 'info');
      return;
    }

    stopRequestedRef.current = false;
    setIsRunning(true);
    let completedCount = 0;

    for (const item of queueItems) {
      if (stopRequestedRef.current) break;
      const { lesson, audit } = item;
      const videoUrl = lesson?.video_url || lesson?.videos?.[0]?.video_url || '';
      if (!videoUrl) continue;

      setCurrentLessonId(lesson.id);
      setItemStates((prev) => ({
        ...prev,
        [lesson.id]: {
          status: 'running',
          progressPct: 2,
          stageLabel: 'Conectando ao Backblaze B2 para download...',
          origMb: audit?.size_mb || 0,
          newMb: 0
        }
      }));

      try {
        const startRes = await fetch('/api/v1/courses/optimize-video', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ video_url: videoUrl })
        });
        if (!startRes.ok) throw new Error('Falha ao disparar otimização.');

        const result = await pollUntilVideoOptimized(lesson.id, videoUrl, audit?.size_mb || 0);
        if (result.stopped || stopRequestedRef.current) {
          setItemStates((prev) => ({
            ...prev,
            [lesson.id]: { ...prev[lesson.id], status: 'stopped', progressPct: 0, stageLabel: 'Interrompido pelo Super Admin' }
          }));
          break;
        }

        if (result.completed) {
          completedCount += 1;
          setSelectedIds((prev) => prev.filter((id) => id !== lesson.id));
          setItemStates((prev) => ({
            ...prev,
            [lesson.id]: {
              ...prev[lesson.id],
              status: 'completed',
              progressPct: 100,
              stageLabel: 'Otimizado (FastStart)',
              newMb: result.info?.size_mb || prev[lesson.id]?.newMb || 0
            }
          }));
        } else {
          setItemStates((prev) => ({
            ...prev,
            [lesson.id]: { ...prev[lesson.id], status: 'failed', progressPct: 0, stageLabel: 'Falha ao converter vídeo' }
          }));
        }
      } catch {
        setItemStates((prev) => ({
          ...prev,
          [lesson.id]: { status: 'failed', progressPct: 0, stageLabel: 'Erro de comunicação' }
        }));
      }
    }

    setCurrentLessonId(null);
    setIsRunning(false);
    onQueueUpdated?.();

    if (stopRequestedRef.current) {
      addToast(`⏹️ Fila interrompida. ${completedCount} aula(s) foram otimizadas antes da parada.`, 'info');
    } else if (completedCount > 0) {
      addToast(`⚡ Fila concluída com sucesso! ${completedCount} aula(s) otimizadas para MP4 FastStart.`, 'success');
    }
  };

  const handleStopQueue = async () => {
    stopRequestedRef.current = true;
    const currentItem = unoptimizedItems.find((i) => i.lesson.id === currentLessonId);
    const activeUrl = currentItem?.lesson?.video_url || currentItem?.lesson?.videos?.[0]?.video_url || null;
    try {
      await fetch('/api/v1/courses/stop-video-optimization', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ video_url: activeUrl })
      });
    } catch {
      // Silencioso
    }
  };

  const totalCompleted = Object.values(itemStates).filter((s) => s.status === 'completed').length;
  const activeRunFraction = currentLessonId && itemStates[currentLessonId]?.status === 'running'
    ? Math.min(0.99, (itemStates[currentLessonId]?.progressPct || 0) / 100)
    : 0;
  const totalTarget = selectedIds.length + totalCompleted;
  const overallPct = totalTarget > 0
    ? Math.min(100, Math.round(((totalCompleted + activeRunFraction) / totalTarget) * 100))
    : 0;

  return (
    <div
      data-testid="batch-video-opt-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(5, 8, 15, 0.88)',
        backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}
    >
      <div
        data-testid="batch-video-opt-modal"
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%', maxWidth: '640px', maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          borderRadius: '20px', background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.98) 0%, rgba(9, 13, 24, 0.99) 100%)',
          border: isRunning ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(234, 179, 8, 0.45)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(234, 179, 8, 0.14)',
          padding: '26px', color: '#f8fafc', overflow: 'hidden'
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '46px', height: '46px', borderRadius: '14px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0,
              backgroundColor: isRunning ? 'rgba(59, 130, 246, 0.18)' : 'rgba(234, 179, 8, 0.18)',
              border: isRunning ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(234, 179, 8, 0.4)',
              color: isRunning ? '#60a5fa' : '#facc15'
            }}
          >
            {isRunning ? <Loader2 size={22} className="animate-spin" /> : <Zap size={22} />}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em',
                  padding: '2px 8px', borderRadius: '999px', backgroundColor: 'rgba(234, 179, 8, 0.2)', color: '#facc15'
                }}
              >
                Fila Automática 1 a 1 • Super Admin
              </span>
              {isRunning && (
                <span
                  data-testid="batch-video-opt-locked-badge"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700, color: '#93c5fd' }}
                >
                  <Lock size={11} /> Fechamento bloqueado durante execução
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 2px 0', color: '#ffffff' }}>
              {isRunning ? 'Otimizando Vídeos da Fila (1 por 1)...' : 'Fila de Otimização de Aulas (FFmpeg + FastStart)'}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
              {isRunning
                ? 'Não feche a aba. O sistema está convertendo cada aula sequencialmente.'
                : 'Escolha quais aulas não otimizadas deseja incluir na fila automática.'}
            </p>
          </div>
        </div>

        {/* Barra de Progresso Geral da Fila */}
        <div
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', padding: '12px 16px',
            marginBottom: '14px', border: '1px solid rgba(148, 163, 184, 0.14)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px', fontWeight: 700 }}>
            <span style={{ color: '#cbd5e1' }}>Concluídas: {totalCompleted} de {totalTarget} aula(s) selecionada(s)</span>
            <span style={{ color: '#facc15' }}>{overallPct}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${overallPct}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Controles de Seleção */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>{selectedIds.length} aula(s) marcada(s) para otimizar</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={isRunning}
              onClick={handleSelectAll}
              data-testid="batch-opt-select-all-btn"
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600,
                cursor: isRunning ? 'not-allowed' : 'pointer', backgroundColor: 'rgba(30, 41, 59, 0.8)',
                color: '#e2e8f0', border: '1px solid rgba(148, 163, 184, 0.25)', opacity: isRunning ? 0.5 : 1
              }}
            >
              Marcar Todas
            </button>
            <button
              type="button"
              disabled={isRunning}
              onClick={handleDeselectAll}
              data-testid="batch-opt-deselect-all-btn"
              style={{
                padding: '4px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 600,
                cursor: isRunning ? 'not-allowed' : 'pointer', backgroundColor: 'rgba(30, 41, 59, 0.8)',
                color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.2)', opacity: isRunning ? 0.5 : 1
              }}
            >
              Desmarcar Todas
            </button>
          </div>
        </div>

        {/* Lista Rolável de Aulas */}
        <div
          data-testid="batch-video-opt-list"
          style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px', marginBottom: '18px' }}
        >
          {unoptimizedItems.map(({ mod, lesson, audit }, idx) => {
            const state = itemStates[lesson.id] || { status: 'idle', progressPct: 0 };
            const isChecked = selectedIds.includes(lesson.id);
            const isDone = state.status === 'completed';
            const isCurrent = state.status === 'running';

            return (
              <div
                key={lesson.id}
                data-testid={`batch-opt-item-${lesson.id}`}
                onClick={() => toggleLessonSelection(lesson.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px',
                  cursor: isRunning || isDone ? 'default' : 'pointer',
                  backgroundColor: isCurrent ? 'rgba(59, 130, 246, 0.14)' : isDone ? 'rgba(16, 185, 129, 0.1)' : isChecked ? 'rgba(30, 41, 59, 0.65)' : 'rgba(15, 23, 42, 0.4)',
                  border: isCurrent ? '1px solid rgba(59, 130, 246, 0.45)' : isDone ? '1px solid rgba(16, 185, 129, 0.35)' : isChecked ? '1px solid rgba(234, 179, 8, 0.25)' : '1px solid rgba(148, 163, 184, 0.1)',
                  opacity: !isChecked && !isDone ? 0.55 : 1
                }}
              >
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {isDone ? (
                    <CheckCircle2 size={18} color="#34d399" />
                  ) : isCurrent ? (
                    <Loader2 size={18} color="#60a5fa" className="animate-spin" />
                  ) : isChecked ? (
                    <CheckSquare size={18} color="#facc15" />
                  ) : (
                    <Square size={18} color="#64748b" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: isDone ? '#d1fae5' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {idx + 1}. {lesson.title}
                  </div>
                  <div style={{ fontSize: '11px', color: isCurrent ? '#93c5fd' : isDone ? '#34d399' : '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>{mod.title}</span>
                    {audit?.size_mb > 0 && <span>• {audit.size_mb} MB</span>}
                    {audit?.format && <span>(.{audit.format})</span>}
                    {state.stageLabel && <span>• {state.stageLabel}</span>}
                    {isDone && state.newMb > 0 && <span>→ {state.newMb} MB (.MP4)</span>}
                  </div>
                  {isCurrent && (
                    <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(15, 23, 42, 0.85)', borderRadius: '999px', overflow: 'hidden', marginTop: '6px' }}>
                      <div style={{ width: `${state.progressPct || 5}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6 0%, #eab308 100%)', transition: 'width 0.5s ease' }} />
                    </div>
                  )}
                </div>

                <div style={{ flexShrink: 0, fontSize: '12px', fontWeight: 800 }}>
                  {isCurrent ? (
                    <span style={{ color: '#60a5fa' }}>{state.progressPct || 5}%</span>
                  ) : isDone ? (
                    <span style={{ color: '#34d399' }}>Concluído</span>
                  ) : state.status === 'stopped' ? (
                    <span style={{ color: '#facc15' }}>Parado</span>
                  ) : state.status === 'failed' ? (
                    <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <AlertCircle size={12} /> Falha
                    </span>
                  ) : isChecked ? (
                    <span style={{ color: '#eab308' }}>Na fila</span>
                  ) : (
                    <span style={{ color: '#64748b' }}>Ignorado</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé de Ações */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          {isRunning ? (
            <button
              type="button"
              onClick={handleStopQueue}
              data-testid="batch-video-opt-stop-btn"
              style={{
                width: '100%', padding: '12px 20px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 800,
                cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.6)',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)'
              }}
            >
              <StopCircle size={17} />
              <span>Parar Otimização</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                data-testid="batch-video-opt-close-btn"
                style={{
                  padding: '11px 18px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  backgroundColor: 'rgba(30, 41, 59, 0.85)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.25)'
                }}
              >
                Fechar
              </button>

              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartQueue}
                  data-testid="batch-video-opt-start-btn"
                  style={{
                    flex: 1, padding: '11px 20px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 800,
                    cursor: 'pointer', border: '1px solid rgba(234, 179, 8, 0.7)',
                    background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', color: '#0f172a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 16px rgba(234, 179, 8, 0.3)'
                  }}
                >
                  <Sparkles size={16} />
                  <span>Iniciar Fila de Otimização ({selectedIds.length})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
