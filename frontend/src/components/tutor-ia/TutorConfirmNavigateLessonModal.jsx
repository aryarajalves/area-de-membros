import React from 'react';
import { BookOpen, ArrowRight, X, PlayCircle } from 'lucide-react';

/**
 * Modal de confirmação para navegação de aula recomendada pelo Tutor IA.
 * Segue o padrão de segurança e UX: centralizado, backdrop translúcido fixo (não fecha ao clicar fora)
 * e botões claros de confirmação e cancelamento.
 */
export default function TutorConfirmNavigateLessonModal({
  isOpen,
  targetLesson,
  onClose,
  onConfirm,
  isLightBg = false
}) {
  if (!isOpen || !targetLesson) return null;

  return (
    <div
      data-testid="tutor-confirm-navigate-modal"
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
        data-testid="tutor-confirm-navigate-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: isLightBg ? '#ffffff' : '#111827',
          borderRadius: '16px',
          border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(168, 85, 247, 0.3)'}`,
          boxShadow: isLightBg
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 25px rgba(168, 85, 247, 0.2)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          animation: 'fadeIn 0.2s ease-out'
        }}
      >
        {/* Cabeçalho do Modal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.25)'
              }}
            >
              <BookOpen size={20} />
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
                Acessar Aula Recomendada?
              </h3>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '12px',
                  color: isLightBg ? '#64748b' : '#94a3b8'
                }}
              >
                O Tutor IA indicou este conteúdo para aprofundar seu estudo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-navigate-modal"
            style={{
              background: 'none',
              border: 'none',
              color: isLightBg ? '#94a3b8' : '#64748b',
              cursor: 'pointer',
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

        {/* Detalhes da Aula */}
        <div
          style={{
            backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.07)'}`,
            borderRadius: '12px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {targetLesson.course_title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#a855f7', fontWeight: 600 }}>
              <span>CURSO:</span>
              <span style={{ color: isLightBg ? '#334155' : '#e2e8f0' }}>{targetLesson.course_title}</span>
            </div>
          )}

          {targetLesson.module_title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#a855f7', fontWeight: 600 }}>
              <span>MÓDULO:</span>
              <span style={{ color: isLightBg ? '#475569' : '#cbd5e1' }}>{targetLesson.module_title}</span>
            </div>
          )}

          <div style={{ marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: isLightBg ? '#94a3b8' : '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              AULA SELECIONADA:
            </span>
            <div
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: isLightBg ? '#0f172a' : '#ffffff',
                marginTop: '3px',
                lineHeight: 1.4
              }}
            >
              {targetLesson.lesson_title}
            </div>
          </div>
        </div>

        {/* Aviso amigável */}
        <p
          style={{
            margin: 0,
            fontSize: '12px',
            lineHeight: 1.5,
            color: isLightBg ? '#64748b' : '#94a3b8'
          }}
        >
          Você será direcionado para o vídeo e os materiais desta aula. Deseja prosseguir agora?
        </p>

        {/* Ações / Botões */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={onClose}
            data-testid="btn-cancel-navigate-lesson"
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              border: `1px solid ${isLightBg ? '#cbd5e1' : 'rgba(255, 255, 255, 0.12)'}`,
              backgroundColor: 'transparent',
              color: isLightBg ? '#475569' : '#cbd5e1',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            Permanecer nesta aula
          </button>

          <button
            type="button"
            onClick={onConfirm}
            data-testid="btn-confirm-navigate-lesson"
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #9333ea, #7c3aed)',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(147, 51, 234, 0.35)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
          >
            <span>Sim, Acessar Aula</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
