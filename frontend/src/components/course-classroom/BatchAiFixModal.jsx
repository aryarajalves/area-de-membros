import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, CheckCircle2, Loader2, Square, CheckSquare, StopCircle, Lock, AlertCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { isClientBadLessonTitle } from './SuperAdminLessonAuditFilterBar';

export default function BatchAiFixModal({
  isOpen, onClose, courseId, aiPendingItems = [], onQueueUpdated, pollIntervalMs = 2500
}) {
  const { addToast } = useToast();
  const [selectedIds, setSelectedIds] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [itemStates, setItemStates] = useState({});
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const stopRequestedRef = useRef(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  useEffect(() => {
    if (isOpen && !isRunning) {
      const allIds = aiPendingItems.map((item) => item.lesson.id);
      setSelectedIds((prev) => (prev.length > 0 ? prev.filter((id) => allIds.includes(id)) : allIds));
    }
  }, [isOpen, aiPendingItems, isRunning]);

  if (!isOpen) return null;

  const toggleLessonSelection = (lessonId) => {
    if (isRunning || itemStates[lessonId]?.status === 'completed') return;
    setSelectedIds((prev) => (prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]));
  };

  const handleSelectAll = () => {
    if (isRunning) return;
    setSelectedIds(
      aiPendingItems.filter((item) => itemStates[item.lesson.id]?.status !== 'completed').map((item) => item.lesson.id)
    );
  };

  const handleDeselectAll = () => {
    if (!isRunning) setSelectedIds([]);
  };

  const waitMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const pollUntilTranscriptionReady = async (modId, lessonId) => {
    for (let attempt = 0; attempt < 360; attempt += 1) {
      if (stopRequestedRef.current) return { stopped: true };
      await waitMs(pollIntervalMs);
      if (stopRequestedRef.current) return { stopped: true };

      try {
        const res = await fetch(`/api/v1/courses/${courseId}/modules/${modId}/lessons/${lessonId}/transcription`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          const st = (data.status || '').toLowerCase();
          if (st === 'completed' || st === 'ready') return { completed: true, data };
          if (st === 'error' || st === 'failed') {
            return { failed: true, errorLabel: data.error_message || 'Falha na transcrição IA' };
          }
          setItemStates((prev) => ({
            ...prev,
            [lessonId]: {
              ...prev[lessonId],
              status: 'running',
              progressPct: Math.min(85, 25 + attempt * 4),
              stageLabel: 'Transcrevendo áudio e gerando Capítulos/Resumo com IA...'
            }
          }));
        }
      } catch {
        // Continua aguardando
      }
    }
    return { failed: true, errorLabel: 'Tempo limite excedido na transcrição IA' };
  };

  const processSingleLessonAi = async ({ mod, lesson, audit }) => {
    const modId = mod.id;
    const lessonId = lesson.id;
    const needsChapters = Boolean(audit?.missing_chapters);

    // 1. Se não precisa de capítulos (só falta Nome IA ou Descrição IA), tenta gerar metadados direto da transcrição existente
    if (!needsChapters) {
      setItemStates((prev) => ({
        ...prev,
        [lessonId]: { status: 'running', progressPct: 35, stageLabel: 'Gerando Título e Descrição com IA...' }
      }));

      const metaRes = await fetch(`/api/v1/courses/${courseId}/modules/${modId}/lessons/${lessonId}/generate-metadata`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (metaRes.ok) {
        const metaData = await metaRes.json();
        window.dispatchEvent(
          new CustomEvent('lesson-title-updated', {
            detail: { lessonId, newTitle: metaData.title, newDescription: metaData.description }
          })
        );
        return { completed: true, newTitle: metaData.title, stageLabel: 'Título e Descrição IA gerados!' };
      }
    }

    // 2. Dispara transcrição completa (gera Transcrição + Capítulos IA + Título IA + Descrição IA)
    setItemStates((prev) => ({
      ...prev,
      [lessonId]: { status: 'running', progressPct: 15, stageLabel: 'Iniciando transcrição Whisper + Capítulos IA...' }
    }));

    const startRes = await fetch(`/api/v1/courses/${courseId}/modules/${modId}/lessons/${lessonId}/transcribe`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ language: 'pt' })
    });

    if (!startRes.ok) {
      const errBody = await startRes.json().catch(() => ({}));
      return { failed: true, errorLabel: errBody.detail || 'Não foi possível iniciar transcrição IA' };
    }

    const pollResult = await pollUntilTranscriptionReady(modId, lessonId);
    if (pollResult.stopped) return { stopped: true };
    if (pollResult.failed) return pollResult;

    const trData = pollResult.data || {};
    let finalTitle = trData.lesson_title || lesson.title;
    let finalDesc = trData.lesson_description || lesson.description || '';

    // 3. Se após a transcrição o título ainda parecer bruto ou a descrição estiver curta, reforça com generate-metadata
    if (
      audit?.bad_title ||
      audit?.missing_description ||
      isClientBadLessonTitle(finalTitle, lesson.import_identifier, finalDesc.trim().length >= 25) ||
      finalDesc.trim().length < 25
    ) {
      setItemStates((prev) => ({
        ...prev,
        [lessonId]: {
          ...prev[lessonId],
          status: 'running',
          progressPct: 90,
          stageLabel: 'Refinando Título e Descrição pedagógica com IA...'
        }
      }));
      const metaRes2 = await fetch(`/api/v1/courses/${courseId}/modules/${modId}/lessons/${lessonId}/generate-metadata`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (metaRes2.ok) {
        const metaData2 = await metaRes2.json();
        finalTitle = metaData2.title || finalTitle;
        finalDesc = metaData2.description || finalDesc;
      }
    }

    window.dispatchEvent(
      new CustomEvent('lesson-title-updated', {
        detail: { lessonId, newTitle: finalTitle, newDescription: finalDesc }
      })
    );

    return { completed: true, newTitle: finalTitle, stageLabel: 'Nome, Descrição e Capítulos IA concluídos!' };
  };

  const handleStartQueue = async () => {
    const queueItems = aiPendingItems.filter(
      (item) => selectedIds.includes(item.lesson.id) && itemStates[item.lesson.id]?.status !== 'completed'
    );
    if (queueItems.length === 0) {
      addToast('Selecione pelo menos 1 aula para iniciar a fila de IA.', 'info');
      return;
    }

    stopRequestedRef.current = false;
    setIsRunning(true);
    let completedCount = 0;

    for (const item of queueItems) {
      if (stopRequestedRef.current) break;
      const { lesson } = item;
      setCurrentLessonId(lesson.id);

      try {
        const result = await processSingleLessonAi(item);
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
              status: 'completed',
              progressPct: 100,
              stageLabel: result.stageLabel || 'Pendências de IA resolvidas!',
              newTitle: result.newTitle || lesson.title
            }
          }));
        } else {
          setItemStates((prev) => ({
            ...prev,
            [lesson.id]: { status: 'failed', progressPct: 0, stageLabel: result.errorLabel || 'Falha ao gerar com IA' }
          }));
        }
      } catch {
        setItemStates((prev) => ({
          ...prev,
          [lesson.id]: { status: 'failed', progressPct: 0, stageLabel: 'Erro de comunicação com o servidor' }
        }));
      }
    }

    setCurrentLessonId(null);
    setIsRunning(false);
    onQueueUpdated?.();

    if (stopRequestedRef.current) {
      addToast(`⏹️ Fila de IA interrompida. ${completedCount} aula(s) concluída(s).`, 'info');
    } else if (completedCount > 0) {
      addToast(`✨ Fila de IA concluída! ${completedCount} aula(s) atualizada(s) com sucesso.`, 'success');
    }
  };

  const handleStopQueue = () => {
    stopRequestedRef.current = true;
  };

  const totalCompleted = Object.values(itemStates).filter((s) => s.status === 'completed').length;
  const activeRunFraction =
    currentLessonId && itemStates[currentLessonId]?.status === 'running'
      ? Math.min(0.99, (itemStates[currentLessonId]?.progressPct || 0) / 100)
      : 0;
  const totalTarget = selectedIds.length + totalCompleted;
  const overallPct =
    totalTarget > 0 ? Math.min(100, Math.round(((totalCompleted + activeRunFraction) / totalTarget) * 100)) : 0;

  return (
    <div
      data-testid="batch-ai-fix-backdrop"
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, backgroundColor: 'rgba(5, 8, 15, 0.88)',
        backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}
    >
      <div
        data-testid="batch-ai-fix-modal"
        role="dialog"
        aria-modal="true"
        style={{
          width: '100%', maxWidth: '640px', maxHeight: '88vh', display: 'flex', flexDirection: 'column',
          borderRadius: '20px', background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.98) 0%, rgba(9, 13, 24, 0.99) 100%)',
          border: isRunning ? '1px solid rgba(168, 85, 247, 0.55)' : '1px solid rgba(192, 132, 252, 0.45)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85), 0 0 40px rgba(168, 85, 247, 0.18)',
          padding: '26px', color: '#f8fafc', overflow: 'hidden'
        }}
      >
        {/* Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '46px', height: '46px', borderRadius: '14px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0, backgroundColor: 'rgba(168, 85, 247, 0.18)',
              border: '1px solid rgba(192, 132, 252, 0.4)', color: '#c084fc'
            }}
          >
            {isRunning ? <Loader2 size={22} className="animate-spin" /> : <Sparkles size={22} />}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em',
                  padding: '2px 8px', borderRadius: '999px', backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc'
                }}
              >
                Fila Automática 1 a 1 • Super Admin IA
              </span>
              {isRunning && (
                <span
                  data-testid="batch-ai-fix-locked-badge"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', fontWeight: 700, color: '#d8b4fe' }}
                >
                  <Lock size={11} /> Fechamento bloqueado durante execução
                </span>
              )}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '4px 0 2px 0', color: '#ffffff' }}>
              {isRunning ? 'Corrigindo Pendências de IA (1 por 1)...' : 'Fila Automática de IA (Nome, Descrição e Capítulos)'}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
              {isRunning
                ? 'Não feche a aba. A IA está gerando título, descrição e capítulos para cada aula sequencialmente.'
                : 'Selecione as aulas com pendências de IA para corrigir automaticamente uma por uma.'}
            </p>
          </div>
        </div>

        {/* Barra de Progresso Geral */}
        <div
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.7)', borderRadius: '12px', padding: '12px 16px',
            marginBottom: '14px', border: '1px solid rgba(148, 163, 184, 0.14)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '12px', fontWeight: 700 }}>
            <span style={{ color: '#cbd5e1' }}>Concluídas: {totalCompleted} de {totalTarget} aula(s) selecionada(s)</span>
            <span style={{ color: '#c084fc' }}>{overallPct}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${overallPct}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6 0%, #10b981 100%)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Controles de Seleção */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8', fontWeight: 600 }}>{selectedIds.length} aula(s) marcada(s) para corrigir com IA</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              disabled={isRunning}
              onClick={handleSelectAll}
              data-testid="batch-ai-select-all-btn"
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
              data-testid="batch-ai-deselect-all-btn"
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
          data-testid="batch-ai-fix-list"
          style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px', marginBottom: '18px' }}
        >
          {aiPendingItems.map(({ mod, lesson, audit }, idx) => {
            const state = itemStates[lesson.id] || { status: 'idle', progressPct: 0 };
            const isChecked = selectedIds.includes(lesson.id);
            const isDone = state.status === 'completed';
            const isCurrent = state.status === 'running';

            return (
              <div
                key={lesson.id}
                data-testid={`batch-ai-item-${lesson.id}`}
                onClick={() => toggleLessonSelection(lesson.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px',
                  cursor: isRunning || isDone ? 'default' : 'pointer',
                  backgroundColor: isCurrent ? 'rgba(168, 85, 247, 0.14)' : isDone ? 'rgba(16, 185, 129, 0.1)' : isChecked ? 'rgba(30, 41, 59, 0.65)' : 'rgba(15, 23, 42, 0.4)',
                  border: isCurrent ? '1px solid rgba(168, 85, 247, 0.45)' : isDone ? '1px solid rgba(16, 185, 129, 0.35)' : isChecked ? '1px solid rgba(192, 132, 252, 0.25)' : '1px solid rgba(148, 163, 184, 0.1)',
                  opacity: !isChecked && !isDone ? 0.55 : 1
                }}
              >
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {isDone ? (
                    <CheckCircle2 size={18} color="#34d399" />
                  ) : isCurrent ? (
                    <Loader2 size={18} color="#c084fc" className="animate-spin" />
                  ) : isChecked ? (
                    <CheckSquare size={18} color="#c084fc" />
                  ) : (
                    <Square size={18} color="#64748b" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: isDone ? '#d1fae5' : '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {idx + 1}. {state.newTitle || lesson.title}
                  </div>
                  <div style={{ fontSize: '11px', color: isCurrent ? '#d8b4fe' : isDone ? '#34d399' : '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span>{mod.title}</span>
                    {!isDone && audit?.bad_title && <span style={{ color: '#c084fc' }}>• ✨ S/ Nome IA</span>}
                    {!isDone && audit?.missing_description && <span style={{ color: '#38bdf8' }}>• 📝 S/ Descrição</span>}
                    {!isDone && audit?.missing_chapters && <span style={{ color: '#fb923c' }}>• 📑 S/ Capítulos</span>}
                    {state.stageLabel && <span>• {state.stageLabel}</span>}
                  </div>
                  {isCurrent && (
                    <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(15, 23, 42, 0.85)', borderRadius: '999px', overflow: 'hidden', marginTop: '6px' }}>
                      <div style={{ width: `${state.progressPct || 15}%`, height: '100%', background: 'linear-gradient(90deg, #8b5cf6 0%, #ec4899 100%)', transition: 'width 0.5s ease' }} />
                    </div>
                  )}
                </div>

                <div style={{ flexShrink: 0, fontSize: '12px', fontWeight: 800 }}>
                  {isCurrent ? (
                    <span style={{ color: '#c084fc' }}>{state.progressPct || 15}%</span>
                  ) : isDone ? (
                    <span style={{ color: '#34d399' }}>Concluído</span>
                  ) : state.status === 'stopped' ? (
                    <span style={{ color: '#facc15' }}>Parado</span>
                  ) : state.status === 'failed' ? (
                    <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <AlertCircle size={12} /> Falha
                    </span>
                  ) : isChecked ? (
                    <span style={{ color: '#c084fc' }}>Na fila</span>
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
              data-testid="batch-ai-fix-stop-btn"
              style={{
                width: '100%', padding: '12px 20px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 800,
                cursor: 'pointer', border: '1px solid rgba(239, 68, 68, 0.6)',
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 4px 16px rgba(239, 68, 68, 0.35)'
              }}
            >
              <StopCircle size={17} />
              <span>Parar Fila de IA</span>
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                data-testid="batch-ai-fix-close-btn"
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
                  data-testid="batch-ai-fix-start-btn"
                  style={{
                    flex: 1, padding: '11px 20px', borderRadius: '12px', fontSize: '13.5px', fontWeight: 800,
                    cursor: 'pointer', border: '1px solid rgba(192, 132, 252, 0.65)',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', color: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 4px 16px rgba(168, 85, 247, 0.35)'
                  }}
                >
                  <Sparkles size={16} />
                  <span>Iniciar Fila de IA ({selectedIds.length})</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
