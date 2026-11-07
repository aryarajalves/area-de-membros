import React from 'react';
import { Sparkles, CheckCircle2, Loader2, Square, CheckSquare, Clock, Folder, AlertCircle } from 'lucide-react';
import { formatLessonDuration, formatSecondsToClock } from './lessonUtils';

/**
 * Componente individual de aula para a Fila Automática de IA 1 a 1 (Opção A).
 * Exibe em 3 linhas estruturadas:
 * - Linha 1: Número da Fila + Identificação da Aula + Título + Badge de Duração
 * - Linha 2: Módulo + Tags de Pendências (Nome IA, Descrição, Capítulos)
 * - Linha 3: Barra de progresso animada e estágio atual de execução
 */
export default function BatchAiFixItem({
  item,
  index,
  state = { status: 'idle', progressPct: 0 },
  isChecked,
  isRunning,
  onToggle
}) {
  const { mod, lesson, audit } = item;
  const isDone = state.status === 'completed';
  const isCurrent = state.status === 'running';

  // Identificação do número da aula no módulo
  const getLessonLabel = () => {
    if (lesson.order_index !== undefined && lesson.order_index !== null) {
      return `Aula ${String(lesson.order_index + 1).padStart(2, '0')}`;
    }
    if (Array.isArray(mod?.lessons)) {
      const pos = mod.lessons.findIndex((l) => l.id === lesson.id);
      if (pos >= 0) return `Aula ${String(pos + 1).padStart(2, '0')}`;
    }
    return `Aula ${String(index + 1).padStart(2, '0')}`;
  };

  const lessonLabel = getLessonLabel();
  const currentTitle = state.newTitle || lesson.title || 'Sem título';

  // Resolução da Duração do Vídeo
  const getDurationDisplay = () => {
    if (state.audioDurationSeconds) {
      return formatSecondsToClock(state.audioDurationSeconds);
    }
    if (lesson.duration) {
      return formatLessonDuration(lesson.duration);
    }
    if (lesson.duration_seconds) {
      return formatSecondsToClock(lesson.duration_seconds);
    }
    if (isCurrent) {
      return 'Detectando...';
    }
    return null;
  };

  const durationStr = getDurationDisplay();

  return (
    <div
      data-testid={`batch-ai-item-${lesson.id}`}
      onClick={onToggle}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '12px 14px',
        borderRadius: '14px',
        cursor: isRunning || isDone ? 'default' : 'pointer',
        backgroundColor: isCurrent
          ? 'rgba(168, 85, 247, 0.14)'
          : isDone
          ? 'rgba(16, 185, 129, 0.09)'
          : isChecked
          ? 'rgba(30, 41, 59, 0.7)'
          : 'rgba(15, 23, 42, 0.45)',
        border: isCurrent
          ? '1px solid rgba(168, 85, 247, 0.55)'
          : isDone
          ? '1px solid rgba(16, 185, 129, 0.4)'
          : isChecked
          ? '1px solid rgba(192, 132, 252, 0.3)'
          : '1px solid rgba(148, 163, 184, 0.12)',
        opacity: !isChecked && !isDone ? 0.6 : 1,
        transition: 'all 0.2s ease'
      }}
    >
      {/* LINHA 1: Ícone de seleção/status + #Ordem + Aula + Título + Badge Duração + Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              minWidth: 0,
              fontSize: '13px',
              fontWeight: 700,
              color: isDone ? '#d1fae5' : '#f8fafc',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600 }}>#{index + 1}</span>
            <span style={{ color: '#c084fc', backgroundColor: 'rgba(168, 85, 247, 0.18)', padding: '1px 6px', borderRadius: '5px', fontSize: '11.5px', fontWeight: 800 }}>
              🎓 {lessonLabel}
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={currentTitle}>
              {currentTitle}
            </span>
          </div>
        </div>

        {/* Duração e Status da Fila */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {durationStr && (
            <span
              data-testid={`batch-ai-duration-${lesson.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: isDone ? '#6ee7b7' : isCurrent ? '#d8b4fe' : '#cbd5e1',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                padding: '2px 8px',
                borderRadius: '8px'
              }}
            >
              <Clock size={11} />
              <span>{durationStr}</span>
            </span>
          )}

          <div style={{ fontSize: '11.5px', fontWeight: 800 }}>
            {isCurrent ? (
              <span style={{ color: '#c084fc' }}>{state.progressPct || 15}%</span>
            ) : isDone ? (
              <span style={{ color: '#34d399' }}>Concluído</span>
            ) : state.status === 'stopped' ? (
              <span style={{ color: '#facc15' }}>Parado</span>
            ) : state.status === 'failed' ? (
              <span style={{ color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <AlertCircle size={11} /> Falha
              </span>
            ) : isChecked ? (
              <span style={{ color: '#c084fc' }}>Na fila</span>
            ) : (
              <span style={{ color: '#64748b' }}>Ignorado</span>
            )}
          </div>
        </div>
      </div>

      {/* LINHA 2: Contexto do Módulo + Tags de Pendências IA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingLeft: '28px', fontSize: '11px' }}>
        <span
          data-testid={`batch-ai-module-${lesson.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: '#cbd5e1',
            backgroundColor: 'rgba(51, 65, 85, 0.55)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            padding: '1.5px 7px',
            borderRadius: '6px',
            fontWeight: 600
          }}
        >
          <Folder size={11} color="#94a3b8" />
          <span>Módulo: {mod?.title || 'Sem Módulo'}</span>
        </span>

        {!isDone && audit?.bad_title && (
          <span style={{ color: '#c084fc', backgroundColor: 'rgba(168, 85, 247, 0.14)', border: '1px solid rgba(168, 85, 247, 0.25)', padding: '1.5px 7px', borderRadius: '6px', fontWeight: 600 }}>
            ✨ S/ Nome IA
          </span>
        )}
        {!isDone && audit?.missing_description && (
          <span style={{ color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '1.5px 7px', borderRadius: '6px', fontWeight: 600 }}>
            📝 S/ Descrição
          </span>
        )}
        {!isDone && audit?.missing_chapters && (
          <span style={{ color: '#fb923c', backgroundColor: 'rgba(251, 146, 60, 0.12)', border: '1px solid rgba(251, 146, 60, 0.25)', padding: '1.5px 7px', borderRadius: '6px', fontWeight: 600 }}>
            📑 S/ Capítulos
          </span>
        )}

        {isDone && (
          <span style={{ color: '#34d399', fontWeight: 600 }}>
            ✅ Pendências de IA resolvidas com sucesso
          </span>
        )}
      </div>

      {/* LINHA 3: Barra de Progresso e Estágio Atual (durante execução ou em erro) */}
      {(isCurrent || state.status === 'failed' || state.status === 'stopped') && (
        <div style={{ paddingLeft: '28px', marginTop: '2px' }}>
          {state.stageLabel && (
            <div style={{ fontSize: '11px', color: isCurrent ? '#d8b4fe' : state.status === 'failed' ? '#f87171' : '#facc15', marginBottom: '4px', fontWeight: 600 }}>
              {state.stageLabel}
            </div>
          )}
          {isCurrent && (
            <div style={{ width: '100%', height: '5px', backgroundColor: 'rgba(15, 23, 42, 0.85)', borderRadius: '999px', overflow: 'hidden' }}>
              <div
                style={{
                  width: `${state.progressPct || 15}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #8b5cf6 0%, #10b981 100%)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
