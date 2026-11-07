import React, { useState, useEffect } from 'react';
import { Bot, X, Sparkles, MessageCircle } from 'lucide-react';
import TutorChatTab from './TutorChatTab';

export default function TutorFloatingWidget({
  courseId,
  moduleId,
  lessonId,
  currentUser,
  tutorName = 'Tutor IA 24h',
  isLightBg = false,
  onSeekTime,
  onSelectLesson,
  hasTranscription
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [scope, setScope] = useState('lesson'); // 'lesson' | 'all'
  const [isTranscriptionCompleted, setIsTranscriptionCompleted] = useState(
    hasTranscription !== undefined ? Boolean(hasTranscription) : false
  );

  // Verifica se a aula atual possui transcrição concluída
  useEffect(() => {
    if (hasTranscription !== undefined) {
      setIsTranscriptionCompleted(Boolean(hasTranscription));
      return;
    }
    if (!courseId || !lessonId) {
      setIsTranscriptionCompleted(false);
      setIsOpen(false);
      return;
    }
    if (!moduleId) {
      // Fallback caso renderizado isoladamente sem moduleId explícito
      setIsTranscriptionCompleted(true);
      return;
    }

    setIsTranscriptionCompleted(false);
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/transcription`, { headers })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const isDone =
          (data?.status === 'completed' || data?.status === 'ready') &&
          Boolean(data?.full_transcript || data?.summary_markdown || data?.summary_html);
        setIsTranscriptionCompleted(Boolean(isDone));
        if (!isDone) setIsOpen(false);
      })
      .catch(() => {
        setIsTranscriptionCompleted(false);
        setIsOpen(false);
      });
  }, [courseId, moduleId, lessonId, hasTranscription]);

  // Escuta atualizações em tempo real do status da transcrição da aula
  useEffect(() => {
    const handleTranscriptionStatus = (e) => {
      if (e?.detail?.lessonId === lessonId) {
        const isDone =
          e.detail.isCompleted !== undefined
            ? e.detail.isCompleted
            : e.detail.status === 'completed' || e.detail.status === 'ready';
        setIsTranscriptionCompleted(Boolean(isDone));
        if (!isDone) setIsOpen(false);
      }
    };
    window.addEventListener('lesson-transcription-status-updated', handleTranscriptionStatus);
    return () => window.removeEventListener('lesson-transcription-status-updated', handleTranscriptionStatus);
  }, [lessonId]);

  // Atalho de tecla Esc para fechar o widget
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Se a aula não tiver transcrição concluída, não exibe o botão flutuante nem o drawer
  if (!lessonId || !isTranscriptionCompleted) {
    return null;
  }

  const activeLessonId = scope === 'lesson' ? lessonId : null;

  return (
    <>
      {/* Botão Flutuante Discreto no Canto Inferior Direito */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          data-testid="btn-open-tutor-floating-widget"
          title="Tirar dúvidas com o Tutor IA 24h"
          style={{
            position: 'fixed',
            bottom: '26px',
            right: '26px',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '11px 18px',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
            color: '#ffffff',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 6px 24px rgba(124, 58, 237, 0.45)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '13.5px',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(124, 58, 237, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(124, 58, 237, 0.45)';
          }}
        >
          <Bot size={18} />
          <span>Tutor IA</span>
          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              padding: '2px 7px',
              borderRadius: '999px',
              fontSize: '10.5px',
              fontWeight: 800,
              letterSpacing: '0.04em'
            }}
          >
            24H
          </span>
        </button>
      )}

      {/* Gaveta Lateral Flutuante (Drawer) */}
      {isOpen && (
        <div
          data-testid="tutor-floating-drawer"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '420px',
            maxWidth: '100vw',
            zIndex: 1000,
            backgroundColor: isLightBg ? '#ffffff' : '#0b0f19',
            borderLeft: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)'}`,
            boxShadow: '-8px 0 36px rgba(0, 0, 0, 0.75)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideInRight 0.25s ease-out'
          }}
        >
          {/* Cabeçalho da Gaveta */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isLightBg ? '#f8fafc' : 'rgba(255, 255, 255, 0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff'
                }}
              >
                <Bot size={17} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700, color: isLightBg ? '#0f172a' : '#f8fafc' }}>
                  {tutorName}
                </h4>
                <span style={{ fontSize: '11px', color: isLightBg ? '#64748b' : '#94a3b8' }}>
                  Dúvidas instantâneas e apoio ao estudo
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              data-testid="btn-close-tutor-drawer"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                color: isLightBg ? '#0f172a' : '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Filtro de Escopo: [Esta Aula] vs [Todas as Aulas] */}
          {lessonId && (
            <div
              style={{
                padding: '8px 16px',
                display: 'flex',
                gap: '8px',
                borderBottom: `1px solid ${isLightBg ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)'}`,
                backgroundColor: isLightBg ? '#f1f5f9' : 'rgba(0, 0, 0, 0.2)'
              }}
            >
              <button
                type="button"
                onClick={() => setScope('lesson')}
                style={{
                  flex: 1,
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: scope === 'lesson' ? '#7c3aed' : 'transparent',
                  color: scope === 'lesson' ? '#fff' : (isLightBg ? '#64748b' : '#94a3b8'),
                  transition: 'all 0.15s ease'
                }}
                data-testid="btn-scope-lesson"
              >
                Esta Aula
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                style={{
                  flex: 1,
                  padding: '5px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: scope === 'all' ? '#7c3aed' : 'transparent',
                  color: scope === 'all' ? '#fff' : (isLightBg ? '#64748b' : '#94a3b8'),
                  transition: 'all 0.15s ease'
                }}
                data-testid="btn-scope-all"
              >
                Todas as Aulas
              </button>
            </div>
          )}

          {/* Corpo do Chat */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column' }}>
            <TutorChatTab
              courseId={courseId}
              lessonId={activeLessonId}
              currentUser={currentUser}
              isLightBg={isLightBg}
              onSeekTime={onSeekTime}
              onSelectLesson={(lesson) => {
                if (onSelectLesson) onSelectLesson(lesson);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
