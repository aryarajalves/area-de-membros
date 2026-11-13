import React from 'react';
import { Loader2, PlayCircle } from 'lucide-react';

/**
 * Popup modal centralizado exibido durante a transição entre aulas
 * enquanto as informações da nova aula estão sendo carregadas.
 * Fecha automaticamente quando isOpen passa para false.
 */
export default function LessonSwitchingModal({ isOpen, lessonTitle }) {
  if (!isOpen) return null;

  return (
    <div
      data-testid="lesson-switching-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Carregando próxima aula"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(2, 6, 23, 0.76)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '28px 24px',
          borderRadius: '18px',
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(9, 13, 22, 0.98))',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.7), 0 0 32px rgba(56, 189, 248, 0.16)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '14px'
        }}
      >
        <div
          style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            backgroundColor: 'rgba(56, 189, 248, 0.14)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.25)'
          }}
        >
          <Loader2
            size={28}
            color="#38bdf8"
            style={{ animation: 'spin 0.9s linear infinite' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
            Carregando aula...
          </h3>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
            Buscando informações, transcrição e comentários da próxima aula.
          </p>
        </div>

        {lessonTitle && (
          <div
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <PlayCircle size={15} color="#38bdf8" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#e2e8f0',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {lessonTitle}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
