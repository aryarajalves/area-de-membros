import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, Timer, Clock, Hourglass } from 'lucide-react';

function parseDurationMinutes(durationVal) {
  if (!durationVal) return 0;
  if (typeof durationVal === 'number' && durationVal > 0) return durationVal;
  if (typeof durationVal === 'string') {
    const clean = durationVal.trim();
    if (clean.includes(':')) {
      const parts = clean.split(':').map((p) => Number(p) || 0);
      if (parts.length === 3) {
        return parts[0] * 60 + parts[1] + parts[2] / 60;
      }
      if (parts.length === 2) {
        return parts[0] + parts[1] / 60;
      }
    }
    const num = Number(clean);
    if (!Number.isNaN(num) && num > 0) return num;
  }
  return 0;
}

export default function LessonAiTranscriptionProcessing({
  isLightBg,
  textColor,
  subTextColor,
  borderColor,
  isManager,
  onReset,
  lesson,
  progressData
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Inicializa o cronômetro no momento da montagem e atualiza a cada 1 segundo
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lesson?.id]);

  // Formata segundos em cronômetro MM:SS
  const formatClock = (totalSec) => {
    const sec = Math.max(0, Math.round(totalSec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Duração real em minutos (suporta número ou formato "01:48:56" / "15:30")
  const parsedMin = parseDurationMinutes(lesson?.duration);
  const durationMin = parsedMin > 0 ? parsedMin : 45;
  const estimatedTotalSeconds = Math.max(45, Math.min(420, Math.round(durationMin * 2.2)));

  // Se o backend enviou progresso real dos blocos (progress_percent), combina com micro-avanço suave por segundo
  const backendPercent = Number(progressData?.progress_percent) || 0;
  let progressPercent = 5;

  if (backendPercent > 0) {
    // Micro-interpolação suave (+1% a cada 4s dentro da janela da etapa atual, limitada a 97%)
    const microBoost = Math.min(8, Math.floor((elapsedSeconds % 32) / 4));
    progressPercent = Math.min(97, Math.max(5, backendPercent + microBoost));
  } else {
    // Curva assintótica suave caso ainda esteja nos primeiros segundos antes do primeiro poll
    const rawProgress = 94 * (1 - Math.exp(-elapsedSeconds / (estimatedTotalSeconds * 0.65)));
    progressPercent = Math.min(95, Math.max(5, Math.round(rawProgress)));
  }

  const remainingPercent = 100 - progressPercent;
  const backendRemainingSec = Number(progressData?.estimated_remaining_seconds);
  const remainingSeconds = backendRemainingSec > 0
    ? Math.max(5, backendRemainingSec - (elapsedSeconds % 15))
    : Math.max(10, Math.round(estimatedTotalSeconds - elapsedSeconds));

  // Etapa descritiva real vinda do backend ou fallback dinâmico conforme o percentual
  let currentStepText = progressData?.progress_step || 'Iniciando extração do áudio da aula via FFmpeg...';
  if (!progressData?.progress_step) {
    if (progressPercent >= 20 && progressPercent < 45) {
      currentStepText = 'Fatiando áudio em blocos e enviando para o Whisper da OpenAI...';
    } else if (progressPercent >= 45 && progressPercent < 75) {
      currentStepText = 'Transcrevendo fala e sincronizando minutagem e timestamps com IA...';
    } else if (progressPercent >= 75 && progressPercent < 90) {
      currentStepText = 'Elaborando resumo executivo, tópicos-chave e capítulos com GPT-4o...';
    } else if (progressPercent >= 90) {
      currentStepText = 'Sincronizando documento pedagógico e finalizando transcrição...';
    }
  }

  return (
    <div
      data-testid="ai-transcription-processing"
      style={{
        marginTop: '20px',
        padding: '40px 24px',
        borderRadius: '16px',
        border: isLightBg ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.35)',
        backgroundColor: isLightBg ? '#f0f9ff' : 'rgba(15, 23, 42, 0.65)',
        boxShadow: isLightBg ? '0 10px 25px -5px rgba(59, 130, 246, 0.1)' : '0 12px 35px -5px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '22px'
      }}
    >
      {/* Spinner central com ícone de cronômetro e brilho */}
      <div style={{ position: 'relative', width: '74px', height: '74px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: '#3b82f6',
            borderRightColor: '#8b5cf6',
            animation: 'spin 1.2s linear infinite'
          }}
          data-testid="ai-loading-spinner-ring"
        />
        <Timer size={28} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }} />
      </div>

      <div>
        <h4 style={{ fontSize: '18px', fontWeight: 700, color: textColor, margin: '0 0 6px 0' }}>
          Transcrevendo Vídeo com Inteligência Artificial
        </h4>
        <p style={{ fontSize: '13px', color: subTextColor, margin: '0 auto', maxWidth: '520px', lineHeight: 1.5 }}>
          {currentStepText}
        </p>
      </div>

      {/* Caixa de Métricas: Cronômetro e Porcentagens */}
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '16px 20px',
          borderRadius: '12px',
          backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
          border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Badges superiores: Cronômetro, Progresso e Falta */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '12.5px' }}>
          {/* Cronômetro */}
          <div
            data-testid="ai-timer-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#3b82f6',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            <Clock size={13} />
            <span>Tempo decorrido: {formatClock(elapsedSeconds)}</span>
          </div>

          {/* Porcentagem Concluída e Restante */}
          <div
            data-testid="ai-progress-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#a78bfa',
              fontWeight: 700
            }}
          >
            <Sparkles size={13} />
            <span>{progressPercent}% concluído • Faltam {remainingPercent}%</span>
          </div>

          {/* Tempo restante aproximado */}
          <div
            data-testid="ai-remaining-badge"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            <Hourglass size={13} />
            <span>~{formatClock(remainingSeconds)} restantes</span>
          </div>
        </div>

        {/* Barra de Progresso Realista */}
        <div
          data-testid="ai-progress-bar-container"
          style={{
            width: '100%',
            height: '10px',
            borderRadius: '999px',
            backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            data-testid="ai-progress-bar-fill"
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #10b981)',
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.6)',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>

        {/* Rodapé da caixa de métricas */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: subTextColor }}>
          <span>Início: 0%</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: isLightBg ? '#2563eb' : '#60a5fa' }}>
            <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
            <span>Processando em segundo plano</span>
          </span>
          <span>Conclusão: 100%</span>
        </div>
      </div>

      {isManager && (
        <button
          type="button"
          data-testid="btn-cancel-transcription"
          onClick={onReset}
          style={{
            marginTop: '2px',
            padding: '7px 16px',
            backgroundColor: 'transparent',
            color: subTextColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          Cancelar / Reiniciar
        </button>
      )}
    </div>
  );
}
