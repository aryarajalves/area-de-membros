import React from 'react';
import { AlertCircle, Clock, RotateCcw, Loader2 } from 'lucide-react';
import { parseUtcDate } from '../student-management/studentDateUtils';

/**
 * Formata data e horário com precisão de segundos no fuso de Brasília.
 */
export function formatErrorDateTime(dateInput) {
  if (!dateInput) return null;
  const d = parseUtcDate(dateInput) || new Date(dateInput);
  if (!d || isNaN(d.getTime())) return null;

  try {
    const datePart = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const timePart = d.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return `${datePart} às ${timePart}`;
  } catch {
    return null;
  }
}

/**
 * Tela de erro técnico da transcrição IA.
 * Restrita a Administradores e Super Admins (alunos nunca visualizam erros técnicos de infraestrutura).
 */
export default function LessonAiTranscriptionErrorState({
  errorMessage,
  updatedAt,
  createdAt,
  onRetry,
  isRetrying = false,
  isLightBg = false
}) {
  const displayDateTime = formatErrorDateTime(updatedAt || createdAt) || formatErrorDateTime(new Date());
  const errorText = errorMessage?.trim() || 'Ocorreu uma falha no processamento do vídeo da aula. Verifique se o vídeo possui áudio válido e tente novamente.';

  return (
    <div
      data-testid="ai-transcription-failed"
      style={{
        marginTop: '20px',
        padding: '30px 24px',
        borderRadius: '16px',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        backgroundColor: isLightBg ? '#fef2f2' : 'rgba(239, 68, 68, 0.06)',
        boxShadow: '0 8px 30px rgba(239, 68, 68, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '14px'
      }}
    >
      <div
        style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          backgroundColor: 'rgba(239, 68, 68, 0.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ef4444'
        }}
      >
        <AlertCircle size={28} />
      </div>

      <div>
        <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#ef4444', margin: '0 0 6px 0' }}>
          Falha no Processamento da Transcrição
        </h4>
        <span
          data-testid="ai-transcription-error-badge-role"
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: '#f87171',
            backgroundColor: 'rgba(239, 68, 68, 0.14)',
            padding: '2px 8px',
            borderRadius: '999px',
            border: '1px solid rgba(239, 68, 68, 0.25)'
          }}
        >
          Visível apenas para Administradores
        </span>
      </div>

      {/* Badge com Data e Horário do Erro */}
      {displayDateTime && (
        <div
          data-testid="ai-transcription-error-timestamp"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: isLightBg ? '#475569' : '#cbd5e1',
            backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            padding: '4px 12px',
            borderRadius: '8px'
          }}
        >
          <Clock size={13} color="#f87171" />
          <span>Ocorrido em: <strong style={{ color: '#ef4444' }}>{displayDateTime}</strong></span>
        </div>
      )}

      {/* Caixa com o Erro Capturado */}
      <div
        data-testid="ai-transcription-error-details"
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: isLightBg ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          borderRadius: '10px',
          padding: '12px 16px',
          textAlign: 'left',
          fontSize: '12.5px',
          lineHeight: '1.5',
          color: isLightBg ? '#334155' : '#e2e8f0',
          fontFamily: 'monospace',
          wordBreak: 'break-word',
          maxHeight: '160px',
          overflowY: 'auto'
        }}
      >
        <div style={{ color: '#f87171', fontWeight: 700, marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Detalhes Técnicos do Erro:
        </div>
        <div>{errorText}</div>
      </div>

      {/* Botão de Tentar Novamente */}
      {onRetry && (
        <button
          type="button"
          data-testid="btn-retry-ai-transcription"
          disabled={isRetrying}
          onClick={onRetry}
          style={{
            marginTop: '4px',
            padding: '10px 22px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: isRetrying ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)',
            opacity: isRetrying ? 0.7 : 1,
            transition: 'all 0.2s ease'
          }}
        >
          {isRetrying ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Iniciando reprocessamento...</span>
            </>
          ) : (
            <>
              <RotateCcw size={16} />
              <span>Tentar Novamente</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
