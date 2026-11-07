import React from 'react';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  StopCircle,
  Check,
  X,
  Layers
} from 'lucide-react';

export default function KnowledgeBatchProgressModal({
  isOpen,
  isRunning,
  isCompleted,
  isCancelled,
  total = 0,
  currentStep = 0,
  currentLessonTitle = '',
  progressPct = 0,
  logs = [],
  stats = { totalSuccess: 0, totalFailed: 0, totalChunks: 0, totalQa: 0 },
  onCancel,
  onClose,
  isLightBg = false
}) {
  if (!isOpen) return null;

  const modalBg = isLightBg ? '#ffffff' : '#0b1120';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#64748b' : '#94a3b8';
  const borderColor = isCompleted
    ? 'rgba(16, 185, 129, 0.5)'
    : isCancelled
    ? 'rgba(245, 158, 11, 0.5)'
    : 'rgba(13, 148, 136, 0.45)';

  return (
    <div
      data-testid="knowledge-batch-progress-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '16px'
      }}
      onClick={(e) => {
        // Regra UX: Não fecha ao clicar fora durante a sincronização
        e.stopPropagation();
      }}
    >
      <div
        data-testid="knowledge-batch-progress-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="batch-progress-modal-title"
        style={{
          width: '94%',
          maxWidth: '560px',
          borderRadius: '16px',
          backgroundColor: modalBg,
          border: `1px solid ${borderColor}`,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(13, 148, 136, 0.22)',
          padding: '26px 24px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              backgroundColor: isCompleted
                ? 'rgba(16, 185, 129, 0.15)'
                : isCancelled
                ? 'rgba(245, 158, 11, 0.15)'
                : 'rgba(13, 148, 136, 0.15)',
              border: `1px solid ${
                isCompleted
                  ? 'rgba(16, 185, 129, 0.4)'
                  : isCancelled
                  ? 'rgba(245, 158, 11, 0.4)'
                  : 'rgba(13, 148, 136, 0.4)'
              }`
            }}
          >
            {isCompleted ? (
              <CheckCircle2 size={24} color="#10b981" />
            ) : isCancelled ? (
              <AlertCircle size={24} color="#f59e0b" />
            ) : (
              <Sparkles size={24} color="#0d9488" className="animate-pulse" />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              id="batch-progress-modal-title"
              data-testid="batch-progress-modal-title"
              style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: textColor }}
            >
              {isCompleted
                ? 'Sincronização em Lote Concluída!'
                : isCancelled
                ? 'Sincronização Interrompida'
                : 'Sincronizando Base de Conhecimento RAG'}
            </h3>
            <span style={{ fontSize: '12.5px', color: subTextColor, marginTop: '2px', display: 'block' }}>
              {isCompleted
                ? `${stats.totalSuccess} aulas indexadas no RAG com geração automática de 5 Q&A.`
                : isCancelled
                ? `Processo interrompido. ${stats.totalSuccess} aulas foram indexadas com sucesso.`
                : 'Dividindo transcrição em trechos inteligentes e gerando 5 perguntas e respostas por aula com IA.'}
            </span>
          </div>
        </div>

        {/* Seção de Progresso e Porcentagem */}
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
            border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.07)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 600, color: textColor }}>
              {isCompleted
                ? '100% Concluído'
                : `Progresso: Aula ${currentStep} de ${total}`}
            </span>
            <span
              data-testid="batch-progress-percentage"
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: isCompleted ? '#10b981' : '#0d9488'
              }}
            >
              {progressPct}%
            </span>
          </div>

          {/* Barra de Progresso com Transição e Brilho */}
          <div
            style={{
              height: '10px',
              width: '100%',
              borderRadius: '999px',
              backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <div
              data-testid="batch-progress-bar-fill"
              style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, progressPct))}%`,
                transition: 'width 0.35s ease-in-out',
                background: isCompleted
                  ? 'linear-gradient(90deg, #0d9488, #10b981)'
                  : isCancelled
                  ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                  : 'linear-gradient(90deg, #0d9488, #2563eb)'
              }}
            />
          </div>

          {/* Destaque da Aula que está sendo indexada no momento */}
          {isRunning && currentLessonTitle && (
            <div
              data-testid="current-indexing-lesson"
              style={{
                marginTop: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: isLightBg ? '#ecfdf5' : 'rgba(13, 148, 136, 0.12)',
                border: isLightBg ? '1px solid #a7f3d0' : '1px solid rgba(13, 148, 136, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Loader2 size={16} color="#0d9488" className="animate-spin" style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: 600, display: 'block' }}>
                  INDEXANDO AGORA:
                </span>
                <span
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: textColor,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block'
                  }}
                  title={currentLessonTitle}
                >
                  "{currentLessonTitle}"
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Resumo de Métricas (Visível ao Concluir ou Interromper) */}
        {(isCompleted || isCancelled) && (
          <div
            data-testid="batch-summary-stats"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px'
            }}
          >
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.03)',
                border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '11px', color: subTextColor, textTransform: 'uppercase' }}>Aulas Processadas</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: textColor, marginTop: '2px' }}>
                {logs.length} / {total}
              </div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: isLightBg ? '#ecfdf5' : 'rgba(16, 185, 129, 0.1)',
                border: isLightBg ? '1px solid #a7f3d0' : '1px solid rgba(16, 185, 129, 0.25)',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '11px', color: '#10b981', textTransform: 'uppercase' }}>Indexadas com Sucesso</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                {stats.totalSuccess}
              </div>
            </div>

            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: isLightBg ? '#f5f3ff' : 'rgba(168, 85, 247, 0.1)',
                border: isLightBg ? '1px solid #ddd6fe' : '1px solid rgba(168, 85, 247, 0.25)',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '11px', color: '#a855f7', textTransform: 'uppercase' }}>Fragmentos Criados</span>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#a855f7', marginTop: '2px' }}>
                {stats.totalChunks}
              </div>
            </div>
          </div>
        )}

        {/* Lista de Aulas Processadas (Histórico em Tempo Real) */}
        <div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: subTextColor, marginBottom: '6px', display: 'block' }}>
            Histórico das Aulas ({logs.length} de {total}):
          </span>

          <div
            data-testid="batch-progress-logs-list"
            style={{
              maxHeight: '160px',
              overflowY: 'auto',
              borderRadius: '8px',
              backgroundColor: isLightBg ? '#f8fafc' : 'rgba(0, 0, 0, 0.25)',
              border: isLightBg ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.05)',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px', fontSize: '12px', color: subTextColor }}>
                Iniciando indexação das aulas selecionadas...
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  data-testid={`batch-log-item-${log.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: isLightBg ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                    border: log.status === 'success'
                      ? '1px solid rgba(16, 185, 129, 0.2)'
                      : '1px solid rgba(239, 68, 68, 0.25)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    {log.status === 'success' ? (
                      <Check size={14} color="#10b981" style={{ flexShrink: 0 }} />
                    ) : (
                      <X size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        fontSize: '12px',
                        color: textColor,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {log.title}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      color: log.status === 'success' ? '#10b981' : '#ef4444',
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                  >
                    {log.status === 'success'
                      ? `+${log.chunks} chunks (${log.qa_count || 5} Q&A)`
                      : 'Falha'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rodapé de Ações - Regra UX: 1 botão único para fechar/concluir */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          {isRunning ? (
            <button
              type="button"
              onClick={onCancel}
              data-testid="btn-cancel-batch-index"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <StopCircle size={15} />
              <span>Interromper Sincronização</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              data-testid="btn-close-batch-progress"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '8px',
                backgroundColor: '#0d9488',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.4)'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Concluir e Fechar</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
