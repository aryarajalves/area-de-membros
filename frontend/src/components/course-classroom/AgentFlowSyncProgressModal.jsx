import React, { useState, useEffect } from 'react';
import { Loader2, Database, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AgentFlowSyncProgressModal({
  isOpen,
  lessonTitle = '',
  isLightBg = false
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    'Conectando com o servidor do AgentFlow...',
    'Estruturando metadados e capítulos da aula...',
    'Dividindo transcrição em trechos inteligentes (chunks)...',
    'Gerando perguntas, respostas e resumo para o robô de IA...',
    'Indexando e salvando na Base de Conhecimento RAG...'
  ];

  // Alterna as mensagens dos passos a cada 3.5 segundos para dar feedback dinâmico
  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % steps.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [isOpen, steps.length]);

  if (!isOpen) return null;

  const modalBg = isLightBg ? '#ffffff' : '#0b1120';
  const textColor = isLightBg ? '#0f172a' : '#f8fafc';
  const subTextColor = isLightBg ? '#475569' : '#94a3b8';
  const borderColor = isLightBg ? '#e2e8f0' : 'rgba(99, 102, 241, 0.35)';

  return (
    <div
      className="custom-modal-overlay"
      data-testid="agentflow-sync-progress-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1400,
        padding: '16px'
      }}
      onClick={(e) => {
        // Regra UX: Bloqueante, não deve fechar ao clicar fora durante a sincronização
        e.stopPropagation();
      }}
    >
      <div
        className="table-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agentflow-sync-progress-modal-title"
        data-testid="agentflow-sync-progress-modal"
        style={{
          width: '92%',
          maxWidth: '440px',
          padding: '28px 24px',
          borderRadius: '16px',
          backgroundColor: modalBg,
          border: `1px solid ${borderColor}`,
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(99, 102, 241, 0.22)',
          textAlign: 'center',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ícone com Glow e Animação */}
        <div
          style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            margin: '0 auto 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              border: '2px solid rgba(99, 102, 241, 0.35)'
            }}
          />
          <Loader2
            size={36}
            className="animate-spin"
            style={{ color: '#818cf8', zIndex: 1 }}
          />
          <Database
            size={18}
            style={{
              position: 'absolute',
              color: '#818cf8',
              zIndex: 2,
              opacity: 0.9
            }}
          />
        </div>

        {/* Título */}
        <h3
          id="agentflow-sync-progress-modal-title"
          data-testid="agentflow-sync-progress-modal-title"
          style={{
            fontSize: '17px',
            fontWeight: 700,
            color: textColor,
            margin: '0 0 6px 0'
          }}
        >
          Sincronizando com o AgentFlow...
        </h3>

        {/* Aula Sendo Sincronizada */}
        {lessonTitle && (
          <div
            style={{
              display: 'inline-block',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
              fontSize: '12px',
              color: subTextColor,
              marginBottom: '14px',
              fontWeight: 500
            }}
            title={lessonTitle}
          >
            Aula: <strong style={{ color: textColor }}>{lessonTitle}</strong>
          </div>
        )}

        {/* Passo Atual com Ícone de Sparkles */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            margin: '8px 0 16px',
            minHeight: '40px',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}
        >
          <Sparkles size={14} style={{ color: '#818cf8', flexShrink: 0 }} />
          <span
            data-testid="agentflow-sync-current-step"
            style={{
              fontSize: '12.5px',
              color: isLightBg ? '#4338ca' : '#a5b4fc',
              fontWeight: 500,
              lineHeight: 1.4
            }}
          >
            {steps[currentStepIndex]}
          </span>
        </div>

        {/* Barra de Progresso com Pulso Visual */}
        <div
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '999px',
            backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            marginBottom: '18px'
          }}
        >
          <div
            style={{
              height: '100%',
              width: '65%',
              borderRadius: '999px',
              background: 'linear-gradient(90deg, #6366f1, #818cf8, #a855f7)',
              animation: 'pulse 1.8s ease-in-out infinite'
            }}
          />
        </div>

        {/* Alerta de Retenção na Tela */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.3)',
            color: '#eab308',
            fontSize: '12px',
            lineHeight: 1.45,
            fontWeight: 500
          }}
        >
          <ShieldAlert size={16} style={{ flexShrink: 0 }} />
          <span>
            Por favor, <strong>não saia desta tela</strong> até a conclusão da sincronização.
          </span>
        </div>
      </div>
    </div>
  );
}
