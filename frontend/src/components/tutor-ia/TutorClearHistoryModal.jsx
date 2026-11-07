import React from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

/**
 * Modal centralizado e estilizado para confirmação de limpeza do histórico do Tutor IA.
 * Atende às diretrizes de UX: centralizado, backdrop translúcido fixo (não fecha ao clicar fora),
 * aviso claro sobre ação destrutiva e botões intuitivos.
 */
export default function TutorClearHistoryModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  isLightBg = false
}) {
  if (!isOpen) return null;

  return (
    <div
      data-testid="tutor-clear-history-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        padding: '16px'
      }}
    >
      <div
        data-testid="tutor-clear-history-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: isLightBg ? '#ffffff' : '#111827',
          borderRadius: '16px',
          border: `1px solid ${isLightBg ? '#fecaca' : 'rgba(239, 68, 68, 0.35)'}`,
          boxShadow: isLightBg
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(239, 68, 68, 0.2)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Topo do Modal: Ícone de Alerta + Título + Fechar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: isLightBg ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 14px rgba(239, 68, 68, 0.3)',
                flexShrink: 0
              }}
            >
              <Trash2 size={22} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 700,
                  color: isLightBg ? '#0f172a' : '#f8fafc'
                }}
              >
                Limpar Histórico da Aula?
              </h3>
              <p
                style={{
                  margin: '3px 0 0 0',
                  fontSize: '12px',
                  color: isLightBg ? '#64748b' : '#94a3b8'
                }}
              >
                Esta ação removerá todas as mensagens salvas nesta aula.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            data-testid="btn-close-clear-modal"
            style={{
              background: 'none',
              border: 'none',
              color: isLightBg ? '#94a3b8' : '#64748b',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Card informativo de atenção */}
        <div
          style={{
            backgroundColor: isLightBg ? '#fff5f5' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${isLightBg ? '#fed7d7' : 'rgba(239, 68, 68, 0.2)'}`,
            borderRadius: '10px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span
            style={{
              fontSize: '12.5px',
              color: isLightBg ? '#991b1b' : '#fca5a5',
              lineHeight: 1.5
            }}
          >
            Ao confirmar, todas as respostas do Tutor IA e perguntas desta aula serão apagadas permanentemente para você.
          </span>
        </div>

        {/* Botões de Ação */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            data-testid="btn-cancel-clear-history"
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: `1px solid ${isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)'}`,
              backgroundColor: 'transparent',
              color: isLightBg ? '#475569' : '#cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            Manter Histórico
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            data-testid="btn-confirm-clear-history"
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Limpando...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Sim, Limpar Histórico</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
