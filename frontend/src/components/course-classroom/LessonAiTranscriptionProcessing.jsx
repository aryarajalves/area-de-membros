import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export default function LessonAiTranscriptionProcessing({
  isLightBg,
  textColor,
  subTextColor,
  borderColor,
  isManager,
  onReset
}) {
  return (
    <div
      data-testid="ai-transcription-processing"
      style={{
        marginTop: '20px',
        padding: '48px 24px',
        borderRadius: '14px',
        border: isLightBg ? '1px solid #bfdbfe' : '1px solid rgba(59, 130, 246, 0.35)',
        backgroundColor: isLightBg ? '#f0f9ff' : 'rgba(59, 130, 246, 0.04)',
        boxShadow: isLightBg ? '0 10px 25px -5px rgba(59, 130, 246, 0.1)' : '0 10px 30px -5px rgba(0, 0, 0, 0.5)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px'
      }}
    >
      {/* Spinner giratório com anel e brilho */}
      <div style={{ position: 'relative', width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            border: '3px solid rgba(59, 130, 246, 0.2)',
            borderTopColor: '#3b82f6',
            borderRightColor: '#60a5fa',
            animation: 'spin 1s linear infinite'
          }}
          data-testid="ai-loading-spinner-ring"
        />
        <Sparkles size={26} color="#3b82f6" style={{ animation: 'spin 4s linear infinite reverse' }} />
      </div>

      <div>
        <h4 style={{ fontSize: '17px', fontWeight: 700, color: textColor, margin: '0 0 8px 0' }}>
          Processando Transcrição e Resumo com IA...
        </h4>
        <p style={{ fontSize: '13.5px', color: subTextColor, margin: '0 auto', maxWidth: '480px', lineHeight: 1.6 }}>
          A Inteligência Artificial está ouvindo o áudio da aula, gerando o texto completo e criando o resumo executivo com os principais tópicos. Isso pode levar alguns segundos.
        </p>
      </div>

      {/* Barra de progresso animada com gradiente */}
      <div
        style={{
          width: '100%',
          maxWidth: '320px',
          height: '6px',
          borderRadius: '999px',
          backgroundColor: isLightBg ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div
          style={{
            width: '50%',
            height: '100%',
            borderRadius: '999px',
            background: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)',
            animation: 'shimmer 1.8s ease-in-out infinite alternate',
            position: 'absolute'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: isLightBg ? '#2563eb' : '#60a5fa', fontWeight: 600 }}>
        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Extraindo áudio • Whisper-1 • GPT-4o-mini</span>
      </div>

      {isManager && (
        <button
          type="button"
          data-testid="btn-cancel-transcription"
          onClick={onReset}
          style={{
            marginTop: '4px',
            padding: '6px 14px',
            backgroundColor: 'transparent',
            color: subTextColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          Cancelar / Reiniciar
        </button>
      )}
    </div>
  );
}
