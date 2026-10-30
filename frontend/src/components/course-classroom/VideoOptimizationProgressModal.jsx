import React from 'react';
import {
  Zap,
  CheckCircle2,
  Loader2,
  CloudDownload,
  Cpu,
  CloudUpload,
  Sparkles
} from 'lucide-react';

const STAGES = [
  {
    key: 'downloading',
    title: '1. Download do Vídeo Original (Backblaze B2)',
    desc: 'Baixando o arquivo bruto na nuvem para o servidor de processamento',
    icon: CloudDownload
  },
  {
    key: 'converting',
    title: '2. Conversão FFmpeg (H.264 + FastStart)',
    desc: 'Comprimindo vídeo sem perda visual e movendo o índice (moov atom) para o início',
    icon: Cpu
  },
  {
    key: 'uploading',
    title: '3. Publicação Otimizada na Nuvem',
    desc: 'Enviando MP4 leve com cabeçalho Cache-Control de alta velocidade',
    icon: CloudUpload
  }
];

function getStepOrder(stageKey) {
  if (stageKey === 'downloading') return 1;
  if (stageKey === 'converting') return 2;
  if (stageKey === 'uploading') return 3;
  if (stageKey === 'completed') return 4;
  return 1;
}

export default function VideoOptimizationProgressModal({
  isOpen,
  onClose,
  info,
  initialSizeMb,
  initialFormat
}) {
  if (!isOpen) return null;

  const isCompleted = Boolean(info?.is_optimized && !info?.is_optimizing);
  const currentStage = isCompleted ? 'completed' : (info?.stage || 'converting');
  const currentOrder = getStepOrder(currentStage);

  const rawPct = isCompleted
    ? 100
    : info?.progress_pct && info.progress_pct > 0
    ? info.progress_pct
    : currentOrder === 1
    ? 25
    : currentOrder === 2
    ? 65
    : 90;

  const origMb = info?.original_size_mb || initialSizeMb || info?.size_mb || 0;
  const currentMb = info?.size_mb || 0;
  const savedPct =
    isCompleted && origMb > 0 && currentMb > 0 && origMb > currentMb
      ? Math.round(((origMb - currentMb) / origMb) * 100)
      : null;

  return (
    <div
      data-testid="video-optimization-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(5, 8, 15, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        data-testid="video-optimization-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="video-opt-modal-title"
        style={{
          width: '100%',
          maxWidth: '520px',
          borderRadius: '20px',
          background: 'linear-gradient(165deg, rgba(15, 23, 42, 0.98) 0%, rgba(9, 13, 24, 0.99) 100%)',
          border: isCompleted
            ? '1px solid rgba(16, 185, 129, 0.45)'
            : '1px solid rgba(59, 130, 246, 0.4)',
          boxShadow: isCompleted
            ? '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(16, 185, 129, 0.15)'
            : '0 24px 60px rgba(0, 0, 0, 0.75), 0 0 40px rgba(59, 130, 246, 0.18)',
          padding: '28px',
          color: '#f8fafc',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Cabeçalho do Popup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              background: isCompleted
                ? 'rgba(16, 185, 129, 0.18)'
                : 'rgba(59, 130, 246, 0.18)',
              border: isCompleted
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : '1px solid rgba(59, 130, 246, 0.4)',
              color: isCompleted ? '#34d399' : '#60a5fa'
            }}
          >
            {isCompleted ? (
              <Sparkles size={24} />
            ) : (
              <Loader2 size={24} className="animate-spin" />
            )}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  backgroundColor: isCompleted
                    ? 'rgba(16, 185, 129, 0.2)'
                    : 'rgba(234, 179, 8, 0.2)',
                  color: isCompleted ? '#34d399' : '#facc15'
                }}
              >
                Super Admin • FFmpeg FastStart
              </span>
            </div>
            <h3
              id="video-opt-modal-title"
              style={{
                fontSize: '18px',
                fontWeight: 700,
                margin: '4px 0 2px 0',
                color: '#ffffff'
              }}
            >
              {isCompleted
                ? 'Vídeo Otimizado com Sucesso!'
                : 'Atualizando e Otimizando Vídeo da Aula...'}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: 0 }}>
              {info?.stage_label ||
                (isCompleted
                  ? 'O vídeo agora possui carregamento instantâneo para todos os alunos.'
                  : 'Convertendo para MP4 H.264 com carregamento instantâneo...')}
            </p>
          </div>
        </div>

        {/* Barra de Progresso Principal */}
        <div
          style={{
            backgroundColor: 'rgba(30, 41, 59, 0.7)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '18px',
            border: '1px solid rgba(148, 163, 184, 0.14)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              fontSize: '12.5px',
              fontWeight: 600
            }}
          >
            <span style={{ color: '#cbd5e1' }}>
              {isCompleted ? 'Processamento finalizado' : 'Progresso da atualização'}
            </span>
            <span
              data-testid="video-optimization-progress-pct"
              style={{ color: isCompleted ? '#34d399' : '#60a5fa', fontWeight: 700 }}
            >
              {rawPct}%
            </span>
          </div>

          <div
            style={{
              width: '100%',
              height: '10px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderRadius: '999px',
              overflow: 'hidden',
              border: '1px solid rgba(148, 163, 184, 0.15)'
            }}
          >
            <div
              style={{
                width: `${rawPct}%`,
                height: '100%',
                borderRadius: '999px',
                background: isCompleted
                  ? 'linear-gradient(90deg, #10b981 0%, #34d399 100%)'
                  : 'linear-gradient(90deg, #3b82f6 0%, #eab308 100%)',
                boxShadow: isCompleted
                  ? '0 0 12px rgba(16, 185, 129, 0.6)'
                  : '0 0 12px rgba(59, 130, 246, 0.6)',
                transition: 'width 0.5s ease'
              }}
            />
          </div>

          {/* Resumo de Tamanho Antes / Depois */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid rgba(148, 163, 184, 0.12)',
              fontSize: '12px'
            }}
          >
            <div>
              <span style={{ color: '#94a3b8' }}>Tamanho Original: </span>
              <strong style={{ color: '#f8fafc' }}>
                {origMb > 0 ? `${origMb} MB` : 'Calculando...'}{' '}
                {initialFormat ? `(.${initialFormat})` : ''}
              </strong>
            </div>

            {isCompleted && currentMb > 0 ? (
              <div>
                <span style={{ color: '#94a3b8' }}>Novo Tamanho: </span>
                <strong style={{ color: '#34d399' }}>
                  {currentMb} MB (.MP4){savedPct ? ` • -${savedPct}%` : ''}
                </strong>
              </div>
            ) : (
              <div style={{ color: '#eab308', fontWeight: 600 }}>
                Alvo: .MP4 (FastStart)
              </div>
            )}
          </div>
        </div>

        {/* Lista de Etapas em Tempo Real */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '22px' }}>
          {STAGES.map((step, idx) => {
            const stepNum = idx + 1;
            const isStepDone = isCompleted || currentOrder > stepNum;
            const isStepActive = !isCompleted && currentOrder === stepNum;
            const StepIcon = step.icon;

            return (
              <div
                key={step.key}
                data-testid={`video-opt-step-${step.key}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '12px',
                  backgroundColor: isStepActive
                    ? 'rgba(59, 130, 246, 0.12)'
                    : isStepDone
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(15, 23, 42, 0.45)',
                  border: isStepActive
                    ? '1px solid rgba(59, 130, 246, 0.4)'
                    : isStepDone
                    ? '1px solid rgba(16, 185, 129, 0.25)'
                    : '1px solid rgba(148, 163, 184, 0.1)',
                  opacity: isStepDone || isStepActive ? 1 : 0.55
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: isStepDone
                      ? 'rgba(16, 185, 129, 0.2)'
                      : isStepActive
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(30, 41, 59, 0.7)',
                    color: isStepDone
                      ? '#34d399'
                      : isStepActive
                      ? '#60a5fa'
                      : '#64748b'
                  }}
                >
                  {isStepDone ? (
                    <CheckCircle2 size={17} />
                  ) : isStepActive ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <StepIcon size={17} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: isStepDone
                        ? '#d1fae5'
                        : isStepActive
                        ? '#ffffff'
                        : '#94a3b8'
                    }}
                  >
                    {step.title}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rodapé com APENAS 1 botão de fechar/minimizar (seguindo o padrão de Popups) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            data-testid="video-optimization-modal-close-btn"
            style={{
              width: '100%',
              padding: '11px 18px',
              borderRadius: '12px',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              border: isCompleted
                ? '1px solid rgba(16, 185, 129, 0.5)'
                : '1px solid rgba(148, 163, 184, 0.25)',
              background: isCompleted
                ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                : 'rgba(30, 41, 59, 0.85)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease'
            }}
          >
            {isCompleted ? (
              <>
                <Zap size={15} />
                <span>Concluir e Fechar</span>
              </>
            ) : (
              <span>Minimizar (Continuar Otimizando em 2º Plano)</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
